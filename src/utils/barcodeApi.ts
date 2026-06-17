export interface BarcodeProduct {
  name: string;
  brand?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/barcode-lookup?barcode=${encodeURIComponent(barcode)}`,
      {
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || !data.name) return null;

    return {
      name: data.name,
      brand: data.brand || undefined,
      description: data.description || undefined,
      category: data.category || undefined,
      imageUrl: data.imageUrl || undefined,
    };
  } catch {
    return null;
  }
}
