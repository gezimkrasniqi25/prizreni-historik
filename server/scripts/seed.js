/**
 * Inserts the initial data: administrator, the 11 monuments (sq/en/de), their
 * real photographs (with attribution), site content, timeline, events and activities.
 * Safe to re-run: it updates seeded rows, it does not duplicate them.
 * Note: re-running restores the seeded texts (it overwrites admin edits of them).
 */
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcrypt';
import { env, SERVER_ROOT } from '../src/config/env.js';
import { pool, query, queryOne, withTransaction } from '../src/config/db.js';
import { monumentsBase } from '../database/seed/monuments.base.js';
import { sq } from '../database/seed/monuments.sq.js';
import { en } from '../database/seed/monuments.en.js';
import { de } from '../database/seed/monuments.de.js';
import { activities, events, siteContent, timeline } from '../database/seed/content.js';

const texts = { sq, en, de };
const imagesFile = path.join(SERVER_ROOT, 'database', 'seed', 'images.json');
const images = fs.existsSync(imagesFile) ? JSON.parse(fs.readFileSync(imagesFile, 'utf8')) : {};
if (!fs.existsSync(imagesFile)) {
  console.warn('! images.json not found - run "npm run images:fetch --prefix server" to download the photos.');
}

async function seedAdmin() {
  const { email, password, firstName, lastName } = env.admin;
  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    await query('UPDATE users SET role_id = 3, is_verified = 1, is_active = 1 WHERE id = ?', [existing.id]);
    console.log(`Admin already exists: ${email}`);
    return;
  }
  const hash = await bcrypt.hash(password, env.bcryptRounds);
  await query(
    `INSERT INTO users (role_id, first_name, last_name, email, password_hash, is_verified, verified_at, accepted_terms_at, preferred_lang)
     VALUES (3, ?, ?, ?, ?, 1, NOW(), NOW(), 'sq')`,
    [firstName, lastName, email, hash],
  );
  console.log(`Admin created: ${email}  (password from ADMIN_PASSWORD in .env - change it after first login)`);
}

async function seedMonuments() {
  const idBySlug = {};
  for (const [index, m] of monumentsBase.entries()) {
    await withTransaction(async (conn) => {
      await conn.execute(
        `INSERT INTO monuments (slug, category, model_archetype, latitude, longitude, built_year_start, built_year_end,
                                heritage_reference, sources, is_published, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,1,?)
         ON DUPLICATE KEY UPDATE category=VALUES(category), model_archetype=VALUES(model_archetype), latitude=VALUES(latitude),
           longitude=VALUES(longitude), built_year_start=VALUES(built_year_start), built_year_end=VALUES(built_year_end),
           heritage_reference=VALUES(heritage_reference), sources=VALUES(sources), sort_order=VALUES(sort_order)`,
        [m.slug, m.category, m.archetype, m.lat, m.lng, m.yearStart, m.yearEnd, m.heritageReference, JSON.stringify(m.sources), index + 1],
      );
      const [[row]] = await conn.execute('SELECT id FROM monuments WHERE slug = ?', [m.slug]);
      idBySlug[m.slug] = row.id;

      for (const lang of ['sq', 'en', 'de']) {
        const t = texts[lang][m.slug];
        if (!t) throw new Error(`Missing ${lang} text for ${m.slug}`);
        await conn.execute(
          `INSERT INTO monument_translations (monument_id, lang, name, alt_name, period_label, architectural_style,
                                              short_description, history, significance, architecture, visitor_info)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE name=VALUES(name), alt_name=VALUES(alt_name), period_label=VALUES(period_label),
             architectural_style=VALUES(architectural_style), short_description=VALUES(short_description),
             history=VALUES(history), significance=VALUES(significance), architecture=VALUES(architecture),
             visitor_info=VALUES(visitor_info)`,
          [row.id, lang, t.name, t.altName, t.periodLabel, t.architecturalStyle, t.shortDescription, t.history, t.significance, t.architecture, t.visitorInfo],
        );
      }

      // Photos: replace only the seeded ones (those that carry a Commons source URL)
      await conn.execute(`DELETE FROM monument_images WHERE monument_id = ? AND source_url LIKE 'https://commons.wikimedia.org/%'`, [row.id]);
      const list = images[m.slug] || [];
      const hasOwnCover = (await conn.execute('SELECT COUNT(*) AS c FROM monument_images WHERE monument_id = ? AND is_cover = 1', [row.id]))[0][0].c > 0;
      for (const [i, im] of list.entries()) {
        await conn.execute(
          `INSERT INTO monument_images (monument_id, file_path, thumb_path, width, height, caption, author, license, license_url, source_url, is_cover, sort_order)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [row.id, im.file, im.thumb, im.width, im.height, null, im.author, im.license, im.licenseUrl, im.sourceUrl, !hasOwnCover && i === 0 ? 1 : 0, i + 1],
        );
      }
    });
    console.log(`  monument: ${m.slug}`);
  }
  return idBySlug;
}

async function seedSiteImages() {
  await query(`DELETE FROM monument_images WHERE monument_id IS NULL AND source_url LIKE 'https://commons.wikimedia.org/%'`);
  for (const [i, im] of (images.site || []).entries()) {
    await query(
      `INSERT INTO monument_images (monument_id, file_path, thumb_path, width, height, author, license, license_url, source_url, is_cover, sort_order)
       VALUES (NULL,?,?,?,?,?,?,?,?,?,?)`,
      [im.file, im.thumb, im.width, im.height, im.author, im.license, im.licenseUrl, im.sourceUrl, i === 0 ? 1 : 0, i + 1],
    );
  }
}

async function seedContent(idBySlug) {
  for (const [key, values] of Object.entries(siteContent)) {
    for (const [lang, value] of Object.entries(values)) {
      await query(
        `INSERT INTO site_content (content_key, lang, content_value) VALUES (?,?,?)
         ON DUPLICATE KEY UPDATE content_value = VALUES(content_value)`,
        [key, lang, value],
      );
    }
  }

  await query('DELETE FROM cultural_items'); // cascades to translations
  const insert = async (type, items) => {
    for (const [i, item] of items.entries()) {
      const r = await query(
        'INSERT INTO cultural_items (type, monument_id, link_url, sort_order, is_published) VALUES (?,?,?,?,1)',
        [type, item.monument ? idBySlug[item.monument] : null, item.link || null, i + 1],
      );
      for (const lang of ['sq', 'en', 'de']) {
        const t = item[lang];
        await query(
          'INSERT INTO cultural_item_translations (item_id, lang, title, description, when_label) VALUES (?,?,?,?,?)',
          [r.insertId, lang, t.title, t.description, t.whenLabel || null],
        );
      }
    }
  };
  await insert('timeline', timeline);
  await insert('event', events);
  await insert('activity', activities);
}

try {
  console.log('Seeding...');
  await seedAdmin();
  const idBySlug = await seedMonuments();
  await seedSiteImages();
  await seedContent(idBySlug);
  console.log('Done.');
} catch (err) {
  console.error('Seed failed:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
