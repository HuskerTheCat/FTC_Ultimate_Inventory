// Builds src/catalog.json, the supplier part catalog the in-app scanner looks package barcodes up in.
// It reads the product data each supplier publishes on its own store, so the app needs no server:
// the catalog ships inside the app and works offline. Run by the "Update part catalog" workflow.
import { writeFileSync } from 'node:fs';

const OUT = new URL('../../src/catalog.json', import.meta.url);
const USER_AGENT = 'FTC-Ultimate-Inventory catalog builder (+https://github.com/HuskerTheCat/FTC_Ultimate_Inventory)';
const PARALLEL = 4;
// A supplier with fewer parts than this means its store changed and this script needs updating.
const MIN_PARTS = 50;

// Each supplier's parts as { partNumber, upc, name, category, url }. Earlier suppliers win when two list the same part number,
// so goBILDA's own listing beats ServoCity's copy of it.
const SUPPLIERS = {
  goBILDA: () => bigCommerce('https://www.gobilda.com'),
  'REV Robotics': () => bigCommerce('https://www.revrobotics.com', { variants: true }),
  AndyMark: () => shopify('https://andymark.com'),
  ServoCity: () => bigCommerce('https://www.servocity.com'),
  TETRIX: () => shopify('https://www.pitsco.com', (product) => product.vendor.startsWith('TETRIX')),
  'Studica Robotics': () => nopCommerce('https://www.studica.com', 'studica-robotics-2'),
};

// First match wins, tried on the part's name and then on the supplier's own category.
const CATEGORIES = [
  ['Kits', /\b(kits?|bundles?)\b/i],
  ['Tools', /\b(tools?|wrench|screwdriver|hex keys?|allen|pliers|crimpers?|drivers? bits?|bit set|taps?|drills?)\b/i],
  ['Electronics/Sensors', /\blimit switch(es)?\b/i],
  ['Hardware/Structure', /\b(motor|servo|battery|sensor|camera)[- ](mounts?|brackets?|plates?|blocks?)\b|servoblock/i],
  ['Electronics/Power', /\b(batter(y|ies)|chargers?|switch|fuses?|breakers?|power distribution|power module|regulators?)\b/i],
  ['Electronics/Wires', /\b(cables?|wires?|wiring|connectors?|jst|xt30|anderson|extensions?|harness)\b/i],
  ['Electronics/Controllers', /\b(control hub|expansion hub|driver hub|servo hub|motor controllers?|controllers?|spark ?mini)\b/i],
  ['Electronics/Motors', /\b(motors?|gearmotors?)\b/i],
  ['Electronics/Servos', /\bservos?\b/i],
  ['Electronics/Sensors', /\b(sensors?|encoders?|potentiometer|odometry|imu|cameras?|gyro)\b/i],
  ['Hardware/Linear motion', /\b(lead screws?|slides?|v-guides?|linear)\b/i],
  ['Hardware/Wheels', /\b(wheels?|tires?|omni|mecanum|casters?)\b/i],
  ['Hardware/Belts and chain', /\b(belts?|pulleys?|chains?|sprockets?)\b/i],
  ['Hardware/Gears', /\b(gears?|gearbox(es)?|pinions?|racks?)\b/i],
  ['Hardware/Bearings', /\b(bearings?|bushings?|pillow blocks?)\b/i],
  ['Hardware/Collars and hubs', /\bcollars?\b/i],
  ['Hardware/Shafts', /\b(shafts?|shafting|axles?|hub-shafts?|couplers?)\b/i],
  ['Hardware/Collars and hubs', /\bhubs?\b/i],
  ['Hardware/Spacers', /\b(spacers?|standoffs?)\b/i],
  ['Hardware/Screws', /\b(screws?|bolts?|rivets?)\b/i],
  ['Hardware/Nuts', /\bnuts?\b/i],
  ['Hardware/Washers', /\bwashers?\b/i],
  ['Hardware/Structure', /\b(channels?|beams?|extrusions?|plates?|brackets?|mounts?|tub(e|es|ing)|gotube|maxtube|pattern|(go|x-)?rails?|flats|angles|linkages?|grid-track)\b/i],
];

const categoryOf = (name, supplierCategory) =>
  (CATEGORIES.find(([, pattern]) => pattern.test(name)) ?? CATEGORIES.find(([, pattern]) => pattern.test(supplierCategory)))?.[0] ?? '';

const ENTITIES = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', deg: '°', trade: '', reg: '' };
const cleanName = (text) => text
  .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => (code[0] === '#' ? String.fromCodePoint(Number(code.slice(1).replace(/^x/i, '0x'))) : ENTITIES[code.toLowerCase()] ?? entity))
  .replace(/[®™]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 200); // the security rules' limit for a part name

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Returns null for a page that no longer exists. Retries other failures (error pages, dropped connections) a few times,
// then gives up on the whole run.
async function fetchText(url, options = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers: { 'user-agent': USER_AGENT, ...options.headers } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status} from ${url}`);
      return await res.text();
    } catch (error) {
      if (attempt === 3) throw error;
      await sleep(10000 * attempt);
    }
  }
}

// Runs fn over items, a few at a time, so the stores aren't hammered.
async function inParallel(items, fn) {
  const results = [];
  let next = 0;
  await Promise.all(Array.from({ length: PARALLEL }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }));
  return results;
}

// ---------- BigCommerce stores (goBILDA, REV, ServoCity) ----------

// Every product page lists its SKU and UPC in the page's BCData. Family pages (one page, many parts) have no SKU of
// their own; with `variants`, each choice on them is looked up the way the store's own page does when one is picked.
// Each part links to the page it's listed on, so a family page's parts share its link.
async function bigCommerce(site, { variants = false } = {}) {
  const urls = [];
  for (let page = 1; ; page++) {
    const sitemap = await fetchText(`${site}/xmlsitemap.php?type=products&page=${page}`) ?? '';
    const found = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    if (!found.length) break;
    urls.push(...found);
  }
  console.log(`${site}: ${urls.length} product pages`);
  const pages = await inParallel(urls, async (url) => {
    const html = await fetchText(url);
    return html && readBigCommercePage(site, url, html, variants);
  });
  return pages.flat().filter(Boolean);
}

async function readBigCommercePage(site, url, html, variants) {
  // Some listed products now redirect to a category or other page instead.
  const bcData = html.match(/var BCData = (\{.*?\});\s*<\/script>/s);
  const attributes = bcData && JSON.parse(bcData[1]).product_attributes;
  const title = html.match(/<h1 class="productView-title"[^>]*>([\s\S]*?)<\/h1>/);
  if (!attributes || !title) return null;
  const { sku, upc } = attributes;
  const name = cleanName(title[1]);
  const supplierCategory = [...(html.match(/\\"category\\":\[(.*?)\]/)?.[1] ?? '').matchAll(/\\"(.*?)\\"/g)].map((m) => m[1]).join(' ');
  const part = (partNumber, code, partName) => ({ partNumber, upc: code ?? '', name: partName, category: categoryOf(partName, supplierCategory), url });
  if (sku && !/^(rd-|parent_)/.test(sku)) return part(sku, upc, name);
  if (!variants) return null;

  const productId = html.match(/name="product_id" value="(\d+)"/)[1];
  const choices = [...html.matchAll(/name="attribute\[(\d+)\]"[^>]*value="(\d+)"/g)].map((m) => ({ option: m[1], value: m[2] }));
  // Pages with more than one choice to make would need every combination; they're rare enough to leave out.
  if (new Set(choices.map((c) => c.option)).size !== 1) return null;
  return Promise.all(choices.map(async ({ option, value }) => {
    const body = new URLSearchParams({ action: 'add', product_id: productId, [`attribute[${option}]`]: value });
    const response = await fetchText(`${site}/remote/v1/product-attributes/${productId}`, {
      method: 'POST', body, headers: { 'x-requested-with': 'XMLHttpRequest', 'content-type': 'application/x-www-form-urlencoded' },
    });
    if (!response) return null;
    const { data } = JSON.parse(response);
    // The choice's label, such as "15 Tooth Metal #25 Sprocket (REV-41-1717)", without the part number.
    const label = html.match(new RegExp(`data-product-attribute-value="${value}"[^>]*>\\s*(?:<[^>]*>\\s*)*([^<>]*[^<>\\s])`))?.[1]
      .replace(` (${data.sku})`, '');
    return data.sku && part(data.sku, data.upc, cleanName(label ? `${name} (${label})` : name));
  }));
}

// ---------- Shopify stores (AndyMark, Pitsco) ----------

// The public product list has every part number, but no barcodes (none of these stores fill them in).
async function shopify(site, include = () => true) {
  const products = [];
  for (let page = 1; ; page++) {
    const { products: found } = JSON.parse(await fetchText(`${site}/products.json?limit=250&page=${page}`));
    if (!found.length) break;
    products.push(...found.filter(include));
  }
  console.log(`${site}: ${products.length} products`);
  return products.flatMap((product) => product.variants.filter((v) => v.sku).map((variant) => {
    const name = cleanName(variant.title === 'Default Title' ? product.title : `${product.title} (${variant.title})`);
    const url = `${site}/products/${product.handle}${variant.title === 'Default Title' ? '' : `?variant=${variant.id}`}`;
    return { partNumber: variant.sku.trim(), upc: '', name, category: categoryOf(name, `${product.product_type} ${product.tags.join(' ')}`), url };
  }));
}

// ---------- nopCommerce stores (Studica) ----------

// The brand's listing pages link to every part (the store also sells other brands and software), and each part's page
// has its SKU and UPC in its schema.org product data.
async function nopCommerce(site, listing) {
  const urls = [];
  for (let page = 1; ; page++) {
    const html = await fetchText(`${site}/${listing}?pagesize=48&pagenumber=${page}`);
    const found = [...html.matchAll(/<h2 class="product-title">\s*<a href="([^"]+)"/g)].map((m) => `${site}${m[1]}`);
    // Past the last page the store shows no parts, or the last page again.
    const fresh = found.filter((url) => !urls.includes(url));
    if (!fresh.length) break;
    urls.push(...fresh);
  }
  console.log(`${site}: ${urls.length} product pages`);
  const parts = await inParallel(urls, async (url) => {
    const html = await fetchText(url);
    if (!html) return null;
    // Descriptions can hold raw line breaks, which JSON doesn't allow inside strings.
    const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => JSON.parse(m[1].replace(/[\u0000-\u001f]+/g, ' ')));
    const product = data.find((d) => d['@type'] === 'Product');
    if (!product?.sku) return null;
    const name = cleanName(product.name);
    const supplierCategory = data.find((d) => d['@type'] === 'BreadcrumbList').itemListElement.map((i) => i.item.name).join(' ');
    return { partNumber: product.sku.trim(), upc: product.gtin12 ?? product.gtin13 ?? '', name, category: categoryOf(name, supplierCategory), url };
  });
  return parts.filter(Boolean);
}

// ---------- catalog ----------

const bySupplier = {};
const seen = new Set();
for (const [supplier, read] of Object.entries(SUPPLIERS)) {
  const parts = [];
  for (const part of await read()) {
    if (seen.has(part.partNumber.toLowerCase())) continue;
    seen.add(part.partNumber.toLowerCase());
    parts.push(part);
  }
  if (parts.length < MIN_PARTS) throw new Error(`Only ${parts.length} parts from ${supplier}`);
  bySupplier[supplier] = parts;
}

// A UPC listed on more than one part can't tell them apart, so scanning it is treated as an unknown barcode instead.
const upcKey = (upc) => upc.replace(/\D/g, '').replace(/^0+/, '');
const upcCounts = new Map();
for (const part of Object.values(bySupplier).flat().filter((p) => p.upc)) upcCounts.set(upcKey(part.upc), (upcCounts.get(upcKey(part.upc)) ?? 0) + 1);

const catalog = {};
for (const [supplier, parts] of Object.entries(bySupplier)) {
  for (const part of parts) if (upcCounts.get(upcKey(part.upc)) > 1) part.upc = '';
  parts.sort((a, b) => a.partNumber.localeCompare(b.partNumber));
  catalog[supplier] = parts.map((p) => [p.partNumber, p.upc, p.name, p.category, p.url]);
  console.log(`${supplier}: ${parts.length} parts, ${parts.filter((p) => p.upc).length} with UPCs, ${parts.filter((p) => p.category).length} with categories`);
}

// One part per line, so updates show up as readable diffs.
const lines = Object.entries(catalog).map(([supplier, parts]) =>
  `${JSON.stringify(supplier)}: [\n${parts.map((p) => `  ${JSON.stringify(p)}`).join(',\n')}\n]`);
writeFileSync(OUT, `{\n${lines.join(',\n')}\n}\n`);
