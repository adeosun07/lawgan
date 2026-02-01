import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabaseClient } from './supabaseClient.js';

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
const toBytea = (buffer) => (buffer ? `\\x${buffer.toString('hex')}` : null);

const getSupabaseOrFail = (res) => {
  try {
    return getSupabaseClient();
  } catch (error) {
    // Breaking change: missing Supabase env now returns a clear error response.
    res.status(500).json({
      message: 'Supabase is not configured correctly.',
      error: error.message,
    });
    return null;
  }
};

app.get('/health', async (_req, res) => {
  const supabase = getSupabaseOrFail(res);
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return res.status(500).json({ status: 'error', error: error.message });
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    return res.status(500).json({ status: 'error', error: error.message });
  }
});

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
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: existing, error: existingError } = await supabase
      .from('admins')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingError) {
      return res.status(500).json({ message: 'Failed to check existing admin.', error: existingError.message });
    }

    if (existing) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: admin, error: insertError } = await supabase
      .from('admins')
      .insert({
        name: name.trim(),
        email: normalizedEmail,
        password_hash: passwordHash,
      })
      .select('id, name, email, created_at')
      .single();

    if (insertError) {
      return res.status(500).json({ message: 'Failed to create admin.', error: insertError.message });
    }

    return res.status(201).json({ admin });
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
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, name, email, password_hash')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (adminError) {
      return res.status(500).json({ message: 'Failed to sign in.', error: adminError.message });
    }

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const { error: lastLoginError } = await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    if (lastLoginError) {
      return res.status(500).json({ message: 'Failed to sign in.', error: lastLoginError.message });
    }

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

  const imageProvided = image_base64 !== undefined;
  const { imageBuffer, imageMime, error: imageError } = imageProvided
    ? parseImagePayload(image_base64, image_mime)
    : { imageBuffer: null, imageMime: null, error: null };
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  try {
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const updateFields = {
      title,
      slug: normalizeSlug(newSlug),
      summary,
      content,
      category,
      is_breaking,
      published,
      author,
      updated_at: new Date().toISOString(),
    };

    // Breaking change: bytea values must be hex-encoded strings (\x...) for Supabase.
    if (imageProvided && imageBuffer) {
      updateFields.image_url = toBytea(imageBuffer);
      updateFields.image_mime = imageMime;
    }

    const baseQuery = supabase.from('articles').update(updateFields);
    // Breaking change: if both id and slug are provided, id is preferred.
    const { data: article, error: updateError } = id
      ? await baseQuery.eq('id', id).select('*').maybeSingle()
      : await baseQuery.eq('slug', slug).select('*').maybeSingle();

    if (updateError) {
      return res.status(500).json({ message: 'Failed to update article.', error: updateError.message });
    }

    if (!article) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    return res.status(200).json({ article });
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
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: existing, error: existingError } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', normalizedSlug)
      .maybeSingle();

    if (existingError) {
      return res.status(500).json({ message: 'Failed to publish article.', error: existingError.message });
    }

    if (existing) {
      return res.status(409).json({ message: 'Slug already in use.' });
    }

    const { data: article, error: insertError } = await supabase
      .from('articles')
      .insert({
        title,
        slug: normalizedSlug,
        summary: summary || null,
        content,
        category,
        is_breaking: is_breaking ?? false,
        published: true,
        author: author || null,
        image_url: imageBuffer ? toBytea(imageBuffer) : null,
        image_mime: imageMime,
      })
      .select('*')
      .single();

    if (insertError) {
      return res.status(500).json({ message: 'Failed to publish article.', error: insertError.message });
    }

    return res.status(201).json({ article });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to publish article.', error: error.message });
  }
});

app.get('/articles', async (req, res) => {
  try {
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch articles.', error: error.message });
    }

    return res.status(200).json({ articles });
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
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch articles.', error: error.message });
    }

    return res.status(200).json({ articles });
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
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: deleted, error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      return res.status(500).json({ message: 'Failed to delete article.', error: error.message });
    }

    if (!deleted) {
      return res.status(404).json({ message: 'Article not found.' });
    }

    return res.status(200).json({ deleted });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete article.', error: error.message });
  }
});

app.get('/editorial-boards', async (req, res) => {
  try {
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: editorialBoards, error } = await supabase
      .from('editorial_boards')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res
        .status(500)
        .json({ message: 'Failed to fetch editorial boards.', error: error.message });
    }

    return res.status(200).json({ editorialBoards });
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
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: editorialBoard, error } = await supabase
      .from('editorial_boards')
      .insert({
        name: name.trim(),
        image: imageBuffer ? toBytea(imageBuffer) : null,
        image_mime: imageMime,
        about: about || null,
      })
      .select('*')
      .single();

    if (error) {
      return res
        .status(500)
        .json({ message: 'Failed to create editorial board.', error: error.message });
    }

    return res.status(201).json({ editorialBoard });
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

  const imageProvided = image_base64 !== undefined;
  const { imageBuffer, imageMime, error: imageError } = imageProvided
    ? parseImagePayload(image_base64, image_mime)
    : { imageBuffer: null, imageMime: null, error: null };
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  try {
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const updateFields = {
      name: name?.trim(),
      about,
    };

    if (imageProvided && imageBuffer) {
      updateFields.image = toBytea(imageBuffer);
      updateFields.image_mime = imageMime;
    }

    const { data: editorialBoard, error } = await supabase
      .from('editorial_boards')
      .update(updateFields)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return res
        .status(500)
        .json({ message: 'Failed to update editorial board.', error: error.message });
    }

    if (!editorialBoard) {
      return res.status(404).json({ message: 'Editorial board not found.' });
    }

    return res.status(200).json({ editorialBoard });
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
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: deleted, error } = await supabase
      .from('editorial_boards')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      return res
        .status(500)
        .json({ message: 'Failed to delete editorial board.', error: error.message });
    }

    if (!deleted) {
      return res.status(404).json({ message: 'Editorial board not found.' });
    }

    return res.status(200).json({ deleted });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to delete editorial board.', error: error.message });
  }
});

app.get('/executives', async (req, res) => {
  try {
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: executives, error } = await supabase
      .from('executives')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res
        .status(500)
        .json({ message: 'Failed to fetch executives.', error: error.message });
    }

    return res.status(200).json({ executives });
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
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: executive, error } = await supabase
      .from('executives')
      .insert({
        name: name.trim(),
        image: imageBuffer ? toBytea(imageBuffer) : null,
        position: position?.trim() || null,
        image_mime: imageMime,
        about: about || null,
      })
      .select('*')
      .single();

    if (error) {
      return res
        .status(500)
        .json({ message: 'Failed to create executive.', error: error.message });
    }

    return res.status(201).json({ executive });
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

  const imageProvided = image_base64 !== undefined;
  const { imageBuffer, imageMime, error: imageError } = imageProvided
    ? parseImagePayload(image_base64, image_mime)
    : { imageBuffer: null, imageMime: null, error: null };
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  try {
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const updateFields = {
      name: name?.trim(),
      position: position?.trim(),
      about,
    };

    if (imageProvided && imageBuffer) {
      updateFields.image = toBytea(imageBuffer);
      updateFields.image_mime = imageMime;
    }

    const { data: executive, error } = await supabase
      .from('executives')
      .update(updateFields)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return res
        .status(500)
        .json({ message: 'Failed to update executive.', error: error.message });
    }

    if (!executive) {
      return res.status(404).json({ message: 'Executive not found.' });
    }

    return res.status(200).json({ executive });
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
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: deleted, error } = await supabase
      .from('executives')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      return res
        .status(500)
        .json({ message: 'Failed to delete executive.', error: error.message });
    }

    if (!deleted) {
      return res.status(404).json({ message: 'Executive not found.' });
    }

    return res.status(200).json({ deleted });
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
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: advertisement, error } = await supabase
      .from('advertisements')
      .insert({
        image: imageBuffer ? toBytea(imageBuffer) : null,
        image_mime: imageMime,
        url: url.trim(),
        owner: owner.trim(),
        page: page.trim(),
      })
      .select('*')
      .single();

    if (error) {
      return res
        .status(500)
        .json({ message: 'Failed to create advertisement.', error: error.message });
    }

    return res.status(201).json({ advertisement });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to create advertisement.', error: error.message });
  }
});

app.get('/advertisements', async (req, res) => {
  try {
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: advertisements, error } = await supabase
      .from('advertisements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res
        .status(500)
        .json({ message: 'Failed to fetch advertisements.', error: error.message });
    }

    return res.status(200).json({ advertisements });
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
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: advertisements, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('page', page)
      .order('created_at', { ascending: false });

    if (error) {
      return res
        .status(500)
        .json({ message: 'Failed to fetch advertisements.', error: error.message });
    }

    return res.status(200).json({ advertisements });
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

  const imageProvided = image_base64 !== undefined;
  const { imageBuffer, imageMime, error: imageError } = imageProvided
    ? parseImagePayload(image_base64, image_mime)
    : { imageBuffer: null, imageMime: null, error: null };
  if (imageError) {
    return res.status(400).json({ message: imageError });
  }

  try {
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const updateFields = {
      url: url?.trim(),
      owner: owner?.trim(),
      page: page?.trim(),
      updated_at: new Date().toISOString(),
    };

    if (imageProvided && imageBuffer) {
      updateFields.image = toBytea(imageBuffer);
      updateFields.image_mime = imageMime;
    }

    const { data: advertisement, error } = await supabase
      .from('advertisements')
      .update(updateFields)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return res
        .status(500)
        .json({ message: 'Failed to update advertisement.', error: error.message });
    }

    if (!advertisement) {
      return res.status(404).json({ message: 'Advertisement not found.' });
    }

    return res.status(200).json({ advertisement });
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
    const supabase = getSupabaseOrFail(res);
    if (!supabase) return;
    const { data: deleted, error } = await supabase
      .from('advertisements')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      return res
        .status(500)
        .json({ message: 'Failed to delete advertisement.', error: error.message });
    }

    if (!deleted) {
      return res.status(404).json({ message: 'Advertisement not found.' });
    }

    return res.status(200).json({ deleted });
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
    const supabase = getSupabaseClient();
    const { data: quote, error } = await supabase
      .from('quotes')
      .insert({
        title: title.trim(),
        author: author.trim(),
      })
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ message: 'Failed to create quote.', error: error.message });
    }

    return res.status(201).json({ quote });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create quote.', error: error.message });
  }
});

app.get('/quotes', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch quotes.', error: error.message });
    }

    return res.status(200).json({ quotes });
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
    const supabase = getSupabaseClient();
    const { data: quote, error } = await supabase
      .from('quotes')
      .update({
        title: title?.trim(),
        author: author?.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      return res.status(500).json({ message: 'Failed to update quote.', error: error.message });
    }

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found.' });
    }

    return res.status(200).json({ quote });
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
    const supabase = getSupabaseClient();
    const { data: deleted, error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      return res.status(500).json({ message: 'Failed to delete quote.', error: error.message });
    }

    if (!deleted) {
      return res.status(404).json({ message: 'Quote not found.' });
    }

    return res.status(200).json({ deleted });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete quote.', error: error.message });
  }
});

// Start server (skip when running on Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
