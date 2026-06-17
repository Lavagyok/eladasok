export interface BarcodeProduct {
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
}

// Barcodes known to be missing from or misidentified by free APIs
const KNOWN_PRODUCTS: Record<string, BarcodeProduct> = {
  '4960999974491': { name: 'Canon PG-545 XL Ink Cartridge Black', brand: 'Canon', category: 'Ink Cartridges' },
};

const LS_KEY = 'barcode_lookup_cache';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function readCache(barcode: string): BarcodeProduct | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as Record<string, { p: BarcodeProduct; t: number }>;
    const entry = cache[barcode];
    if (!entry || Date.now() - entry.t > TTL_MS) return null;
    return entry.p;
  } catch {
    return null;
  }
}

function writeCache(barcode: string, product: BarcodeProduct): void {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const cache: Record<string, { p: BarcodeProduct; t: number }> = raw ? JSON.parse(raw) : {};
    cache[barcode] = { p: product, t: Date.now() };
    // Evict oldest entries when over 500
    const keys = Object.keys(cache);
    if (keys.length > 500) {
      const oldest = keys.sort((a, b) => cache[a].t - cache[b].t)[0];
      delete cache[oldest];
    }
    localStorage.setItem(LS_KEY, JSON.stringify(cache));
  } catch { /* ignore quota errors */ }
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  // 1. Hardcoded fallback for known barcodes
  if (KNOWN_PRODUCTS[barcode]) return KNOWN_PRODUCTS[barcode];

  // 2. localStorage cache (persists per browser after first successful lookup)
  const cached = readCache(barcode);
  if (cached) return cached;

  // 3. UPCitemdb — best for consumer goods, electronics, accessories
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.items?.length > 0 && data.items[0].title) {
        const item = data.items[0];
        const product: BarcodeProduct = {
          name: item.title,
          brand: item.brand || undefined,
          description: item.description || undefined,
          category: item.category || undefined,
          imageUrl: item.images?.[0] || undefined,
        };
        writeCache(barcode, product);
        return product;
      }
    }
  } catch { /* fall through */ }

  // 4. barcode.monster — free, broad product coverage
  try {
    const res = await fetch(
      `https://barcode.monster/api/${encodeURIComponent(barcode)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.product_name) {
        const product: BarcodeProduct = {
          name: data.product_name,
          brand: data.manufacturer || undefined,
          description: data.description || undefined,
          category: data.category || undefined,
        };
        writeCache(barcode, product);
        return product;
      }
    }
  } catch { /* fall through */ }

  // 5–7. Open* project APIs — unlimited, crowdsourced, cover food / general / beauty
  const openApis = [
    'https://world.openfoodfacts.org',
    'https://world.openproductsfacts.org',
    'https://world.openbeautyfacts.org',
  ];

  for (const base of openApis) {
    try {
      const res = await fetch(
        `${base}/api/v0/product/${encodeURIComponent(barcode)}.json`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 1 && data.product?.product_name) {
          const p = data.product;
          const product: BarcodeProduct = {
            name: p.product_name,
            brand: p.brands?.split(',')[0]?.trim() || undefined,
            description: p.generic_name || undefined,
            category:
              p.categories_tags?.[0]?.replace(/^[a-z]{2}:/, '') ||
              p.categories?.split(',')[0]?.trim() ||
              undefined,
          };
          writeCache(barcode, product);
          return product;
        }
      }
    } catch { /* try next */ }
  }

  return null;
}
