import crypto from 'node:crypto';
import { z } from 'zod';
import { query, queryOne } from '../config/db.js';
import { HttpError, asyncHandler, cleanText, detectDevice, pickLang } from '../utils/helpers.js';
import { getMonumentBySlug, listMonuments } from '../services/monumentService.js';
import { logActivity } from '../services/activity.js';

// ---------------------------------------------------------------- monuments
export const getMonuments = asyncHandler(async (req, res) => {
  res.json({ monuments: await listMonuments(pickLang(req.query.lang)) });
});

export const getMonument = asyncHandler(async (req, res) => {
  const monument = await getMonumentBySlug(req.params.slug, pickLang(req.query.lang));
  if (!monument) throw new HttpError(404, 'Monument not found', 'NOT_FOUND');
  // Increment the counter without blocking the response.
  query('UPDATE monuments SET view_count = view_count + 1 WHERE id = ?', [monument.id]).catch(() => {});
  res.json({ monument });
});

async function monumentIdFromSlug(slug) {
  const row = await queryOne('SELECT id FROM monuments WHERE slug = ? AND is_published = 1', [slug]);
  if (!row) throw new HttpError(404, 'Monument not found', 'NOT_FOUND');
  return row.id;
}

// ------------------------------------------------------------------ reviews
export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'rating').max(5, 'rating'),
  body: z.string().trim().max(1500, 'max1500').optional().default(''),
});

export const getReviews = asyncHandler(async (req, res) => {
  const id = await monumentIdFromSlug(req.params.slug);
  const rows = await query(
    `SELECT r.id, r.rating, r.body, r.created_at, r.updated_at, u.id AS user_id, u.first_name, u.last_name
       FROM reviews r JOIN users u ON u.id = r.user_id
      WHERE r.monument_id = ? AND r.is_hidden = 0
      ORDER BY r.created_at DESC LIMIT 100`,
    [id],
  );
  const summary = await queryOne(
    'SELECT ROUND(AVG(rating),1) AS avg, COUNT(*) AS count FROM reviews WHERE monument_id = ? AND is_hidden = 0',
    [id],
  );
  res.json({
    summary: { average: summary.avg === null ? null : Number(summary.avg), count: summary.count },
    reviews: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      createdAt: r.created_at,
      author: { id: r.user_id, name: `${r.first_name} ${r.last_name.charAt(0)}.` },
    })),
  });
});

export const upsertReview = asyncHandler(async (req, res) => {
  const id = await monumentIdFromSlug(req.params.slug);
  const body = cleanText(req.body.body);
  await query(
    `INSERT INTO reviews (user_id, monument_id, rating, body) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), body = VALUES(body), is_hidden = 0`,
    [req.user.id, id, req.body.rating, body || null],
  );
  await logActivity(req.user.id, 'review', id);
  res.status(201).json({ message: 'Review saved' });
});

export const deleteOwnReview = asyncHandler(async (req, res) => {
  const id = await monumentIdFromSlug(req.params.slug);
  await query('DELETE FROM reviews WHERE user_id = ? AND monument_id = ?', [req.user.id, id]);
  res.json({ message: 'Review deleted' });
});

// ----------------------------------------------------------------- comments
export const commentSchema = z.object({
  body: z.string().trim().min(2, 'min2').max(1500, 'max1500'),
  parentId: z.coerce.number().int().positive().optional().nullable(),
});

export const getComments = asyncHandler(async (req, res) => {
  const id = await monumentIdFromSlug(req.params.slug);
  const rows = await query(
    `SELECT c.id, c.parent_id, c.body, c.created_at, u.id AS user_id, u.first_name, u.last_name, ro.name AS role
       FROM comments c JOIN users u ON u.id = c.user_id JOIN roles ro ON ro.id = u.role_id
      WHERE c.monument_id = ? AND c.is_hidden = 0
      ORDER BY c.created_at ASC LIMIT 300`,
    [id],
  );
  res.json({
    comments: rows.map((c) => ({
      id: c.id,
      parentId: c.parent_id,
      body: c.body,
      createdAt: c.created_at,
      author: { id: c.user_id, name: `${c.first_name} ${c.last_name.charAt(0)}.`, isStaff: c.role !== 'user' },
    })),
  });
});

export const addComment = asyncHandler(async (req, res) => {
  const id = await monumentIdFromSlug(req.params.slug);
  let parentId = null;
  if (req.body.parentId) {
    const parent = await queryOne('SELECT id, parent_id FROM comments WHERE id = ? AND monument_id = ? AND is_hidden = 0', [
      req.body.parentId,
      id,
    ]);
    if (!parent) throw new HttpError(404, 'Parent comment not found', 'NOT_FOUND');
    parentId = parent.parent_id || parent.id; // one level of replies
  }
  const result = await query('INSERT INTO comments (user_id, monument_id, parent_id, body) VALUES (?, ?, ?, ?)', [
    req.user.id,
    id,
    parentId,
    cleanText(req.body.body),
  ]);
  await logActivity(req.user.id, 'comment', id);
  res.status(201).json({ id: result.insertId });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const row = await queryOne('SELECT id, user_id FROM comments WHERE id = ?', [req.params.commentId]);
  if (!row) throw new HttpError(404, 'Comment not found', 'NOT_FOUND');
  const isStaff = ['admin', 'editor'].includes(req.user.role);
  if (row.user_id !== req.user.id && !isStaff) throw new HttpError(403, 'Not allowed', 'FORBIDDEN');
  await query('DELETE FROM comments WHERE id = ?', [row.id]);
  res.json({ message: 'Comment deleted' });
});

// ------------------------------------------------------------------ content
export const getContent = asyncHandler(async (req, res) => {
  const lang = pickLang(req.query.lang);
  const rows = await query(
    `SELECT content_key, COALESCE(MAX(CASE WHEN lang = ? THEN content_value END),
                                  MAX(CASE WHEN lang = 'sq' THEN content_value END)) AS value
       FROM site_content GROUP BY content_key`,
    [lang],
  );
  const content = Object.fromEntries(rows.map((r) => [r.content_key, r.value]));

  const items = await query(
    `SELECT ci.id, ci.type, ci.link_url, ci.image_path, ci.monument_id, m.slug AS monument_slug,
            COALESCE(t.title, ts.title) AS title,
            COALESCE(t.description, ts.description) AS description,
            COALESCE(t.when_label, ts.when_label) AS when_label
       FROM cultural_items ci
       LEFT JOIN cultural_item_translations t  ON t.item_id  = ci.id AND t.lang = ?
       LEFT JOIN cultural_item_translations ts ON ts.item_id = ci.id AND ts.lang = 'sq'
       LEFT JOIN monuments m ON m.id = ci.monument_id
      WHERE ci.is_published = 1
      ORDER BY ci.type, ci.sort_order, ci.id`,
    [lang],
  );
  const fmt = (i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    whenLabel: i.when_label,
    linkUrl: i.link_url,
    image: i.image_path,
    monumentSlug: i.monument_slug,
  });
  const heroImages = await query(
    `SELECT file_path, thumb_path, author, license, license_url, source_url
       FROM monument_images WHERE monument_id IS NULL ORDER BY sort_order, id`,
  );

  res.json({
    content,
    events: items.filter((i) => i.type === 'event').map(fmt),
    activities: items.filter((i) => i.type === 'activity').map(fmt),
    timeline: items.filter((i) => i.type === 'timeline').map(fmt),
    siteImages: heroImages.map((h) => ({
      url: h.file_path, thumb: h.thumb_path, author: h.author, license: h.license, licenseUrl: h.license_url, sourceUrl: h.source_url,
    })),
  });
});

// -------------------------------------------------------------------- stats
export const visitSchema = z.object({
  path: z.string().trim().min(1).max(255),
  monumentSlug: z.string().trim().max(120).optional().nullable(),
  lang: z.string().max(5).optional(),
});

export const trackVisit = asyncHandler(async (req, res) => {
  const device = detectDevice(req.get('user-agent') || '');
  if (device !== 'bot') {
    // Visitors are identified only by a hash that changes every day (no cookies, no raw IP stored).
    const day = new Date().toISOString().slice(0, 10);
    const visitor = crypto
      .createHash('sha256')
      .update(`${req.ip}|${req.get('user-agent') || ''}|${day}`)
      .digest('hex')
      .slice(0, 16);
    let monumentId = null;
    if (req.body.monumentSlug) {
      monumentId = (await queryOne('SELECT id FROM monuments WHERE slug = ?', [req.body.monumentSlug]))?.id ?? null;
    }
    await query(
      'INSERT INTO visitor_statistics (monument_id, user_id, path, visitor_hash, lang, device) VALUES (?,?,?,?,?,?)',
      [monumentId, req.user?.id ?? null, req.body.path.slice(0, 255), visitor, pickLang(req.body.lang), device],
    );
  }
  res.status(204).end();
});
