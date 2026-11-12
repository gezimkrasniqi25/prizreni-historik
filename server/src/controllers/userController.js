import bcrypt from 'bcrypt';
import { z } from 'zod';
import { env } from '../config/env.js';
import { query, queryOne } from '../config/db.js';
import { HttpError, asyncHandler, cleanText, LANGS, pickLang } from '../utils/helpers.js';
import { logActivity } from '../services/activity.js';
import { passwordRule, publicUser } from './authController.js';

export const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'min2').max(80, 'max80'),
  lastName: z.string().trim().min(2, 'min2').max(80, 'max80'),
  bio: z.string().trim().max(500, 'max500').optional().default(''),
  preferredLang: z.enum(LANGS).optional().default('sq'),
});

export const passwordSchema = z
  .object({ currentPassword: z.string().min(1, 'required'), newPassword: passwordRule, confirmPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'passwordMatch' });

export const wishlistSchema = z.object({
  visited: z.boolean().optional(),
  note: z.string().trim().max(500, 'max500').optional(),
});

async function monumentExists(id) {
  const row = await queryOne('SELECT id FROM monuments WHERE id = ? AND is_published = 1', [id]);
  if (!row) throw new HttpError(404, 'Monument not found', 'NOT_FOUND');
}

export const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, bio, preferredLang } = req.body;
  await query('UPDATE users SET first_name = ?, last_name = ?, bio = ?, preferred_lang = ? WHERE id = ?', [
    cleanText(firstName),
    cleanText(lastName),
    cleanText(bio) || null,
    preferredLang,
    req.user.id,
  ]);
  await logActivity(req.user.id, 'profile_update');
  const user = await queryOne('SELECT u.*, r.name AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ?', [req.user.id]);
  res.json({ user: publicUser(user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await queryOne('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!(await bcrypt.compare(req.body.currentPassword, user.password_hash))) {
    throw new HttpError(400, 'Current password is incorrect', 'INVALID_CREDENTIALS');
  }
  const hash = await bcrypt.hash(req.body.newPassword, env.bcryptRounds);
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  await logActivity(req.user.id, 'password_change');
  res.json({ message: 'Password updated' });
});

// ------------------------------------------------------------- saved lists
/** IDs only - lets every card on the site show the correct heart / bookmark state. */
export const getState = asyncHandler(async (req, res) => {
  const [favorites, wishlist] = await Promise.all([
    query('SELECT monument_id FROM favorites WHERE user_id = ?', [req.user.id]),
    query('SELECT monument_id, visited FROM wishlist WHERE user_id = ?', [req.user.id]),
  ]);
  res.json({
    favorites: favorites.map((f) => f.monument_id),
    wishlist: wishlist.map((w) => ({ id: w.monument_id, visited: !!w.visited })),
  });
});

const listSql = (table, extra = '') => `
  SELECT x.monument_id, x.created_at ${extra},
         m.slug, m.category, COALESCE(t.name, ts.name) AS name,
         COALESCE(t.short_description, ts.short_description) AS short_description,
         (SELECT i.thumb_path FROM monument_images i WHERE i.monument_id = m.id ORDER BY i.is_cover DESC, i.sort_order LIMIT 1) AS cover
    FROM ${table} x
    JOIN monuments m ON m.id = x.monument_id AND m.is_published = 1
    LEFT JOIN monument_translations t  ON t.monument_id  = m.id AND t.lang = ?
    LEFT JOIN monument_translations ts ON ts.monument_id = m.id AND ts.lang = 'sq'
   WHERE x.user_id = ?
   ORDER BY x.created_at DESC`;

const mapItem = (r) => ({
  id: r.monument_id,
  slug: r.slug,
  name: r.name,
  category: r.category,
  shortDescription: r.short_description,
  cover: r.cover,
  addedAt: r.created_at,
  ...(r.visited !== undefined ? { visited: !!r.visited, note: r.note } : {}),
});

export const getFavorites = asyncHandler(async (req, res) => {
  res.json({ items: (await query(listSql('favorites'), [pickLang(req.query.lang), req.user.id])).map(mapItem) });
});

export const addFavorite = asyncHandler(async (req, res) => {
  const id = Number(req.params.monumentId);
  await monumentExists(id);
  await query('INSERT IGNORE INTO favorites (user_id, monument_id) VALUES (?, ?)', [req.user.id, id]);
  await logActivity(req.user.id, 'favorite_add', id);
  res.status(201).json({ message: 'Added to favourites' });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  const id = Number(req.params.monumentId);
  await query('DELETE FROM favorites WHERE user_id = ? AND monument_id = ?', [req.user.id, id]);
  await logActivity(req.user.id, 'favorite_remove', id);
  res.json({ message: 'Removed from favourites' });
});

export const getWishlist = asyncHandler(async (req, res) => {
  res.json({
    items: (await query(listSql('wishlist', ', x.visited, x.note'), [pickLang(req.query.lang), req.user.id])).map(mapItem),
  });
});

export const upsertWishlist = asyncHandler(async (req, res) => {
  const id = Number(req.params.monumentId);
  await monumentExists(id);
  const { visited, note } = req.body;
  await query(
    `INSERT INTO wishlist (user_id, monument_id, visited, note) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE visited = COALESCE(?, visited), note = COALESCE(?, note)`,
    [req.user.id, id, visited ? 1 : 0, note ? cleanText(note) : null, visited === undefined ? null : (visited ? 1 : 0), note === undefined ? null : cleanText(note)],
  );
  await logActivity(req.user.id, visited ? 'wishlist_visited' : 'wishlist_add', id);
  res.status(201).json({ message: 'Saved' });
});

export const removeWishlist = asyncHandler(async (req, res) => {
  const id = Number(req.params.monumentId);
  await query('DELETE FROM wishlist WHERE user_id = ? AND monument_id = ?', [req.user.id, id]);
  await logActivity(req.user.id, 'wishlist_remove', id);
  res.json({ message: 'Removed from list' });
});

// ----------------------------------------------------------------- history
export const getMyActivity = asyncHandler(async (req, res) => {
  const lang = pickLang(req.query.lang);
  const [activity, reviews, comments] = await Promise.all([
    query(
      `SELECT a.id, a.action, a.created_at, m.slug, COALESCE(t.name, ts.name) AS name
         FROM user_activity a
         LEFT JOIN monuments m ON m.id = a.monument_id
         LEFT JOIN monument_translations t  ON t.monument_id  = m.id AND t.lang = ?
         LEFT JOIN monument_translations ts ON ts.monument_id = m.id AND ts.lang = 'sq'
        WHERE a.user_id = ? AND a.action <> 'login'
        ORDER BY a.created_at DESC LIMIT 60`,
      [lang, req.user.id],
    ),
    query(
      `SELECT r.id, r.rating, r.body, r.created_at, m.slug, COALESCE(t.name, ts.name) AS name
         FROM reviews r JOIN monuments m ON m.id = r.monument_id
         LEFT JOIN monument_translations t  ON t.monument_id  = m.id AND t.lang = ?
         LEFT JOIN monument_translations ts ON ts.monument_id = m.id AND ts.lang = 'sq'
        WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT 50`,
      [lang, req.user.id],
    ),
    query(
      `SELECT c.id, c.body, c.created_at, c.is_hidden, m.slug, COALESCE(t.name, ts.name) AS name
         FROM comments c JOIN monuments m ON m.id = c.monument_id
         LEFT JOIN monument_translations t  ON t.monument_id  = m.id AND t.lang = ?
         LEFT JOIN monument_translations ts ON ts.monument_id = m.id AND ts.lang = 'sq'
        WHERE c.user_id = ? ORDER BY c.created_at DESC LIMIT 50`,
      [lang, req.user.id],
    ),
  ]);
  res.json({
    activity: activity.map((a) => ({ id: a.id, action: a.action, createdAt: a.created_at, monumentSlug: a.slug, monumentName: a.name })),
    reviews: reviews.map((r) => ({ id: r.id, rating: r.rating, body: r.body, createdAt: r.created_at, monumentSlug: r.slug, monumentName: r.name })),
    comments: comments.map((c) => ({ id: c.id, body: c.body, createdAt: c.created_at, hidden: !!c.is_hidden, monumentSlug: c.slug, monumentName: c.name })),
  });
});
