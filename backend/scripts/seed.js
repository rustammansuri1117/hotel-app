// Optional: inserts the 8 sample hotels from the original frontend (only if the table is empty).
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool from '../src/config/db.js';
import { UPLOAD_DIR } from '../src/middleware/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_IMAGES = path.join(__dirname, '../seed-images');

const hotels = [
  ['Hotel 1', 'Relax in cozy and comfortable rooms.', 2500, 28.6139, 77.209, 'Delhi', 'hotel2.png'],
  ['Hotel 2', 'Stay close to nature and enjoy your stay.', 3000, 19.076, 72.8777, 'Mumbai', 'hotel3.jpg'],
  ['Hotel 3', 'Enjoy modern rooms and excellent hospitality.', 3500, 12.9716, 77.5946, 'Bengaluru', 'hotel4.jpg'],
  ['Hotel 4', 'A peaceful and comfortable hotel experience.', 2800, 13.0827, 80.2707, 'Chennai', 'hotel2.png'],
  ['Hotel 5', 'Enjoy a relaxing stay with modern facilities.', 3200, 28.6139, 77.209, 'Delhi', 'hotel3.jpg'],
  ['Hotel 6', 'Comfortable rooms with a beautiful atmosphere.', 4000, 19.076, 72.8777, 'Mumbai', 'hotel4.jpg'],
  ['Hotel 7', 'Perfect place for a peaceful and pleasant stay.', 2700, 12.9716, 77.5946, 'Bengaluru', 'hotel2.png'],
  ['Hotel 8', 'Modern rooms with comfortable surroundings.', 4500, 13.0827, 80.2707, 'Chennai', 'hotel3.jpg'],
];

try {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM hotels');
  if (rows[0].n > 0) {
    console.log(`Skipped: hotels table already has ${rows[0].n} row(s).`);
  } else {
    // every hotel gets its own copy, so deleting one hotel never removes another hotel's image
    for (const [i, [title, description, price, latitude, longitude, location, file]] of hotels.entries()) {
      const stored = `seed-${i + 1}-${file}`;
      await fs.copyFile(path.join(SEED_IMAGES, file), path.join(UPLOAD_DIR, stored));
      await pool.query(
        `INSERT INTO hotels (title, description, price, latitude, longitude, location, image_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [title, description, price, latitude, longitude, location, `/uploads/${stored}`]
      );
    }
    console.log(`Inserted ${hotels.length} sample hotels.`);
  }
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
