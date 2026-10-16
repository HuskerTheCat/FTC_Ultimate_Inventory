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
  for (const [supplier, parts] of Object.entries(catalog)) {
    for (const [partNumber, upc, name, category, link] of parts) {
      const product = { supplier, partNumber, name, category, link };
      for (const code of [upc, partNumber].filter(Boolean)) {
        if (!byCode.has(codeKey(code))) byCode.set(codeKey(code), product);
      }
    }
  }
  return byCode;
}

// Browsers don't fetch a module again after it failed, so a failed load needs the app reloaded.
const products = import('./catalog.json').then(({ default: catalog }) => index(catalog));
products.catch(() => {}); // reported below, when a lookup needs the catalog

// The supplier's part for a package barcode (its UPC, or a printed part number), or null if the catalog doesn't have it.
export async function findProduct(code) {
  const byCode = await products.catch((error) => {
    console.error(error);
    throw new Error('Couldn’t load the part catalog. Reload the app while online, then try again.');
  });
  return byCode.get(codeKey(code)) ?? null;
}
