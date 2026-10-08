import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import hotelRoutes from './routes/hotelRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIST = path.resolve(__dirname, '../../frontend/dist');

const app = express();

const corsOriginEnv = process.env.CORS_ORIGIN;
if (!corsOriginEnv || corsOriginEnv === '*') {
  app.use(cors());
} else {
  const allowed = corsOriginEnv.split(',').map((o) => o.trim());
  app.use(cors({ origin: allowed }));
}

app.use(express.json());

// Uploaded images are public files: GET /uploads/<filename>
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);

// Optional: If frontend has been built into frontend/dist, serve it
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    }
    next();
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
