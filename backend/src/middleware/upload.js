import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// <backend>/uploads
export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// Extension is derived from the verified MIME type, never from the client's filename.
const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${crypto.randomUUID()}${EXTENSIONS[file.mimetype]}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (EXTENSIONS[file.mimetype]) return cb(null, true);
    cb(new Error('Only JPEG, PNG, WEBP or GIF images are allowed'));
  },
});

// Accepts an optional file in the multipart field "image".
export function uploadImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller' : err.message;
    res.status(400).json({ message });
  });
}

// The value stored in PostgreSQL (and served by express.static at /uploads).
export const toImagePath = (filename) => `/uploads/${filename}`;

// Delete a stored image. Only touches files directly inside UPLOAD_DIR.
export async function removeImageFile(imagePath) {
  if (!imagePath || !imagePath.startsWith('/uploads/')) return;
  const filename = path.basename(imagePath);
  const fullPath = path.join(UPLOAD_DIR, filename);
  if (path.dirname(fullPath) !== UPLOAD_DIR) return;
  try {
    await fsp.unlink(fullPath);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Could not delete image:', err.message);
  }
}

// Remove the file multer just wrote (used when validation / the DB query fails).
export const discardUploadedFile = (file) =>
  file ? removeImageFile(toImagePath(file.filename)) : undefined;
