import 'dotenv/config';
import app from './src/app.js';
import pool from './src/config/db.js';
import { initDatabase } from './scripts/initDb.js';

const PORT = Number(process.env.PORT) || 5000;

try {
  await pool.query('SELECT 1');
  console.log('PostgreSQL connected');
  if (process.env.AUTO_INIT_DB !== 'false') {
    await initDatabase(pool);
  }
} catch (err) {
  console.error('Could not connect to PostgreSQL:', err.message);
  console.error('Check your DATABASE_URL / DB_* values and Supabase connection.');
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

const shutdown = () => server.close(() => pool.end().then(() => process.exit(0)));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
