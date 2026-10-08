import pg from 'pg';

const { Pool, types } = pg;

// NUMERIC columns (price, latitude, longitude) come back as strings by default.
// Parse them to JS numbers so the API returns real numbers.
types.setTypeParser(types.builtins.NUMERIC, (value) => parseFloat(value));
// DATE columns (check_in / check_out) stay plain 'YYYY-MM-DD' strings (no timezone shifting)
types.setTypeParser(types.builtins.DATE, (value) => value);

export function sanitizeDatabaseUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  let url = rawUrl.trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1);
  }
  try {
    new URL(url);
    return url;
  } catch {
    // Encodes unencoded special characters in password (such as ? or #)
    return url.replace(
      /^((?:postgres|postgresql):\/\/[^:]+:)(.*)(@[^@]+)$/,
      (_m, prefix, pass, rest) => prefix + encodeURIComponent(pass) + rest
    );
  }
}

const formattedUrl = sanitizeDatabaseUrl(process.env.DATABASE_URL);
const isRemote = Boolean(
  formattedUrl &&
    !formattedUrl.includes('localhost') &&
    !formattedUrl.includes('127.0.0.1')
);

// Enable SSL by default for cloud hosted databases (Supabase, Render, Neon, etc.)
const useSSL =
  process.env.DB_SSL === 'true' ||
  (process.env.DB_SSL !== 'false' && (isRemote || process.env.NODE_ENV === 'production'));

const pool = new Pool(
  formattedUrl
    ? {
        connectionString: formattedUrl,
        ssl: useSSL ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'hotel_db',
        ssl: useSSL ? { rejectUnauthorized: false } : undefined,
      }
);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

export default pool;
