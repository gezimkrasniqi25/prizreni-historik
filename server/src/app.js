import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { env, SERVER_ROOT } from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter, errorHandler, notFound } from './middleware/security.js';
import { UPLOADS_DIR } from './middleware/upload.js';

const app = express();

// Needed so rate limiting and statistics see the real client IP behind a proxy.
app.set('trust proxy', env.isProd ? 1 : false);
app.disable('x-powered-by');

app.use(
  helmet({
    // The React app (when served by this server) loads map tiles from OpenStreetMap.
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org'],
        'connect-src': ["'self'", 'blob:', 'data:'],
        'worker-src': ["'self'", 'blob:'],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'frame-src': ["'self'", 'https://www.openstreetmap.org'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(compression());
if (!env.isProd) app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Uploaded photos / 3D models (long cache: file names are unique)
app.use(
  '/uploads',
  express.static(UPLOADS_DIR, {
    maxAge: '30d',
    immutable: true,
    setHeaders: (res, file) => {
      if (file.endsWith('.glb')) res.setHeader('Content-Type', 'model/gltf-binary');
      if (file.endsWith('.gltf')) res.setHeader('Content-Type', 'model/gltf+json');
    },
  }),
);

app.use('/api', apiLimiter, routes);
app.use('/api', notFound);

// In production the built React app is served by Express as well.
const clientDist = path.resolve(SERVER_ROOT, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '1h', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(errorHandler);

export default app;
