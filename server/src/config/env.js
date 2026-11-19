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

const stripQuotes = (v) => {
  const s = String(v).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
};
const str = (v, d = '') => (v === undefined || v === null || v === '' ? d : stripQuotes(v));
const bool = (v, d = false) => (v === undefined || v === '' ? d : stripQuotes(v).toLowerCase() === 'true');
const num = (v, d) => (v === undefined || v === '' ? d : Number(stripQuotes(v)));

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: num(process.env.PORT, 5000),
  clientUrl: str(process.env.CLIENT_URL, 'http://localhost:5173').replace(/\/$/, ''),
  serverUrl: str(process.env.SERVER_URL, `http://localhost:${process.env.PORT || 5000}`).replace(/\/$/, ''),

  db: {
    host: str(process.env.DB_HOST, '127.0.0.1'),
    port: num(process.env.DB_PORT, 3306),
    user: str(process.env.DB_USER, 'root'),
    password: str(process.env.DB_PASSWORD, ''),
    database: str(process.env.DB_NAME, 'prizren_heritage'),
  },

  jwtSecret: process.env.JWT_SECRET ? stripQuotes(process.env.JWT_SECRET) : process.env.JWT_SECRET,
  jwtExpiresIn: str(process.env.JWT_EXPIRES_IN, '7d'),
  cookieSecure: bool(process.env.COOKIE_SECURE, false),
  verifyTokenTtlHours: num(process.env.VERIFY_TOKEN_TTL_HOURS, 24),
  resetTokenTtlMinutes: num(process.env.RESET_TOKEN_TTL_MINUTES, 60),
  bcryptRounds: num(process.env.BCRYPT_ROUNDS, 12),

  admin: {
    email: str(process.env.ADMIN_EMAIL, 'admin@prizren.local'),
    password: str(process.env.ADMIN_PASSWORD, 'ChangeMe!2026'),
    firstName: str(process.env.ADMIN_FIRST_NAME, 'Admin'),
    lastName: str(process.env.ADMIN_LAST_NAME, 'Prizren'),
  },

  smtp: {
    host: str(process.env.SMTP_HOST, ''),
    port: num(process.env.SMTP_PORT, 465),
    secure: bool(process.env.SMTP_SECURE, true),
    user: str(process.env.SMTP_USER, ''),
    pass: str(process.env.SMTP_PASS, ''),
    from: str(process.env.MAIL_FROM, 'Prizren Heritage <no-reply@prizren-heritage.local>'),
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
  `[env] NODE_ENV=${env.nodeEnv} CLIENT_URL=${env.clientUrl} DB=${env.db.host}/${env.db.database} JWT=${env.jwtSecret ? 'set' : 'missing'} SMTP=${env.smtp.host ? `${env.smtp.host} as ${env.smtp.user || '?'}` : 'off'}`,
);
