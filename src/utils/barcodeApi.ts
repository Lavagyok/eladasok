import { getCustomBarcode } from './customBarcodes';

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
  '4977766735940': { name: 'Brother LC227XLBK Ink Cartridge Black XL', brand: 'Brother', category: 'Ink Cartridges' },
};

const LS_CACHE_KEY = 'barcode_lookup_cache';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

function readCache(barcode: string): BarcodeProduct | null {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as Record<string, { p: BarcodeProduct; t: number }>;
    const entry = cache[barcode];
    if (!entry || Date.now() - entry.t > TTL_MS) return null;
    return entry.p;
  } catch {
    return null;
  }
}

export function cacheProduct(barcode: string, product: BarcodeProduct): void {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    const cache: Record<string, { p: BarcodeProduct; t: number }> = raw ? JSON.parse(raw) : {};
    cache[barcode] = { p: product, t: Date.now() };
    const keys = Object.keys(cache);
    if (keys.length > 500) {
      const oldest = keys.sort((a, b) => cache[a].t - cache[b].t)[0];
      delete cache[oldest];
    }
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore quota errors */ }
}

async function lookupWithGemini(barcode: string): Promise<BarcodeProduct | null> {
  if (!GEMINI_API_KEY) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a product database. A user scanned a barcode and needs to know what product it is.

Barcode: ${barcode}

Respond with ONLY a JSON object (no markdown, no code blocks, no explanation):
{"name": "full product name", "brand": "brand name", "category": "product category"}

If you genuinely cannot identify this specific barcode, respond with exactly: {}`
            }]
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 150,
          },
        }),
        signal: AbortSignal.timeout(12000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text.trim());
    if (!parsed?.name) return null;
    return {
      name: parsed.name,
      brand: parsed.brand || undefined,
      category: parsed.category || undefined,
    };
  } catch {
    return null;
  }
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  // 1. Hardcoded — always correct for known problem barcodes
  if (KNOWN_PRODUCTS[barcode]) return KNOWN_PRODUCTS[barcode];

  // 2. Personal barcode library — saved from previous manual scans
  const custom = getCustomBarcode(barcode);
  if (custom) return custom;

  // 3. localStorage API cache — instant after first successful lookup
  const cached = readCache(barcode);
  if (cached) return cached;

  // 4. UPCitemdb trial — 100 lookups/day, good for electronics & consumer goods
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
        cacheProduct(barcode, product);
        return product;
      }
    }
  } catch { /* fall through */ }

  // 5. barcode.monster — free, broad coverage
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
        cacheProduct(barcode, product);
        return product;
      }
    }
  } catch { /* fall through */ }

  // 6–8. Open* project APIs — unlimited, crowdsourced (food / general / beauty)
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
          cacheProduct(barcode, product);
          return product;
        }
      }
    } catch { /* try next */ }
  }

  // 9. Gemini AI — last resort for specialty products not in any public database
  const geminiResult = await lookupWithGemini(barcode);
  if (geminiResult) {
    cacheProduct(barcode, geminiResult);
    return geminiResult;
  }

  return null;
}
