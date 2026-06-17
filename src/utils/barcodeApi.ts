export interface BarcodeProduct {
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  // UPCitemdb — good for consumer goods, electronics, accessories
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.items?.length > 0) {
        const item = data.items[0];
        if (item.title) {
          return {
            name: item.title,
            brand: item.brand || undefined,
            description: item.description || undefined,
            category: item.category || undefined,
            imageUrl: item.images?.[0] || undefined,
          };
        }
      }
    }
  } catch {
    // fall through
  }

  // barcode.monster — free, no key, broad product coverage
  try {
    const res = await fetch(
      `https://barcode.monster/api/${encodeURIComponent(barcode)}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.product_name) {
        return {
          name: data.product_name,
          brand: data.manufacturer || undefined,
          description: data.description || undefined,
          category: data.category || undefined,
        };
      }
    }
  } catch {
    // fall through
  }

  // Open Food Facts — food/grocery only; skip for barcodes that clearly aren't food
  // (prefix 49 = Japan electronics/general goods manufacturer range)
  const japaneseMfr = /^49/.test(barcode);
  if (!japaneseMfr) {
    try {
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.status === 1 && data.product?.product_name) {
          const p = data.product;
          const brand = p.brands?.split(',')[0]?.trim();
          const cat =
            p.categories_tags?.[0]?.replace(/^[a-z]{2}:/, '') ||
            p.categories?.split(',')[0]?.trim();
          return {
            name: p.product_name,
            brand: brand || undefined,
            description: p.generic_name || undefined,
            category: cat || undefined,
          };
        }
      }
    } catch {
      // all APIs failed
    }
  }

  return null;
}
