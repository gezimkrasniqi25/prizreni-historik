import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

async function start() {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`\n[db] Cannot connect to MySQL at ${env.db.host}:${env.db.port} (${err.code || err.message}).`);
    // eslint-disable-next-line no-console
    console.error('     Check DB_* env vars (Hostinger: DB_HOST=127.0.0.1) and run: npm run db:setup\n');
    // Keep the process alive in production so Hostinger does not return a blank 503
    // while env/DB is being configured; local/dev still fails fast.
    if (!env.isProd) process.exit(1);
  }

  // Hostinger injects PORT; bind only to that port (no hardcoded host/port).
  const port = Number(process.env.PORT) || env.port;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Prizren Heritage API listening on port ${port} (${env.nodeEnv})`);
  });
}

start().catch((err) => {
  console.error('Failed to start Prizren Heritage API:', err);
  process.exit(1);
});
