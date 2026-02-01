import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '200kb' }));
app.use(express.urlencoded({ extended: true, limit: '200kb' }));

// Allow the app to run behind a /api prefix (Vercel rewrites, local proxy)
app.use((req, _res, next) => {
  if (req.url === '/api') {
    req.url = '/';
  } else if (req.url.startsWith('/api/')) {
    req.url = req.url.replace(/^\/api/, '');
  }

  next();
});

const normalizeEmail = (email) => email?.trim().toLowerCase();
const normalizeSlug = (slug) => slug?.trim().toLowerCase();
const normalizeCategory = (category) => category?.trim().toLowerCase().replace(/-/g, ' ');
const allowedCategories = new Set(['law', 'politics', 'foreign affairs', 'reviews']);

const parseImagePayload = (imageBase64, imageMime) => {
  if (!imageBase64) {
    return { imageBuffer: null, imageMime: null };
  }

  try {
    const cleaned = imageBase64.includes(',')
      ? imageBase64.split(',').pop()
      : imageBase64;
    const buffer = Buffer.from(cleaned, 'base64');
    if (!buffer.length) {
      return { error: 'Invalid image data.' };
    }
    return { imageBuffer: buffer, imageMime: imageMime || null };
  } catch (error) {
    return { error: 'Invalid image data.' };
  }
};

app.post('/admin/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const insertResult = await pool.query(
      `INSERT INTO admins (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    return res.status(201).json({ admin: insertResult.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create admin.', error: error.message });
  }
});

app.post('/admin/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM admins WHERE email = $1',
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const admin = result.rows[0];
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    await pool.query('UPDATE admins SET last_login = NOW() WHERE id = $1', [admin.id]);

    const token = jwt.sign(
      { sub: admin.id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to sign in.', error: error.message });
  }
});

const getArticleIdentifier = (reqBody) => {
  const id = reqBody?.id || null;
  const slug = normalizeSlug(reqBody?.slug) || null;
  if (!id && !slug) {
    return { error: 'Article id or slug is required.' };
  }
  return { id, slug };
};

app.patch('/articles/edit', async (req, res) => {
  const { id, slug, error } = getArticleIdentifier(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const {
    title,
    newSlug,
    summary,
    content,
    category,
    is_breaking,
    published,
    author,
    image_base64,
    image_mime,
  } = req.body;

  const { imageBuffer, imageMime, error: imageError } = parseImagePayload(
    image_base64,
    image_mime
  );
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  try {
    const result = await pool.query(
      `UPDATE articles
       SET title = COALESCE($3, title),
           slug = COALESCE($4, slug),
           summary = COALESCE($5, summary),
           content = COALESCE($6, content),
           category = COALESCE($7, category),
           is_breaking = COALESCE($8, is_breaking),
           published = COALESCE($9, published),
           author = COALESCE($10, author),
           image_url = COALESCE($11, image_url),
           image_mime = COALESCE($12, image_mime),
           updated_at = NOW()
       WHERE id = $1 OR slug = $2
       RETURNING *`,
      [
        id,
        slug,
        title,
        normalizeSlug(newSlug),
        summary,
        content,
        category,
        is_breaking,
        published,
        author,
        imageBuffer,
        imageMime,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    return res.status(200).json({ article: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update article.', error: error.message });
  }
});

app.post('/articles/publish', async (req, res) => {
  const {
    title,
    slug,
    summary,
    content,
    category,
    is_breaking,
    author,
    image_base64,
    image_mime,
  } = req.body;

  const normalizedSlug = normalizeSlug(slug);

  if (!title || !normalizedSlug || !content || !category) {
    return res
      .status(400)
      .json({ message: 'Title, slug, content, and category are required.' });
  }

  const { imageBuffer, imageMime, error: imageError } = parseImagePayload(
    image_base64,
    image_mime
  );
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  try {
    const existing = await pool.query('SELECT id FROM articles WHERE slug = $1', [normalizedSlug]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Slug already in use.' });
    }

    const result = await pool.query(
      `INSERT INTO articles
       (title, slug, summary, content, category, is_breaking, published, author, image_url, image_mime)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8, $9)
       RETURNING *`,
      [
        title,
        normalizedSlug,
        summary || null,
        content,
        category,
        is_breaking ?? false,
        author || null,
        imageBuffer,
        imageMime,
      ]
    );

    return res.status(201).json({ article: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to publish article.', error: error.message });
  }
});

app.get('/articles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM articles ORDER BY created_at DESC');
    return res.status(200).json({ articles: result.rows });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch articles.', error: error.message });
  }
});

app.get('/articles/category/:category', async (req, res) => {
  const category = normalizeCategory(req.params.category);

  if (!allowedCategories.has(category)) {
    return res.status(400).json({
      message: 'Invalid category. Allowed: law, politics, foreign affairs, reviews.',
    });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM articles WHERE category = $1 ORDER BY created_at DESC',
      [category]
    );
    return res.status(200).json({ articles: result.rows });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch articles.', error: error.message });
  }
});

app.delete('/articles/delete', async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: 'Article id is required.' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM articles WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    return res.status(200).json({ deleted: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete article.', error: error.message });
  }
});

app.get('/editorial-boards', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM editorial_boards ORDER BY name ASC');
    return res.status(200).json({ editorialBoards: result.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch editorial boards.', error: error.message });
  }
});

app.post('/editorial-boards', async (req, res) => {
  const { name, image_base64, image_mime, about } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  const { imageBuffer, imageMime, error: imageError } = parseImagePayload(
    image_base64,
    image_mime
  );
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  try {
    const result = await pool.query(
      `INSERT INTO editorial_boards (name, image, image_mime, about)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), imageBuffer, imageMime, about || null]
    );
    return res.status(201).json({ editorialBoard: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to create editorial board.', error: error.message });
  }
});

app.patch('/editorial-boards', async (req, res) => {
  const { id, name, image_base64, image_mime, about } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Editorial board id is required.' });
  }

  if (name === undefined && image_base64 === undefined && image_mime === undefined && about === undefined) {
    return res.status(400).json({ message: 'No fields provided to update.' });
  }

  const { imageBuffer, imageMime, error: imageError } = parseImagePayload(
    image_base64,
    image_mime
  );
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  try {
    const result = await pool.query(
        `UPDATE editorial_boards
         SET name = COALESCE($2, name),
           image = COALESCE($3, image),
           image_mime = COALESCE($4, image_mime),
           about = COALESCE($5, about)
         WHERE id = $1
         RETURNING *`,
        [id, name?.trim(), imageBuffer, imageMime, about]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Editorial board not found.' });
    }

    return res.status(200).json({ editorialBoard: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to update editorial board.', error: error.message });
  }
});

app.delete('/editorial-boards', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Editorial board id is required.' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM editorial_boards WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Editorial board not found.' });
    }

    return res.status(200).json({ deleted: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to delete editorial board.', error: error.message });
  }
});

app.get('/executives', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM executives ORDER BY name ASC');
    return res.status(200).json({ executives: result.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch executives.', error: error.message });
  }
});

app.post('/executives', async (req, res) => {
  const { name, position, image_base64, image_mime, about } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  const { imageBuffer, imageMime, error: imageError } = parseImagePayload(
    image_base64,
    image_mime
  );
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  try {
    const result = await pool.query(
      `INSERT INTO executives (name, image, position, image_mime, about)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), imageBuffer, position?.trim() || null, imageMime, about || null]
    );
    return res.status(201).json({ executive: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to create executive.', error: error.message });
  }
});

app.patch('/executives', async (req, res) => {
  const { id, name, position, image_base64, image_mime, about } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Executive id is required.' });
  }

  if (
    name === undefined &&
    position === undefined &&
    image_base64 === undefined &&
    image_mime === undefined &&
    about === undefined
  ) {
    return res.status(400).json({ message: 'No fields provided to update.' });
  }

  const { imageBuffer, imageMime, error: imageError } = parseImagePayload(
    image_base64,
    image_mime
  );
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  try {
    const result = await pool.query(
      `UPDATE executives
       SET name = COALESCE($2, name),
           image = COALESCE($3, image),
           position = COALESCE($4, position),
           image_mime = COALESCE($5, image_mime),
           about = COALESCE($6, about)
       WHERE id = $1
       RETURNING *`,
      [id, name?.trim(), imageBuffer, position?.trim(), imageMime, about]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Executive not found.' });
    }

    return res.status(200).json({ executive: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to update executive.', error: error.message });
  }
});

app.delete('/executives', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Executive id is required.' });
  }

  try {
    const result = await pool.query('DELETE FROM executives WHERE id = $1 RETURNING id', [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Executive not found.' });
    }

    return res.status(200).json({ deleted: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to delete executive.', error: error.message });
  }
});

app.post('/advertisements/publish', async (req, res) => {
  const { image_base64, image_mime, url, owner, page } = req.body;

  if (!url || !owner || !page) {
    return res.status(400).json({ message: 'Url, owner, and page are required.' });
  }

  const { imageBuffer, imageMime, error: imageError } = parseImagePayload(
    image_base64,
    image_mime
  );
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  if (!imageBuffer) {
    return res.status(400).json({ message: 'Image is required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO advertisements (image, image_mime, url, owner, page)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [imageBuffer, imageMime, url.trim(), owner.trim(), page.trim()]
    );

    return res.status(201).json({ advertisement: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to create advertisement.', error: error.message });
  }
});

app.get('/advertisements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM advertisements ORDER BY created_at DESC');
    return res.status(200).json({ advertisements: result.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch advertisements.', error: error.message });
  }
});

app.get('/advertisements/page/:page', async (req, res) => {
  const page = req.params.page?.trim();

  if (!page) {
    return res.status(400).json({ message: 'Page is required.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM advertisements WHERE page = $1 ORDER BY created_at DESC',
      [page]
    );
    return res.status(200).json({ advertisements: result.rows });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch advertisements.', error: error.message });
  }
});

app.patch('/advertisements/edit', async (req, res) => {
  const { id, image_base64, image_mime, url, owner, page } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Advertisement id is required.' });
  }

  if (
    image_base64 === undefined &&
    image_mime === undefined &&
    url === undefined &&
    owner === undefined &&
    page === undefined
  ) {
    return res.status(400).json({ message: 'No fields provided to update.' });
  }

  const { imageBuffer, imageMime, error: imageError } = parseImagePayload(
    image_base64,
    image_mime
  );
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  try {
    const result = await pool.query(
      `UPDATE advertisements
       SET image = COALESCE($2, image),
           image_mime = COALESCE($3, image_mime),
           url = COALESCE($4, url),
           owner = COALESCE($5, owner),
           page = COALESCE($6, page),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, imageBuffer, imageMime, url?.trim(), owner?.trim(), page?.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Advertisement not found.' });
    }

    return res.status(200).json({ advertisement: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to update advertisement.', error: error.message });
  }
});

app.delete('/advertisements/delete', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Advertisement id is required.' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM advertisements WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Advertisement not found.' });
    }

    return res.status(200).json({ deleted: result.rows[0] });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to delete advertisement.', error: error.message });
  }
});

app.post('/quotes/publish', async (req, res) => {
  const { title, author } = req.body;

  if (!title || !author) {
    return res.status(400).json({ message: 'Title and author are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO quotes (title, author)
       VALUES ($1, $2)
       RETURNING *`,
      [title.trim(), author.trim()]
    );

    return res.status(201).json({ quote: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create quote.', error: error.message });
  }
});

app.get('/quotes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quotes ORDER BY created_at DESC');
    return res.status(200).json({ quotes: result.rows });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch quotes.', error: error.message });
  }
});

app.patch('/quotes/edit', async (req, res) => {
  const { id, title, author } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Quote id is required.' });
  }

  if (title === undefined && author === undefined) {
    return res.status(400).json({ message: 'No fields provided to update.' });
  }

  try {
    const result = await pool.query(
      `UPDATE quotes
       SET title = COALESCE($2, title),
           author = COALESCE($3, author),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, title?.trim(), author?.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Quote not found.' });
    }

    return res.status(200).json({ quote: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update quote.', error: error.message });
  }
});

app.delete('/quotes/delete', async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: 'Quote id is required.' });
  }

  try {
    const result = await pool.query('DELETE FROM quotes WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Quote not found.' });
    }

    return res.status(200).json({ deleted: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete quote.', error: error.message });
  }
});

// Start server (skip when running on Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Test database connection
    try {
      const client = await pool.connect();
      console.log('✓ Database connected successfully');
      client.release();
    } catch (error) {
      console.error('✗ Database connection failed:', error.message);
    }
  });
}

export default app;
