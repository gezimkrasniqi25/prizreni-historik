import { z } from 'zod';
import { query, queryOne, withTransaction } from '../config/db.js';
import { HttpError, LANGS, asyncHandler, cleanText, mysqlDate, toInt } from '../utils/helpers.js';

// ------------------------------------------------------------------- users
export const getUsers = asyncHandler(async (req, res) => {
  const page = toInt(req.query.page, 1, { min: 1, max: 10000 });
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  const search = String(req.query.search || '').trim().slice(0, 100);
  const like = `%${search.replace(/[%_]/g, '')}%`;
  const where = search ? 'WHERE u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?' : '';
  const params = search ? [like, like, like] : [];

  const total = (await queryOne(`SELECT COUNT(*) AS c FROM users u ${where}`, params)).c;
  const rows = await query(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.is_verified, u.is_active, u.created_at, u.last_login_at, r.name AS role,
            (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id) AS comments,
            (SELECT COUNT(*) FROM reviews rv WHERE rv.user_id = u.id) AS reviews
       FROM users u JOIN roles r ON r.id = u.role_id ${where}
      ORDER BY u.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`,
    params,
  );
  res.json({
    total,
    page,
    pageSize,
    users: rows.map((u) => ({
      id: u.id, firstName: u.first_name, lastName: u.last_name, email: u.email, role: u.role,
      isVerified: !!u.is_verified, isActive: !!u.is_active, createdAt: u.created_at, lastLoginAt: u.last_login_at,
      comments: u.comments, reviews: u.reviews,
    })),
  });
});

export const userUpdateSchema = z.object({
  role: z.enum(['user', 'editor', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

export const updateUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const target = await queryOne('SELECT id FROM users WHERE id = ?', [id]);
  if (!target) throw new HttpError(404, 'User not found', 'NOT_FOUND');
  if (id === req.user.id) throw new HttpError(400, 'You cannot change your own role or status', 'FORBIDDEN');
  if (req.body.role) {
    await query('UPDATE users SET role_id = (SELECT id FROM roles WHERE name = ?) WHERE id = ?', [req.body.role, id]);
  }
  if (req.body.isActive !== undefined) {
    await query('UPDATE users SET is_active = ? WHERE id = ?', [req.body.isActive ? 1 : 0, id]);
  }
  res.json({ message: 'User updated' });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) throw new HttpError(400, 'You cannot delete your own account', 'FORBIDDEN');
  const result = await query('DELETE FROM users WHERE id = ?', [id]);
  if (!result.affectedRows) throw new HttpError(404, 'User not found', 'NOT_FOUND');
  res.json({ message: 'User deleted' });
});

// -------------------------------------------------------------- moderation
export const getModeration = asyncHandler(async (req, res) => {
  const type = req.query.type === 'reviews' ? 'reviews' : 'comments';
  const page = toInt(req.query.page, 1, { min: 1, max: 10000 });
  const pageSize = 25;
  const offset = (page - 1) * pageSize;
  const table = type;
  const textCol = 'body';
  const total = (await queryOne(`SELECT COUNT(*) AS c FROM ${table}`)).c;
  const rows = await query(
    `SELECT x.id, x.${textCol} AS body, x.is_hidden, x.created_at, ${type === 'reviews' ? 'x.rating,' : 'NULL AS rating,'}
            u.first_name, u.last_name, u.email, m.slug, COALESCE(t.name, m.slug) AS monument
       FROM ${table} x
       JOIN users u ON u.id = x.user_id
       JOIN monuments m ON m.id = x.monument_id
       LEFT JOIN monument_translations t ON t.monument_id = m.id AND t.lang = 'sq'
      ORDER BY x.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`,
  );
  res.json({
    total, page, pageSize, type,
    items: rows.map((r) => ({
      id: r.id, body: r.body, rating: r.rating, hidden: !!r.is_hidden, createdAt: r.created_at,
      author: `${r.first_name} ${r.last_name}`, email: r.email, monumentSlug: r.slug, monument: r.monument,
    })),
  });
});

export const moderateSchema = z.object({ hidden: z.boolean() });

export const moderateItem = (table) =>
  asyncHandler(async (req, res) => {
    const result = await query(`UPDATE ${table} SET is_hidden = ? WHERE id = ?`, [req.body.hidden ? 1 : 0, req.params.id]);
    if (!result.affectedRows) throw new HttpError(404, 'Not found', 'NOT_FOUND');
    res.json({ message: 'Updated' });
  });

export const deleteItem = (table) =>
  asyncHandler(async (req, res) => {
    const result = await query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
    if (!result.affectedRows) throw new HttpError(404, 'Not found', 'NOT_FOUND');
    res.json({ message: 'Deleted' });
  });

// ------------------------------------------------------------------- stats
export const getStats = asyncHandler(async (req, res) => {
  const days = toInt(req.query.days, 30, { min: 1, max: 365 });
  const since = mysqlDate(new Date(Date.now() - days * 86400000));

  const [totals] = await query(
    `SELECT COUNT(*) AS visits, COUNT(DISTINCT visitor_hash) AS uniqueVisitors
       FROM visitor_statistics WHERE visited_at >= ?`,
    [since],
  );
  const perDay = await query(
    `SELECT DATE_FORMAT(visited_at, '%Y-%m-%d') AS day, COUNT(*) AS visits, COUNT(DISTINCT visitor_hash) AS visitors
       FROM visitor_statistics WHERE visited_at >= ? GROUP BY day ORDER BY day`,
    [since],
  );
  const topMonuments = await query(
    `SELECT m.id, m.slug, COALESCE(t.name, m.slug) AS name, COUNT(*) AS visits, COUNT(DISTINCT s.visitor_hash) AS visitors
       FROM visitor_statistics s
       JOIN monuments m ON m.id = s.monument_id
       LEFT JOIN monument_translations t ON t.monument_id = m.id AND t.lang = 'sq'
      WHERE s.visited_at >= ? GROUP BY m.id, m.slug, t.name ORDER BY visits DESC LIMIT 10`,
    [since],
  );
  const byLang = await query('SELECT lang, COUNT(*) AS visits FROM visitor_statistics WHERE visited_at >= ? GROUP BY lang ORDER BY visits DESC', [since]);
  const byDevice = await query('SELECT device, COUNT(*) AS visits FROM visitor_statistics WHERE visited_at >= ? GROUP BY device ORDER BY visits DESC', [since]);
  const counts = await queryOne(
    `SELECT (SELECT COUNT(*) FROM users) AS users,
            (SELECT COUNT(*) FROM users WHERE is_verified = 1) AS verifiedUsers,
            (SELECT COUNT(*) FROM monuments) AS monuments,
            (SELECT COUNT(*) FROM comments) AS comments,
            (SELECT COUNT(*) FROM reviews) AS reviews,
            (SELECT COUNT(*) FROM favorites) AS favorites`,
  );
  res.json({ days, totals, perDay, topMonuments, byLang, byDevice, counts });
});

// ------------------------------------------------------------ site content
export const getAdminContent = asyncHandler(async (_req, res) => {
  const rows = await query('SELECT content_key, lang, content_value FROM site_content ORDER BY content_key, lang');
  const out = {};
  for (const r of rows) {
    out[r.content_key] ??= {};
    out[r.content_key][r.lang] = r.content_value;
  }
  res.json({ content: out });
});

export const contentSchema = z.object({
  key: z.string().trim().regex(/^[a-z0-9_.-]{2,100}$/i, 'invalidKey'),
  values: z.record(z.enum(LANGS), z.string().max(8000)),
});

export const saveContent = asyncHandler(async (req, res) => {
  await withTransaction(async (conn) => {
    for (const [lang, value] of Object.entries(req.body.values)) {
      await conn.execute(
        `INSERT INTO site_content (content_key, lang, content_value) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE content_value = VALUES(content_value)`,
        [req.body.key, lang, cleanText(value)],
      );
    }
  });
  res.json({ message: 'Saved' });
});

// ----------------------------------------------- events / activities / timeline
const itemTranslation = z.object({
  title: z.string().trim().max(200).default(''),
  description: z.string().trim().max(3000).default(''),
  whenLabel: z.string().trim().max(160).optional().default(''),
});

export const itemSchema = z.object({
  type: z.enum(['event', 'activity', 'timeline']),
  monumentId: z.coerce.number().int().positive().nullable().optional(),
  linkUrl: z.string().trim().max(500).optional().default(''),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  isPublished: z.boolean().optional().default(true),
  translations: z.object({ sq: itemTranslation.extend({ title: z.string().trim().min(1, 'required') }), en: itemTranslation.optional(), de: itemTranslation.optional() }),
});

export const listItems = asyncHandler(async (_req, res) => {
  const items = await query('SELECT * FROM cultural_items ORDER BY type, sort_order, id');
  const trans = await query('SELECT * FROM cultural_item_translations');
  res.json({
    items: items.map((i) => ({
      id: i.id, type: i.type, monumentId: i.monument_id, linkUrl: i.link_url || '', sortOrder: i.sort_order, isPublished: !!i.is_published,
      translations: Object.fromEntries(
        trans.filter((t) => t.item_id === i.id).map((t) => [t.lang, { title: t.title, description: t.description, whenLabel: t.when_label || '' }]),
      ),
    })),
  });
});

async function persistItem(conn, id, b) {
  for (const lang of LANGS) {
    const t = b.translations[lang];
    if (!t || !t.title) continue;
    await conn.execute(
      `INSERT INTO cultural_item_translations (item_id, lang, title, description, when_label) VALUES (?,?,?,?,?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), when_label = VALUES(when_label)`,
      [id, lang, cleanText(t.title), cleanText(t.description || ''), cleanText(t.whenLabel || '') || null],
    );
  }
}

export const createItem = asyncHandler(async (req, res) => {
  const b = req.body;
  const id = await withTransaction(async (conn) => {
    const [r] = await conn.execute(
      'INSERT INTO cultural_items (type, monument_id, link_url, sort_order, is_published) VALUES (?,?,?,?,?)',
      [b.type, b.monumentId || null, b.linkUrl || null, b.sortOrder, b.isPublished ? 1 : 0],
    );
    await persistItem(conn, r.insertId, b);
    return r.insertId;
  });
  res.status(201).json({ id });
});

export const updateItem = asyncHandler(async (req, res) => {
  const b = req.body;
  const exists = await queryOne('SELECT id FROM cultural_items WHERE id = ?', [req.params.id]);
  if (!exists) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  await withTransaction(async (conn) => {
    await conn.execute(
      'UPDATE cultural_items SET type=?, monument_id=?, link_url=?, sort_order=?, is_published=? WHERE id=?',
      [b.type, b.monumentId || null, b.linkUrl || null, b.sortOrder, b.isPublished ? 1 : 0, exists.id],
    );
    await persistItem(conn, exists.id, b);
  });
  res.json({ id: exists.id });
});

export const deleteCulturalItem = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM cultural_items WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) throw new HttpError(404, 'Not found', 'NOT_FOUND');
  res.json({ message: 'Deleted' });
});
