import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import candidateRoutes from './routes/candidates.js';
import dashboardRoutes from './routes/dashboard.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
  app.use(express.json({ limit: '1mb' }));
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/candidates', candidateRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

  // Serve the built client in production
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
