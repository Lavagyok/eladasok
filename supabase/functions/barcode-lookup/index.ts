import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const barcode = url.searchParams.get("barcode");

    if (!barcode) {
      return new Response(JSON.stringify({ error: "barcode parameter required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check cache first — avoids hitting rate-limited external APIs
    const { data: cached } = await supabase
      .from("barcode_cache")
      .select("name, brand, description, category, image_url")
      .eq("barcode", barcode)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({
        name: cached.name,
        brand: cached.brand ?? undefined,
        description: cached.description ?? undefined,
        category: cached.category ?? undefined,
        imageUrl: cached.image_url ?? undefined,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPCitemdb — best coverage for consumer goods, electronics, accessories
    let result: { name: string; brand: string | null; description: string | null; category: string | null; image_url: string | null; source: string } | null = null;

    try {
      const res = await fetch(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.items?.length > 0 && data.items[0].title) {
          const item = data.items[0];
          result = {
            name: item.title,
            brand: item.brand || null,
            description: item.description || null,
            category: item.category || null,
            image_url: item.images?.[0] || null,
            source: "upcitemdb",
          };
        }
      }
    } catch { /* fall through */ }

    // barcode.monster — free, broad product coverage
    if (!result) {
      try {
        const res = await fetch(
          `https://barcode.monster/api/${encodeURIComponent(barcode)}`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.product_name) {
            result = {
              name: data.product_name,
              brand: data.manufacturer || null,
              description: data.description || null,
              category: data.category || null,
              image_url: null,
              source: "barcode_monster",
            };
          }
        }
      } catch { /* fall through */ }
    }

    // Open Food Facts — food/grocery only; skip Japanese manufacturer prefix (49 = electronics)
    if (!result && !/^49/.test(barcode)) {
      try {
        const res = await fetch(
          `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
          { signal: AbortSignal.timeout(6000) }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === 1 && data.product?.product_name) {
            const p = data.product;
            result = {
              name: p.product_name,
              brand: p.brands?.split(",")[0]?.trim() || null,
              description: p.generic_name || null,
              category: p.categories_tags?.[0]?.replace(/^[a-z]{2}:/, "") || p.categories?.split(",")[0]?.trim() || null,
              image_url: null,
              source: "openfoodfacts",
            };
          }
        }
      } catch { /* all APIs exhausted */ }
    }

    if (!result) {
      return new Response(JSON.stringify(null), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist to cache so this barcode never hits the APIs again
    await supabase.from("barcode_cache").upsert({ barcode, ...result });

    return new Response(JSON.stringify({
      name: result.name,
      brand: result.brand ?? undefined,
      description: result.description ?? undefined,
      category: result.category ?? undefined,
      imageUrl: result.image_url ?? undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
