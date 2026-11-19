import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(__dirname, '..', '..');
export const REPO_ROOT = path.resolve(SERVER_ROOT, '..');

// Hostinger injects env via hPanel (process.env). .env files are optional extras.
// dotenv does not override variables that are already set.
const envCandidates = [
  path.join(SERVER_ROOT, '.env'),
  path.join(REPO_ROOT, '.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'server', '.env'),
];

for (const file of envCandidates) {
  if (fs.existsSync(file)) {
    const result = dotenv.config({ path: file });
    if (!result.error) {
      // eslint-disable-next-line no-console
      console.log(`[env] loaded ${file}`);
    }
  }
}

const bool = (v, d = false) => (v === undefined || v === '' ? d : String(v).toLowerCase() === 'true');
const num = (v, d) => (v === undefined || v === '' ? d : Number(v));

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: num(process.env.PORT, 5000),
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
  serverUrl: (process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, ''),

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: num(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'prizren_heritage',
  },

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecure: bool(process.env.COOKIE_SECURE, false),
  verifyTokenTtlHours: num(process.env.VERIFY_TOKEN_TTL_HOURS, 24),
  resetTokenTtlMinutes: num(process.env.RESET_TOKEN_TTL_MINUTES, 60),
  bcryptRounds: num(process.env.BCRYPT_ROUNDS, 12),

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@prizren.local',
    password: process.env.ADMIN_PASSWORD || 'ChangeMe!2026',
    firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
    lastName: process.env.ADMIN_LAST_NAME || 'Prizren',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: num(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Prizren Heritage <no-reply@prizren-heritage.local>',
  },
};

if (!env.jwtSecret || env.jwtSecret.length < 32 || env.jwtSecret.startsWith('change-me')) {
  if (env.isProd) {
    throw new Error('JWT_SECRET must be set to a long random value in production (hPanel → Environment variables).');
  }
  // eslint-disable-next-line no-console
  console.warn('[env] JWT_SECRET is weak/missing. Set a long random value in server/.env or hPanel.');
  env.jwtSecret = env.jwtSecret || 'dev-only-insecure-secret-please-change-this-value';
}

// Safe startup diagnostics (no secrets)
// eslint-disable-next-line no-console
console.log(
  `[env] NODE_ENV=${env.nodeEnv} CLIENT_URL=${env.clientUrl} DB_HOST=${env.db.host} DB_NAME=${env.db.database} JWT=${env.jwtSecret ? 'set' : 'missing'}`,
);
