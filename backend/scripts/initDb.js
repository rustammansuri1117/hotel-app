import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from '../src/config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function initDatabase(dbPool = pool) {
  const sql = await fs.readFile(path.join(__dirname, '../sql/schema.sql'), 'utf8');
  await dbPool.query(sql);
  console.log('Database tables ("hotels", "bookings") are ready.');
}

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  try {
    await initDatabase(pool);
  } catch (err) {
    console.error('Schema setup failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
