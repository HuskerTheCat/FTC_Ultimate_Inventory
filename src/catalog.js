// The supplier part catalog (catalog.json, built by .github/scripts/build-catalog.mjs from the suppliers' stores).
// It's large, so it loads separately, starting when the app opens so lookups still work if the connection drops later.

// Codes are compared without case, spaces or dashes, so a part number matches however a label prints it,
// and numbers without leading zeros, since a UPC reads as 12 digits or as 13 with a leading 0.
export const codeKey = (code) => {
  const key = code.toLowerCase().replace(/[^a-z0-9]/g, '');
  return /^\d+$/.test(key) ? key.replace(/^0+/, '') : key;
};

function index(catalog) {
  const byCode = new Map();
  const all = [];
  for (const [supplier, parts] of Object.entries(catalog)) {
    for (const [partNumber, upc, name, category, link] of parts) {
      const product = { supplier, partNumber, name, category, link };
      all.push({ product, text: `${name} ${partNumber} ${supplier}`.toLowerCase() });
      for (const code of [upc, partNumber].filter(Boolean)) {
        if (!byCode.has(codeKey(code))) byCode.set(codeKey(code), product);
      }
    }
  }
  return { byCode, all };
}

// Browsers don't fetch a module again after it failed, so a failed load needs the app reloaded.
const products = import('./catalog.json').then(({ default: catalog }) => index(catalog));
products.catch(() => {}); // reported below, when a lookup needs the catalog

function loaded() {
  return products.catch((error) => {
    console.error(error);
    throw new Error('Couldn’t load the part catalog. Reload the app while online, then try again.');
  });
}

// The supplier's part for a package barcode (its UPC, or a printed part number), or null if the catalog doesn't have it.
export async function findProduct(code) {
  const { byCode } = await loaded();
  return byCode.get(codeKey(code)) ?? null;
}

// The suppliers the catalog has parts from.
export async function catalogSuppliers() {
  const { all } = await loaded();
  return [...new Set(all.map(({ product }) => product.supplier))];
}

// Catalog parts with every word of the search in their name, part number or supplier, so "u-beam 8mm" finds
// "1101 Series U-Beam (1 Hole, 8mm Length)". Only one supplier's parts when a supplier is given.
// Parts whose words start with the searched words come first, then shorter names.
export async function searchCatalog(query, supplier, limit) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const { all } = await loaded();
  return all.filter(({ product, text }) => (!supplier || product.supplier === supplier) && words.every((word) => text.includes(word)))
    .map(({ product, text }) => ({ product, starts: words.filter((word) => wordStarts(text).includes(` ${wordStarts(word).trim()}`)).length }))
    .sort((a, b) => b.starts - a.starts || a.product.name.length - b.product.name.length)
    .slice(0, limit)
    .map(({ product }) => product);
}

// Text with punctuation as spaces and a leading space, so " beam" finds a word starting with "beam".
const wordStarts = (text) => ` ${text.replace(/[^a-z0-9]/g, ' ')}`;
