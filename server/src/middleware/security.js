import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { HttpError } from '../utils/helpers.js';
import { env } from '../config/env.js';

const limiter = (windowMs, limit, message, extra = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: message, code: 'RATE_LIMITED' },
    ...extra,
  });

const MIN = 60 * 1000;

export const apiLimiter = limiter(15 * MIN, 600, 'Too many requests, please slow down.');
// Brute-force protection for credentials
export const loginLimiter = limiter(15 * MIN, 10, 'Too many login attempts. Try again in 15 minutes.', {
  skipSuccessfulRequests: true,
});
export const registerLimiter = limiter(60 * MIN, 8, 'Too many sign-up attempts. Try again later.');
// Any endpoint that sends e-mail (resend verification, forgot password)
export const emailLimiter = limiter(60 * MIN, 6, 'Too many e-mail requests. Try again later.');
export const writeLimiter = limiter(10 * MIN, 40, 'You are posting too quickly. Try again shortly.');
export const statsLimiter = limiter(MIN, 60, 'Too many requests.');
export const uploadLimiter = limiter(10 * MIN, 60, 'Too many uploads. Try again later.');

/** Validates req.body / req.query with a Zod schema and replaces it with the parsed value. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_';
      if (!fields[key]) fields[key] = issue.message;
    }
    return next(new HttpError(422, 'Validation failed', 'VALIDATION_ERROR', fields));
  }
  req[source] = result.data;
  return next();
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(422).json({ error: 'Validation failed', code: 'VALIDATION_ERROR' });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File is too large', code: 'FILE_TOO_LARGE' });
  }
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Duplicate entry', code: 'DUPLICATE' });
  }
  const status = err.status || 500;
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }
  return res.status(status).json({
    error: status >= 500 && env.isProd ? 'Internal server error' : err.message,
    code: err.code || (status >= 500 ? 'SERVER_ERROR' : 'ERROR'),
    ...(err.details ? { details: err.details } : {}),
  });
}

export const notFound = (_req, _res, next) => next(new HttpError(404, 'Not found', 'NOT_FOUND'));
