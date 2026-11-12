import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { queryOne } from '../config/db.js';
import { HttpError } from '../utils/helpers.js';

export const COOKIE_NAME = 'ph_session';
export const CSRF_COOKIE = 'ph_csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const parseMs = (str) => {
  const m = /^(\d+)([smhd])$/.exec(str);
  if (!m) return 7 * 24 * 3600 * 1000;
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
  return Number(m[1]) * mult;
};

/**
 * Session handling: a signed JWT stored in an HttpOnly, SameSite cookie
 * (not readable by JavaScript => XSS cannot steal it). A random CSRF value is
 * embedded in the JWT and mirrored in a readable cookie; state-changing
 * requests must echo it in the `X-CSRF-Token` header (double-submit pattern).
 */
export function issueSession(res, user) {
  const csrf = crypto.randomBytes(24).toString('hex');
  const token = jwt.sign({ sub: user.id, csrf }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  const maxAge = parseMs(env.jwtExpiresIn);
  const base = { secure: env.cookieSecure, sameSite: 'lax', maxAge, path: '/' };
  res.cookie(COOKIE_NAME, token, { ...base, httpOnly: true });
  res.cookie(CSRF_COOKIE, csrf, { ...base, httpOnly: false });
  return csrf;
}

export function clearSession(res) {
  const base = { secure: env.cookieSecure, sameSite: 'lax', path: '/' };
  res.clearCookie(COOKIE_NAME, { ...base, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, base);
}

async function resolveUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return null;
  }
  const user = await queryOne(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.is_verified, u.is_active,
            u.preferred_lang, u.bio, u.created_at, r.name AS role
       FROM users u JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?`,
    [payload.sub],
  );
  if (!user || !user.is_active) return null;
  return { user, csrf: payload.csrf };
}

function checkCsrf(req, csrf) {
  if (SAFE_METHODS.has(req.method)) return;
  const header = req.get('x-csrf-token');
  if (!header || !csrf || header.length !== csrf.length ||
      !crypto.timingSafeEqual(Buffer.from(header), Buffer.from(csrf))) {
    throw new HttpError(403, 'Invalid CSRF token', 'CSRF_INVALID');
  }
}

/** Requires a valid session. */
export async function authenticate(req, _res, next) {
  try {
    const session = await resolveUser(req);
    if (!session) throw new HttpError(401, 'Authentication required', 'UNAUTHENTICATED');
    checkCsrf(req, session.csrf);
    req.user = session.user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Attaches req.user when logged in, otherwise continues anonymously. */
export async function optionalAuth(req, _res, next) {
  try {
    const session = await resolveUser(req);
    if (session) {
      checkCsrf(req, session.csrf);
      req.user = session.user;
    }
    next();
  } catch (err) {
    next(err);
  }
}

export const requireVerified = (req, _res, next) =>
  req.user?.is_verified ? next() : next(new HttpError(403, 'Email not verified', 'EMAIL_NOT_VERIFIED'));

/** Role based access control. Usage: requireRole('admin', 'editor') */
export const requireRole = (...roles) => (req, _res, next) =>
  req.user && roles.includes(req.user.role)
    ? next()
    : next(new HttpError(403, 'You do not have permission to do this', 'FORBIDDEN'));
