/**
 * Language-neutral data of the seeded monuments.
 * Facts come from the sources listed per monument (Wikipedia/Wikimedia, the Kosovo
 * heritage database, regional heritage plans, UNESCO). Coordinates come from
 * Wikipedia / OpenStreetMap. Where sources disagree the texts say so explicitly.
 */
const WIKI = 'https://en.wikipedia.org/wiki';
const WIKI_SQ = 'https://sq.wikipedia.org/wiki';

export const monumentsBase = [
  {
    slug: 'kalaja-e-prizrenit',
    category: 'fortress',
    archetype: 'fortress',
    lat: 42.209444, lng: 20.745556,
    yearStart: null, yearEnd: null,
    heritageReference: 'Monument of Culture of Exceptional Importance (1948)',
    sources: [
      { label: 'Wikipedia (EN) - Prizren Fortress', url: `${WIKI}/Prizren_Fortress` },
      { label: 'Wikipedia (SQ) - Kalaja e Prizrenit', url: `${WIKI_SQ}/Kalaja_e_Prizrenit` },
    ],
  },
  {
    slug: 'xhamia-e-sinan-pashes',
    category: 'mosque',
    archetype: 'mosque',
    lat: 42.209030, lng: 20.741379,
    yearStart: 1615, yearEnd: null,
    heritageReference: 'Kosovo cultural heritage no. 1599/48; Monument of Culture of Exceptional Importance (1990)',
    sources: [
      { label: 'Wikipedia (EN) - Sinan Pasha Mosque (Prizren)', url: `${WIKI}/Sinan_Pasha_Mosque_(Prizren)` },
      { label: 'Wikipedia (SQ) - Xhamia e Sinan Pashës', url: `${WIKI_SQ}/Xhamia_e_Sinan_Pash%C3%ABs,_Prizren` },
    ],
  },
  {
    slug: 'lidhja-shqiptare-e-prizrenit',
    category: 'museum',
    archetype: 'museum',
    lat: 42.211481, lng: 20.743565,
    yearStart: 1878, yearEnd: null,
    heritageReference: 'Kosovo cultural heritage no. 414/77',
    sources: [
      { label: 'Wikipedia (EN) - League of Prizren', url: `${WIKI}/League_of_Prizren` },
      { label: 'Wikipedia (SQ) - Kompleksi i Lidhjes së Prizrenit', url: `${WIKI_SQ}/Kompleksi_i_Lidhjes_s%C3%AB_Prizrenit` },
    ],
  },
  {
    slug: 'kisha-e-shen-premtes',
    category: 'church',
    archetype: 'church',
    lat: 42.211389, lng: 20.735833,
    yearStart: 1306, yearEnd: 1307,
    heritageReference: 'UNESCO World Heritage Site "Medieval Monuments in Kosovo" (since 2006)',
    sources: [
      { label: 'Wikipedia (EN) - Our Lady of Ljeviš', url: `${WIKI}/Our_Lady_of_Ljevi%C5%A1` },
      { label: 'UNESCO - Medieval Monuments in Kosovo', url: 'https://whc.unesco.org/en/list/724' },
    ],
  },
  {
    slug: 'kisha-e-shen-gjergjit',
    category: 'cathedral',
    archetype: 'church',
    lat: 42.2082, lng: 20.74038,
    yearStart: 1856, yearEnd: 1887,
    heritageReference: null,
    sources: [
      { label: 'Wikipedia (EN) - Saint George Cathedral, Prizren', url: `${WIKI}/Saint_George_Cathedral,_Prizren` },
      { label: 'Spomenici kulture u Srbiji (SANU)', url: 'http://spomenicikulture.mi.sanu.ac.rs/spomenik.php?id=1377' },
    ],
  },
  {
    slug: 'hamami-i-gazi-mehmet-pashes',
    category: 'hamam',
    archetype: 'hamam',
    lat: 42.210941, lng: 20.741477,
    yearStart: null, yearEnd: null,
    heritageReference: 'Cultural heritage monument of Kosovo (architectural category)',
    sources: [
      { label: 'Wikipedia (SQ) - Hamami i Prizrenit', url: `${WIKI_SQ}/Hamami_i_Prizrenit` },
      { label: 'Regional Heritage Plan - South Kosovo (ECMI/CHwB)', url: 'https://ecmandryshe.org/repository/docs/Heritage-plan-south0515.pdf' },
    ],
  },
  {
    slug: 'ura-e-gurit',
    category: 'bridge',
    archetype: 'bridge',
    lat: 42.209567, lng: 20.740599,
    yearStart: null, yearEnd: 1982,
    heritageReference: 'Protected by Decision no. 2345 of 31 December 1948',
    sources: [
      { label: 'Wikipedia (EN) - Old Stone Bridge, Prizren', url: `${WIKI}/Old_Stone_Bridge,_Prizren` },
    ],
  },
  {
    slug: 'kompleksi-i-marashit',
    category: 'complex',
    archetype: 'complex',
    lat: 42.212035, lng: 20.745553,
    yearStart: null, yearEnd: null,
    heritageReference: 'Kosovo cultural heritage no. 502/68',
    sources: [
      { label: 'Wikipedia (SQ) - Kompleksi i Mahallës së Marashit', url: `${WIKI_SQ}/Kompleksi_i_Mah%C3%ABll%C3%ABs_s%C3%AB_Marashit` },
      { label: 'Wikipedia (EN) - Marash Maple', url: `${WIKI}/Marash_Maple` },
    ],
  },
  {
    slug: 'teqeja-e-halvetive',
    category: 'tekke',
    archetype: 'tekke',
    lat: 42.210040, lng: 20.740370,
    yearStart: 1835, yearEnd: null,
    heritageReference: 'Kosovo cultural heritage no. 1101/55',
    sources: [
      { label: 'Kosovo Cultural Heritage Database - Teqja e Halvetive', url: 'https://dtk.rks-gov.net/Objekti?heritageId=1469' },
      { label: 'Wikipedia (EN) - Halveti Teqe (Prizren)', url: `${WIKI}/Halveti_Teqe_(Prizren)` },
    ],
  },
  {
    slug: 'xhamia-e-emin-pashes',
    category: 'mosque',
    archetype: 'mosque',
    lat: 42.211286, lng: 20.741317,
    yearStart: 1831, yearEnd: 1832,
    heritageReference: 'Kosovo cultural heritage no. 371/87',
    sources: [
      { label: 'Kosovo Cultural Heritage Database - Xhamia e Emin Pashës', url: 'https://dtk.rks-gov.net/Objekti?heritageId=1316' },
      { label: 'Wikipedia (SQ) - Xhamia e Emin Pashës', url: `${WIKI_SQ}/Xhamia_e_Emin_Pash%C3%ABs` },
    ],
  },
  {
    slug: 'katedralja-e-zojes-ndihmetare',
    category: 'cathedral',
    archetype: 'cathedral',
    lat: 42.207765, lng: 20.738407,
    yearStart: 1870, yearEnd: null,
    heritageReference: null,
    sources: [
      { label: 'Wikipedia (EN) - Cathedral of Our Lady of Perpetual Succour (Prizren)', url: `${WIKI}/Cathedral_of_Our_Lady_of_Perpetual_Succour_(Prizren)` },
    ],
  },
];
