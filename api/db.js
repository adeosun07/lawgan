import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || null;
const shouldUseSsl =
  process.env.DB_SSL === 'true' ||
  (Boolean(connectionString) && process.env.DB_SSL !== 'false');

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'lawgan',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
      }
);

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default pool;
