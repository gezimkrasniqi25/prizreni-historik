import crypto from 'node:crypto';
import sanitizeHtml from 'sanitize-html';

export const LANGS = ['sq', 'en', 'de'];
export const DEFAULT_LANG = 'sq';

export class HttpError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const pickLang = (value) => (LANGS.includes(value) ? value : DEFAULT_LANG);

/** Cryptographically strong random token + its SHA-256 hash (only the hash is stored). */
export function createToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
}
export const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

/** Strip *all* HTML from user generated text (XSS protection at the source). */
export const cleanText = (value = '') =>
  sanitizeHtml(String(value), { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();

export const toInt = (value, fallback = 0, { min = -Infinity, max = Infinity } = {}) => {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export const slugify = (value) =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ë/gi, 'e')
    .replace(/ç/gi, 'c')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 110);

export const detectDevice = (ua = '') => {
  if (/bot|crawler|spider|crawling|headless|lighthouse/i.test(ua)) return 'bot';
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
};

export const mysqlDate = (d = new Date()) => d.toISOString().slice(0, 19).replace('T', ' ');
