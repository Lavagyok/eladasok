export interface BarcodeProduct {
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  // Try UPCitemdb (good for electronics, accessories, consumer goods)
  try {
    const res = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
      { signal: AbortSignal.timeout(5000) }
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
    // fall through to next
  }

  // Try Open Food Facts as fallback (food, grocery, household)
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.status === 1 && data.product?.product_name) {
        const p = data.product;
        const brand = p.brands?.split(',')[0]?.trim();
        const cat = p.categories_tags?.[0]?.replace(/^[a-z]{2}:/, '') || p.categories?.split(',')[0]?.trim();
        return {
          name: p.product_name,
          brand: brand || undefined,
          description: p.generic_name || undefined,
          category: cat || undefined,
        };
      }
    }
  } catch {
    // both APIs failed
  }

  return null;
}
