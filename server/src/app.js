import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import { env, REPO_ROOT } from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter, errorHandler, notFound } from './middleware/security.js';
import { UPLOADS_DIR } from './middleware/upload.js';

const app = express();

function resolveClientDir() {
  const candidates = [
    path.join(REPO_ROOT, 'public'),
    path.join(process.cwd(), 'public'),
    path.join(REPO_ROOT, 'client', 'dist'),
    path.join(process.cwd(), 'client', 'dist'),
    path.join(REPO_ROOT, 'public_html'),
  ];
  return candidates.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) || null;
}

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
// Allow configured CLIENT_URL and same-origin browser requests (Hostinger SPA + API).
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origin === env.clientUrl) return cb(null, true);
      try {
        const host = new URL(env.serverUrl).host;
        if (new URL(origin).host === host) return cb(null, true);
      } catch {
        /* ignore bad URLs */
      }
      return cb(null, false);
    },
    credentials: true,
  }),
);
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

// Production frontend: prefer root /public (Hostinger), then client/dist.
const clientDir = resolveClientDir();
if (clientDir) {
  // eslint-disable-next-line no-console
  console.log(`[static] serving frontend from ${clientDir}`);
  app.use(express.static(clientDir, { maxAge: '1h', index: false }));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDir, 'index.html')));
} else {
  // eslint-disable-next-line no-console
  console.warn('[static] No frontend build found (expected public/index.html). Run: npm run build');
  app.get('/', (_req, res) => {
    res
      .status(503)
      .type('html')
      .send(
        '<h1>Frontend missing</h1><p>Run <code>npm run build</code> or upload the <code>public/</code> folder next to <code>server.js</code>.</p><p>API: <a href="/api/health">/api/health</a></p>',
      );
  });
}

app.use(errorHandler);

export default app;
