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
    console.error('     Start MySQL, check server/.env and run:  npm run db:setup\n');
    process.exit(1);
  }
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Prizren Heritage API listening on http://localhost:${env.port}  (${env.nodeEnv})`);
  });
}

start();
