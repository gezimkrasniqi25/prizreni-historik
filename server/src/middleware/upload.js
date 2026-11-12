import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { SERVER_ROOT } from '../config/env.js';
import { HttpError } from '../utils/helpers.js';

export const UPLOADS_DIR = path.join(SERVER_ROOT, 'uploads');

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MODEL_EXTS = new Set(['.glb', '.gltf']);

/** Images are kept in memory, validated and re-encoded by sharp (so a disguised file can never be stored). */
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) =>
    IMAGE_TYPES.has(file.mimetype) ? cb(null, true) : cb(new HttpError(415, 'Only JPEG, PNG or WebP images are allowed', 'BAD_FILE_TYPE')),
});

export const modelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) =>
    MODEL_EXTS.has(path.extname(file.originalname).toLowerCase())
      ? cb(null, true)
      : cb(new HttpError(415, 'Only .glb or .gltf 3D models are allowed', 'BAD_FILE_TYPE')),
});

const rand = () => crypto.randomBytes(6).toString('hex');

/** Optimises an uploaded image: 1600px + 800px WebP. Returns web paths + dimensions. */
export async function saveImage(buffer, folder) {
  const dir = path.join(UPLOADS_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  const base = `${Date.now()}-${rand()}`;
  let img;
  try {
    img = sharp(buffer, { failOn: 'error' }).rotate();
    await img.metadata();
  } catch {
    throw new HttpError(415, 'The file is not a valid image', 'BAD_FILE_TYPE');
  }
  const full = path.join(dir, `${base}-1600.webp`);
  const thumb = path.join(dir, `${base}-800.webp`);
  await img.clone().resize({ width: 1600, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(full);
  await img.clone().resize({ width: 800, height: 900, fit: 'inside', withoutEnlargement: true }).webp({ quality: 72 }).toFile(thumb);
  const { width, height } = await sharp(full).metadata();
  return {
    filePath: `/uploads/${folder}/${base}-1600.webp`,
    thumbPath: `/uploads/${folder}/${base}-800.webp`,
    width,
    height,
  };
}

/** Validates a GLB header (magic "glTF") or a JSON glTF, then stores it. */
export function saveModel(file, folder) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.glb') {
    if (file.buffer.length < 12 || file.buffer.toString('ascii', 0, 4) !== 'glTF') {
      throw new HttpError(415, 'This is not a valid GLB file', 'BAD_FILE_TYPE');
    }
  } else {
    try {
      const json = JSON.parse(file.buffer.toString('utf8'));
      if (!json.asset) throw new Error('no asset');
    } catch {
      throw new HttpError(415, 'This is not a valid glTF file', 'BAD_FILE_TYPE');
    }
  }
  const dir = path.join(UPLOADS_DIR, 'models', folder);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${Date.now()}-${rand()}${ext}`;
  fs.writeFileSync(path.join(dir, name), file.buffer);
  return { filePath: `/uploads/models/${folder}/${name}`, size: file.buffer.length, format: ext.slice(1) };
}

/** Deletes a stored file given its public path (ignores anything outside /uploads). */
export function removeUpload(webPath) {
  if (!webPath || !webPath.startsWith('/uploads/')) return;
  const abs = path.resolve(UPLOADS_DIR, webPath.replace('/uploads/', ''));
  if (!abs.startsWith(UPLOADS_DIR)) return;
  fs.rm(abs, { force: true }, () => {});
}
