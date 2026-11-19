import bcrypt from 'bcrypt';
import { z } from 'zod';
import { env } from '../config/env.js';
import { query, queryOne, withTransaction } from '../config/db.js';
import { HttpError, asyncHandler, cleanText, createToken, hashToken, mysqlDate, pickLang } from '../utils/helpers.js';
import { issueSession, clearSession } from '../middleware/auth.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/mailer.js';
import { logActivity } from '../services/activity.js';

// ---------- validation schemas (the same rules are mirrored on the frontend) ----------
const name = z.string().trim().min(2, 'min2').max(80, 'max80');
const email = z.string().trim().toLowerCase().email('email').max(190);
export const passwordRule = z
  .string()
  .min(8, 'passwordMin')
  .max(72, 'passwordMax')
  .regex(/[a-z]/, 'passwordLower')
  .regex(/[A-Z]/, 'passwordUpper')
  .regex(/\d/, 'passwordDigit');

export const registerSchema = z
  .object({
    firstName: name,
    lastName: name,
    email,
    password: passwordRule,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'acceptTerms' }) }),
    lang: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'passwordMatch' });

export const loginSchema = z.object({ email, password: z.string().min(1, 'required').max(200) });
export const emailOnlySchema = z.object({ email, lang: z.string().optional() });
export const tokenSchema = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, 'invalidToken') });
export const resetSchema = z
  .object({ token: z.string().regex(/^[a-f0-9]{64}$/, 'invalidToken'), password: passwordRule, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'passwordMatch' });

// A throw-away hash so that unknown e-mails take as long as known ones (no timing leak).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

export const publicUser = (u) => ({
  id: u.id,
  firstName: u.first_name,
  lastName: u.last_name,
  email: u.email,
  role: u.role,
  isVerified: !!u.is_verified,
  preferredLang: u.preferred_lang,
  bio: u.bio,
  createdAt: u.created_at,
});

async function createAndSendVerification(user, lang) {
  const { token, hash } = createToken();
  const expires = new Date(Date.now() + env.verifyTokenTtlHours * 3600 * 1000);
  // Invalidate any earlier unused tokens, then store the new one (hash only).
  await query('UPDATE email_verifications SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL', [user.id]);
  await query('INSERT INTO email_verifications (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [
    user.id,
    hash,
    mysqlDate(expires),
  ]);
  try {
    await sendVerificationEmail({ to: user.email, firstName: user.first_name, token, lang });
    return { sent: true };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[mail] failed to send verification e-mail:', err.message, err.response || err.code || '');
    return { sent: false, error: err.message };
  }
}

export const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email: mail, password } = req.body;
  const lang = pickLang(req.body.lang);

  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [mail]);
  if (existing) throw new HttpError(409, 'This e-mail is already registered', 'EMAIL_TAKEN');

  const hash = await bcrypt.hash(password, env.bcryptRounds);
  const result = await query(
    `INSERT INTO users (role_id, first_name, last_name, email, password_hash, accepted_terms_at, preferred_lang)
     VALUES (1, ?, ?, ?, ?, NOW(), ?)`,
    [cleanText(firstName), cleanText(lastName), mail, hash, lang],
  );
  const user = { id: result.insertId, first_name: cleanText(firstName), email: mail };
  const mailResult = await createAndSendVerification(user, lang);
  res.status(201).json({
    message: mailResult.sent
      ? 'Registered. Please verify your e-mail.'
      : 'Registered, but the verification e-mail could not be sent. Use Resend verification.',
    emailSent: mailResult.sent,
    mailError: mailResult.sent ? undefined : mailResult.error,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const row = await queryOne(
    'SELECT id, user_id, expires_at, used_at FROM email_verifications WHERE token_hash = ?',
    [hashToken(req.body.token)],
  );
  if (!row || row.used_at) throw new HttpError(400, 'Invalid or already used link', 'TOKEN_INVALID');
  if (new Date(row.expires_at) < new Date()) throw new HttpError(400, 'This link has expired', 'TOKEN_EXPIRED');

  await withTransaction(async (conn) => {
    await conn.execute('UPDATE email_verifications SET used_at = NOW() WHERE id = ?', [row.id]);
    await conn.execute('UPDATE users SET is_verified = 1, verified_at = NOW() WHERE id = ?', [row.user_id]);
  });
  res.json({ message: 'E-mail verified. You can now sign in.' });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const user = await queryOne('SELECT id, first_name, email, is_verified, is_active FROM users WHERE email = ?', [req.body.email]);
  if (user && !user.is_verified && user.is_active) {
    await createAndSendVerification(user, pickLang(req.body.lang));
  }
  // Same answer in every case => no account enumeration.
  res.json({ message: 'If the account exists and is not verified, a new e-mail has been sent.' });
});

export const login = asyncHandler(async (req, res) => {
  const { email: mail, password } = req.body;
  const user = await queryOne(
    `SELECT u.*, r.name AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ?`,
    [mail],
  );
  const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok || !user.is_active) {
    throw new HttpError(401, 'Incorrect e-mail or password', 'INVALID_CREDENTIALS');
  }
  if (!user.is_verified) {
    throw new HttpError(403, 'Please verify your e-mail before signing in', 'EMAIL_NOT_VERIFIED');
  }
  await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
  issueSession(res, user);
  await logActivity(user.id, 'login');
  res.json({ user: publicUser(user) });
});

export const logout = asyncHandler(async (_req, res) => {
  clearSession(res);
  res.json({ message: 'Signed out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await queryOne('SELECT id, first_name, email, is_active FROM users WHERE email = ?', [req.body.email]);
  if (user && user.is_active) {
    const { token, hash } = createToken();
    const expires = new Date(Date.now() + env.resetTokenTtlMinutes * 60 * 1000);
    await query('UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL', [user.id]);
    await query('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)', [
      user.id,
      hash,
      mysqlDate(expires),
    ]);
    try {
      await sendPasswordResetEmail({ to: user.email, firstName: user.first_name, token, lang: pickLang(req.body.lang) });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[mail] failed to send reset e-mail:', err.message);
    }
  }
  res.json({ message: 'If an account exists for this e-mail, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const row = await queryOne('SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?', [
    hashToken(req.body.token),
  ]);
  if (!row || row.used_at) throw new HttpError(400, 'Invalid or already used link', 'TOKEN_INVALID');
  if (new Date(row.expires_at) < new Date()) throw new HttpError(400, 'This link has expired', 'TOKEN_EXPIRED');

  const hash = await bcrypt.hash(req.body.password, env.bcryptRounds);
  await withTransaction(async (conn) => {
    await conn.execute('UPDATE password_resets SET used_at = NOW() WHERE id = ?', [row.id]);
    await conn.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, row.user_id]);
  });
  res.json({ message: 'Password updated. You can now sign in.' });
});
