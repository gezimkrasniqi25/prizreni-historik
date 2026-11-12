import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { query, queryOne, withTransaction } from '../config/db.js';
import { HttpError, asyncHandler, cleanText, pickLang, slugify } from '../utils/helpers.js';
import { UPLOADS_DIR, removeUpload, saveImage, saveModel } from '../middleware/upload.js';
import { formatImage, formatModel, getImages, getModels, getMonumentBySlug, getTranslations, listMonuments, saveTranslations } from '../services/monumentService.js';

const CATEGORIES = ['fortress', 'mosque', 'church', 'cathedral', 'hamam', 'bridge', 'complex', 'tekke', 'museum'];

const translation = z.object({
  name: z.string().trim().min(1, 'required').max(200),
  altName: z.string().trim().max(200).optional().default(''),
  periodLabel: z.string().trim().max(160).optional().default(''),
  architecturalStyle: z.string().trim().max(200).optional().default(''),
  shortDescription: z.string().trim().min(1, 'required').max(600),
  history: z.string().trim().min(1, 'required').max(12000),
  significance: z.string().trim().min(1, 'required').max(6000),
  architecture: z.string().trim().min(1, 'required').max(6000),
  visitorInfo: z.string().trim().min(1, 'required').max(6000),
});

export const monumentSchema = z.object({
  slug: z.string().trim().max(110).optional().default(''),
  category: z.enum(CATEGORIES),
  modelArchetype: z.enum(CATEGORIES),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  builtYearStart: z.coerce.number().int().min(-5000).max(2100).nullable().optional(),
  builtYearEnd: z.coerce.number().int().min(-5000).max(2100).nullable().optional(),
  heritageReference: z.string().trim().max(255).optional().default(''),
  sources: z
    .array(z.object({ label: z.string().trim().min(1).max(200), url: z.string().trim().url().max(500) }))
    .max(15)
    .optional()
    .default([]),
  isPublished: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional().default(0),
  translations: z.object({
    sq: translation,
    en: translation.partial().optional(),
    de: translation.partial().optional(),
  }),
});

const nz = (v) => (v === undefined || v === null || v === '' ? null : v);

export const adminList = asyncHandler(async (req, res) => {
  res.json({ monuments: await listMonuments(pickLang(req.query.lang), { includeUnpublished: true }) });
});

export const adminGet = asyncHandler(async (req, res) => {
  const row = await queryOne('SELECT slug FROM monuments WHERE id = ?', [req.params.id]);
  if (!row) throw new HttpError(404, 'Monument not found', 'NOT_FOUND');
  const monument = await getMonumentBySlug(row.slug, 'sq', { includeUnpublished: true });
  monument.models = await getModels(monument.id, { onlyActive: false });
  res.json({ monument, translations: await getTranslations(monument.id) });
});

export const createMonument = asyncHandler(async (req, res) => {
  const b = req.body;
  const slug = slugify(b.slug || b.translations.sq.name);
  if (!slug) throw new HttpError(422, 'Invalid slug', 'VALIDATION_ERROR', { slug: 'required' });
  if (await queryOne('SELECT id FROM monuments WHERE slug = ?', [slug])) {
    throw new HttpError(409, 'A monument with this slug already exists', 'DUPLICATE', { slug: 'duplicate' });
  }
  const id = await withTransaction(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO monuments (slug, category, model_archetype, latitude, longitude, built_year_start, built_year_end,
                              heritage_reference, sources, is_published, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [slug, b.category, b.modelArchetype, b.latitude, b.longitude, nz(b.builtYearStart), nz(b.builtYearEnd),
        cleanText(b.heritageReference) || null, JSON.stringify(b.sources), b.isPublished ? 1 : 0, b.sortOrder],
    );
    await saveTranslations(conn, result.insertId, b.translations);
    return result.insertId;
  });
  res.status(201).json({ id, slug });
});

export const updateMonument = asyncHandler(async (req, res) => {
  const b = req.body;
  const existing = await queryOne('SELECT id, slug FROM monuments WHERE id = ?', [req.params.id]);
  if (!existing) throw new HttpError(404, 'Monument not found', 'NOT_FOUND');
  const slug = slugify(b.slug || existing.slug);
  const clash = await queryOne('SELECT id FROM monuments WHERE slug = ? AND id <> ?', [slug, existing.id]);
  if (clash) throw new HttpError(409, 'A monument with this slug already exists', 'DUPLICATE', { slug: 'duplicate' });

  await withTransaction(async (conn) => {
    await conn.execute(
      `UPDATE monuments SET slug=?, category=?, model_archetype=?, latitude=?, longitude=?, built_year_start=?, built_year_end=?,
              heritage_reference=?, sources=?, is_published=?, sort_order=? WHERE id=?`,
      [slug, b.category, b.modelArchetype, b.latitude, b.longitude, nz(b.builtYearStart), nz(b.builtYearEnd),
        cleanText(b.heritageReference) || null, JSON.stringify(b.sources), b.isPublished ? 1 : 0, b.sortOrder, existing.id],
    );
    await saveTranslations(conn, existing.id, b.translations);
  });
  res.json({ id: existing.id, slug });
});

export const deleteMonument = asyncHandler(async (req, res) => {
  const row = await queryOne('SELECT id, slug FROM monuments WHERE id = ?', [req.params.id]);
  if (!row) throw new HttpError(404, 'Monument not found', 'NOT_FOUND');
  await query('DELETE FROM monuments WHERE id = ?', [row.id]); // cascades to translations, images, models, reviews...
  for (const sub of [`monuments/${row.slug}`, `models/${row.slug}`]) {
    const dir = path.resolve(UPLOADS_DIR, sub);
    if (dir.startsWith(UPLOADS_DIR)) fs.rm(dir, { recursive: true, force: true }, () => {});
  }
  res.json({ message: 'Monument deleted' });
});

// -------------------------------------------------------------------- images
export const uploadImages = asyncHandler(async (req, res) => {
  const monument = await queryOne('SELECT id, slug FROM monuments WHERE id = ?', [req.params.id]);
  if (!monument) throw new HttpError(404, 'Monument not found', 'NOT_FOUND');
  if (!req.files?.length) throw new HttpError(400, 'No image uploaded', 'NO_FILE');

  const { author, license, licenseUrl, sourceUrl, caption } = req.body;
  const maxOrder = (await queryOne('SELECT COALESCE(MAX(sort_order), 0) AS m FROM monument_images WHERE monument_id = ?', [monument.id])).m;
  const hasCover = (await queryOne('SELECT COUNT(*) AS c FROM monument_images WHERE monument_id = ? AND is_cover = 1', [monument.id])).c > 0;

  const created = [];
  let order = maxOrder;
  for (const file of req.files) {
    const saved = await saveImage(file.buffer, `monuments/${monument.slug}`);
    order += 1;
    const result = await query(
      `INSERT INTO monument_images (monument_id, file_path, thumb_path, width, height, caption, author, license, license_url, source_url, is_cover, sort_order)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [monument.id, saved.filePath, saved.thumbPath, saved.width, saved.height, cleanText(caption) || null,
        cleanText(author) || null, cleanText(license) || null, cleanText(licenseUrl) || null, cleanText(sourceUrl) || null,
        !hasCover && created.length === 0 ? 1 : 0, order],
    );
    created.push(result.insertId);
  }
  const images = await getImages(monument.id);
  res.status(201).json({ images });
});

export const imageSchema = z.object({
  caption: z.string().trim().max(255).optional(),
  author: z.string().trim().max(255).optional(),
  license: z.string().trim().max(80).optional(),
  licenseUrl: z.string().trim().max(255).optional(),
  sourceUrl: z.string().trim().max(500).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isCover: z.boolean().optional(),
});

export const updateImage = asyncHandler(async (req, res) => {
  const img = await queryOne('SELECT * FROM monument_images WHERE id = ?', [req.params.imageId]);
  if (!img) throw new HttpError(404, 'Image not found', 'NOT_FOUND');
  const b = req.body;
  await withTransaction(async (conn) => {
    if (b.isCover && img.monument_id) {
      await conn.execute('UPDATE monument_images SET is_cover = 0 WHERE monument_id = ?', [img.monument_id]);
    }
    await conn.execute(
      `UPDATE monument_images SET caption = ?, author = ?, license = ?, license_url = ?, source_url = ?, sort_order = ?, is_cover = ? WHERE id = ?`,
      [
        b.caption !== undefined ? cleanText(b.caption) || null : img.caption,
        b.author !== undefined ? cleanText(b.author) || null : img.author,
        b.license !== undefined ? cleanText(b.license) || null : img.license,
        b.licenseUrl !== undefined ? cleanText(b.licenseUrl) || null : img.license_url,
        b.sourceUrl !== undefined ? cleanText(b.sourceUrl) || null : img.source_url,
        b.sortOrder ?? img.sort_order,
        b.isCover === undefined ? img.is_cover : (b.isCover ? 1 : 0),
        img.id,
      ],
    );
  });
  res.json({ image: formatImage(await queryOne('SELECT * FROM monument_images WHERE id = ?', [img.id])) });
});

export const deleteImage = asyncHandler(async (req, res) => {
  const img = await queryOne('SELECT * FROM monument_images WHERE id = ?', [req.params.imageId]);
  if (!img) throw new HttpError(404, 'Image not found', 'NOT_FOUND');
  await query('DELETE FROM monument_images WHERE id = ?', [img.id]);
  removeUpload(img.file_path);
  removeUpload(img.thumb_path);
  if (img.is_cover && img.monument_id) {
    await query(
      'UPDATE monument_images SET is_cover = 1 WHERE monument_id = ? ORDER BY sort_order, id LIMIT 1',
      [img.monument_id],
    );
  }
  res.json({ message: 'Image deleted' });
});

// -------------------------------------------------------------------- models
const KINDS = ['photogrammetry_scan', 'laser_scan', 'documented_reconstruction', 'artist_model'];

export const modelMetaSchema = z.object({
  title: z.string().trim().min(2, 'min2').max(200),
  kind: z.enum(KINDS),
  isAuthentic: z.preprocess((v) => v === true || v === 'true' || v === '1' || v === 'on', z.boolean()),
  sourceName: z.string().trim().max(200).optional().default(''),
  sourceUrl: z.string().trim().max(500).optional().default(''),
  license: z.string().trim().max(120).optional().default(''),
  credit: z.string().trim().max(255).optional().default(''),
});

export const uploadModel = asyncHandler(async (req, res) => {
  const monument = await queryOne('SELECT id, slug FROM monuments WHERE id = ?', [req.params.id]);
  if (!monument) throw new HttpError(404, 'Monument not found', 'NOT_FOUND');
  if (!req.file) throw new HttpError(400, 'No 3D model uploaded', 'NO_FILE');
  const b = req.body;
  // Honesty guard: only scans / documented reconstructions with a named source can be flagged as authentic.
  const authenticKinds = ['photogrammetry_scan', 'laser_scan', 'documented_reconstruction'];
  if (b.isAuthentic && (!authenticKinds.includes(b.kind) || !b.sourceName)) {
    throw new HttpError(422, 'An "authentic" model must be a scan or documented reconstruction with a named source', 'VALIDATION_ERROR', {
      isAuthentic: 'authenticNeedsSource',
    });
  }
  const saved = saveModel(req.file, monument.slug);
  const result = await query(
    `INSERT INTO monument_3d_models (monument_id, title, file_path, file_size, format, model_kind, is_authentic, source_name, source_url, license, credit)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [monument.id, cleanText(b.title), saved.filePath, saved.size, saved.format, b.kind, b.isAuthentic ? 1 : 0,
      cleanText(b.sourceName) || null, cleanText(b.sourceUrl) || null, cleanText(b.license) || null, cleanText(b.credit) || null],
  );
  const row = await queryOne('SELECT * FROM monument_3d_models WHERE id = ?', [result.insertId]);
  res.status(201).json({ model: formatModel(row) });
});

export const toggleModel = asyncHandler(async (req, res) => {
  const row = await queryOne('SELECT * FROM monument_3d_models WHERE id = ?', [req.params.modelId]);
  if (!row) throw new HttpError(404, 'Model not found', 'NOT_FOUND');
  const active = req.body.isActive ? 1 : 0;
  await query('UPDATE monument_3d_models SET is_active = ? WHERE id = ?', [active, row.id]);
  res.json({ model: formatModel({ ...row, is_active: active }) });
});

export const deleteModel = asyncHandler(async (req, res) => {
  const row = await queryOne('SELECT * FROM monument_3d_models WHERE id = ?', [req.params.modelId]);
  if (!row) throw new HttpError(404, 'Model not found', 'NOT_FOUND');
  await query('DELETE FROM monument_3d_models WHERE id = ?', [row.id]);
  removeUpload(row.file_path);
  res.json({ message: 'Model deleted' });
});
