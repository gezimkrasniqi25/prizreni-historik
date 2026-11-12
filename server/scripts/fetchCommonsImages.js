/**
 * Downloads real, openly licensed photographs from Wikimedia Commons for every
 * monument, optimises them (WebP, 800px + 1600px) and writes the metadata
 * (author, licence, source URL) to server/database/seed/images.json.
 *
 * Usage: npm run images:fetch --prefix server
 *
 * Nothing here is generated or invented: every file keeps its Commons title,
 * author and licence so the attribution can be shown next to each photo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const UPLOADS = path.join(ROOT, 'uploads');
const OUT_JSON = path.join(ROOT, 'database', 'seed', 'images.json');
const UA = { 'User-Agent': 'PrizrenHeritageProject/1.0 (educational project; local development)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// First image of every list becomes the cover photo.
const MANIFEST = {
  site: [
    'Panoramic of Prizren from the castle.jpg',
    'Prizren panorama.jpg',
    'Prizren Fortress (Kalaja e Prizrenit).jpg',
  ],
  'kalaja-e-prizrenit': [
    'Prizren Fortress (Kalaja e Prizrenit).jpg',
    'The Prizren Fortress 01.jpg',
    'The Prizren Fortress 02.jpg',
    'The Prizren Fortress 06.jpg',
    'Atop the Prizren Fortress, Kosovo.jpg',
  ],
  'xhamia-e-sinan-pashes': [
    'Sinan Pasha Mosque Prizren II.jpg',
    'Sinan Pasha Mosque view from Prizren Bridge.jpg',
    'Xhamia e Sinan Pashës, Prizren 2018 08.jpg',
    'Sunset over Sinan Pasha Mosque, Accursed Mountains.jpg',
    'Sinan Pasha Mosque (Prizren) 1.jpg',
  ],
  'lidhja-shqiptare-e-prizrenit': [
    'Lidhja e Prizrenit, By MIBER.jpg',
    'Lidhja e Prizrenit 2.jpg',
    'The yeard of "Lidhja e Prizrenit".jpg',
    'Albanian Leauge of Prizren 1878 - Museum 01.jpg',
    'Albanian Leauge of Prizren 1878 - Museum 02.jpg',
  ],
  'kisha-e-shen-premtes': [
    '2011 Prizren, Cerkiew Bogurodzicy Ljeviškiej 11.JPG',
    'Iglesia de Nuestra Señora de Ljevis, Prizren, Kosovo, 2014-04-16, DD 05.JPG',
    'Our Lady of Ljeviš, Prizren, 2010. View from clock tower.jpg',
    'Our Lady of Ljeviš church, Prizren.jpg',
    'Bogorodica Ljeviska1.jpg',
  ],
  'kisha-e-shen-gjergjit': [
    'Sv. Djordje Prizren.jpg',
    'St. George Cathedral (Saborni hram Svetog Đorđa), Prizren.JPG',
  ],
  'hamami-i-gazi-mehmet-pashes': [
    'Gazi Mehmed Paşa Hamamı - Prizren 01.jpg',
    'Hamami i Gazi Mehmet Pashes, Prizren.jpg',
    'Gazi Mehmed Pasha Hamami.jpg',
    'Gazi Mehmed Pasha Baths - Prizren - Kosovo.jpg',
    '2011 Prizren, Hammam Gaziego Mehmeta Paszy 01.JPG',
  ],
  'ura-e-gurit': [
    'Stone Bridge in Prizren (by Pudelek).JPG',
    'PrizrenStoneBridge.jpg',
    'Stone Bridge Prizren II.jpg',
    'Ura e Gurit, Prizren 01.jpg',
    'Prizren, Kosovo February 2023 - Stone Bridge and Mosque.jpg',
  ],
  'kompleksi-i-marashit': [
    'Rrapi i Marashit.jpg',
    'Rrapi Prizren6.jpg',
    'Rrapi (Platanus orientalis) në Marash, Prizren.jpg',
    'Rrapi Prizren1.jpg',
  ],
  'teqeja-e-halvetive': [
    'Teqja Halveti 01.jpg',
    'Teqja Halveti 02.jpg',
    'Marble Fountain at the Halveti Tekke, Prizren.jpg',
    'Tombs of Halveti Sheikhs at the Halveti Tekke, Prizren.jpg',
    '2011 Prizren, Siedziba tarikatu Halveti 03.JPG',
  ],
  'xhamia-e-emin-pashes': [
    'Xhamia e Emin Pashes.JPG',
    'Minaret of Emit Pasha Mosque - Prizren - Kosovo.jpg',
    'Foundation Inscription of Emin Pasha Mosque, Prizren (1831–32).jpg',
    'Ottoman Gravestones in the Courtyard of Emin Pasha Mosque, Prizren.jpg',
  ],
  'katedralja-e-zojes-ndihmetare': [
    'Konkatedralja DSC04658.JPG',
    'Konkatedrala Zonja Ndihmëtare 2.jpg',
    'Prizren Catholic Cathedral August 2025 front 1.jpg',
    'Prizren Catholic Cathedral August 2025 interior nave 1 landscape.jpg',
    'Prizren, Kosovo 2023-02-05 - Tower and Cathedral.jpg',
  ],
};

async function getJson(url) {
  for (let i = 0; i < 8; i += 1) {
    const res = await fetch(url, { headers: UA });
    const text = await res.text();
    if (res.ok) {
      try { return JSON.parse(text); } catch { /* retry */ }
    }
    console.log(`  retry ${i + 1} (${res.status})`);
    await sleep(8000 * (i + 1));
  }
  throw new Error(`Failed: ${url}`);
}

async function getBuffer(url) {
  for (let i = 0; i < 8; i += 1) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    console.log(`  download retry ${i + 1} (${res.status})`);
    await sleep(8000 * (i + 1));
  }
  throw new Error(`Failed download: ${url}`);
}

const clean = (html = '') =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

async function main() {
  const existing = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, 'utf8')) : {};
  const result = { ...existing };

  for (const [slug, titles] of Object.entries(MANIFEST)) {
    const dir = path.join(UPLOADS, slug === 'site' ? 'site' : path.join('monuments', slug));
    fs.mkdirSync(dir, { recursive: true });
    console.log(`\n== ${slug}`);

    const titlesParam = titles.map((t) => `File:${t}`).join('|');
    const meta = await getJson(
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo' +
        '&iiprop=url|size|mime|extmetadata&iiurlwidth=1600' +
        '&iiextmetadatafilter=Artist|LicenseShortName|LicenseUrl|Credit' +
        `&titles=${encodeURIComponent(titlesParam)}`,
    );
    const byTitle = {};
    for (const p of Object.values(meta.query.pages)) byTitle[p.title.replace(/^File:/, '')] = p;

    const list = [];
    for (let i = 0; i < titles.length; i += 1) {
      const title = titles[i];
      const page = byTitle[title] || byTitle[title.replace(/_/g, ' ')];
      const info = page?.imageinfo?.[0];
      if (!info) { console.log(`  ! not found: ${title}`); continue; }

      const base = `${String(i + 1).padStart(2, '0')}`;
      const f1600 = path.join(dir, `${base}-1600.webp`);
      const f800 = path.join(dir, `${base}-800.webp`);
      const rel = (f) => '/' + path.relative(UPLOADS, f).split(path.sep).join('/');

      if (!fs.existsSync(f1600) || !fs.existsSync(f800)) {
        console.log(`  ↓ ${title}`);
        const buf = await getBuffer(info.thumburl || info.url);
        const img = sharp(buf).rotate();
        const m1600 = await img.clone().resize({ width: 1600, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(f1600);
        await img.clone().resize({ width: 800, height: 900, fit: 'inside', withoutEnlargement: true }).webp({ quality: 72 }).toFile(f800);
        void m1600;
        await sleep(2500);
      } else {
        console.log(`  ✓ cached ${title}`);
      }
      const { width, height } = await sharp(f1600).metadata();
      const em = info.extmetadata || {};
      list.push({
        file: `/uploads${rel(f1600)}`,
        thumb: `/uploads${rel(f800)}`,
        width,
        height,
        commonsTitle: title,
        author: clean(em.Artist?.value) || 'Unknown',
        license: clean(em.LicenseShortName?.value) || 'See source',
        licenseUrl: em.LicenseUrl?.value || null,
        sourceUrl: info.descriptionurl,
      });
    }
    result[slug] = list;
    fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2));
  }
  console.log('\nDone ->', OUT_JSON);
}

main().catch((e) => { console.error(e); process.exit(1); });
