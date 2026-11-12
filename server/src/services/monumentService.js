import { query, queryOne } from '../config/db.js';
import { LANGS } from '../utils/helpers.js';

const TEXT_FIELDS = [
  'name', 'alt_name', 'period_label', 'architectural_style',
  'short_description', 'history', 'significance', 'architecture', 'visitor_info',
];

const coalesced = TEXT_FIELDS.map((f) => `COALESCE(t.${f}, ts.${f}) AS ${f}`).join(', ');

const BASE_SELECT = `
  SELECT m.id, m.slug, m.category, m.model_archetype, m.latitude, m.longitude,
         m.built_year_start, m.built_year_end, m.heritage_reference, m.sources,
         m.is_published, m.sort_order, m.view_count,
         ${coalesced},
         (SELECT i.file_path  FROM monument_images i WHERE i.monument_id = m.id ORDER BY i.is_cover DESC, i.sort_order, i.id LIMIT 1) AS cover,
         (SELECT i.thumb_path FROM monument_images i WHERE i.monument_id = m.id ORDER BY i.is_cover DESC, i.sort_order, i.id LIMIT 1) AS cover_thumb,
         (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.monument_id = m.id AND r.is_hidden = 0) AS avg_rating,
         (SELECT COUNT(*) FROM reviews r WHERE r.monument_id = m.id AND r.is_hidden = 0) AS review_count,
         (SELECT COUNT(*) FROM monument_3d_models x WHERE x.monument_id = m.id AND x.is_active = 1) AS model_count
    FROM monuments m
    LEFT JOIN monument_translations t  ON t.monument_id  = m.id AND t.lang  = ?
    LEFT JOIN monument_translations ts ON ts.monument_id = m.id AND ts.lang = 'sq'`;

export const formatMonument = (r, { full = false } = {}) => {
  const base = {
    id: r.id,
    slug: r.slug,
    category: r.category,
    modelArchetype: r.model_archetype,
    latitude: r.latitude,
    longitude: r.longitude,
    builtYearStart: r.built_year_start,
    builtYearEnd: r.built_year_end,
    name: r.name,
    periodLabel: r.period_label,
    shortDescription: r.short_description,
    cover: r.cover,
    coverThumb: r.cover_thumb,
    avgRating: r.avg_rating === null ? null : Number(r.avg_rating),
    reviewCount: r.review_count,
    hasModel: r.model_count > 0,
    viewCount: r.view_count,
    isPublished: !!r.is_published,
  };
  if (!full) return base;
  return {
    ...base,
    altName: r.alt_name,
    architecturalStyle: r.architectural_style,
    history: r.history,
    significance: r.significance,
    architecture: r.architecture,
    visitorInfo: r.visitor_info,
    heritageReference: r.heritage_reference,
    sources: r.sources || [],
    viewCount: r.view_count,
    isPublished: !!r.is_published,
  };
};

export async function listMonuments(lang, { includeUnpublished = false } = {}) {
  const rows = await query(
    `${BASE_SELECT} ${includeUnpublished ? '' : 'WHERE m.is_published = 1'} ORDER BY m.sort_order, m.id`,
    [lang],
  );
  return rows.map((r) => formatMonument(r));
}

export const formatImage = (i) => ({
  id: i.id,
  url: i.file_path,
  thumb: i.thumb_path,
  width: i.width,
  height: i.height,
  caption: i.caption,
  author: i.author,
  license: i.license,
  licenseUrl: i.license_url,
  sourceUrl: i.source_url,
  isCover: !!i.is_cover,
  sortOrder: i.sort_order,
});

export const formatModel = (m) => ({
  id: m.id,
  title: m.title,
  url: m.file_path,
  fileSize: m.file_size,
  format: m.format,
  kind: m.model_kind,
  isAuthentic: !!m.is_authentic,
  sourceName: m.source_name,
  sourceUrl: m.source_url,
  license: m.license,
  credit: m.credit,
  isActive: !!m.is_active,
});

export async function getImages(monumentId) {
  const rows = await query(
    'SELECT * FROM monument_images WHERE monument_id = ? ORDER BY is_cover DESC, sort_order, id',
    [monumentId],
  );
  return rows.map(formatImage);
}

export async function getModels(monumentId, { onlyActive = true } = {}) {
  const rows = await query(
    `SELECT * FROM monument_3d_models WHERE monument_id = ? ${onlyActive ? 'AND is_active = 1' : ''} ORDER BY id`,
    [monumentId],
  );
  return rows.map(formatModel);
}

export async function getMonumentBySlug(slug, lang, { includeUnpublished = false } = {}) {
  const row = await queryOne(
    `${BASE_SELECT} WHERE m.slug = ? ${includeUnpublished ? '' : 'AND m.is_published = 1'}`,
    [lang, slug],
  );
  if (!row) return null;
  const [images, models] = await Promise.all([getImages(row.id), getModels(row.id)]);
  return { ...formatMonument(row, { full: true }), images, models };
}

/** All translations (admin editing). */
export async function getTranslations(monumentId) {
  const rows = await query('SELECT * FROM monument_translations WHERE monument_id = ?', [monumentId]);
  const out = {};
  for (const lang of LANGS) out[lang] = {};
  for (const r of rows) {
    out[r.lang] = {
      name: r.name,
      altName: r.alt_name || '',
      periodLabel: r.period_label || '',
      architecturalStyle: r.architectural_style || '',
      shortDescription: r.short_description,
      history: r.history,
      significance: r.significance,
      architecture: r.architecture,
      visitorInfo: r.visitor_info,
    };
  }
  return out;
}

export async function saveTranslations(conn, monumentId, translations) {
  for (const lang of LANGS) {
    const t = translations?.[lang];
    if (!t || !t.name) continue;
    await conn.execute(
      `INSERT INTO monument_translations
         (monument_id, lang, name, alt_name, period_label, architectural_style, short_description, history, significance, architecture, visitor_info)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), alt_name=VALUES(alt_name), period_label=VALUES(period_label),
         architectural_style=VALUES(architectural_style), short_description=VALUES(short_description),
         history=VALUES(history), significance=VALUES(significance), architecture=VALUES(architecture),
         visitor_info=VALUES(visitor_info)`,
      [
        monumentId, lang, t.name, t.altName || null, t.periodLabel || null, t.architecturalStyle || null,
        t.shortDescription || '', t.history || '', t.significance || '', t.architecture || '', t.visitorInfo || '',
      ],
    );
  }
}
