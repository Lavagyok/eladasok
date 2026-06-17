/*
# Create barcode_cache table

## Purpose
Persistent cross-browser cache for barcode API lookups.
Every barcode that is successfully identified via an external API is stored here.
Subsequent lookups hit the cache instantly without touching any external API.

## New Tables
- `barcode_cache`
  - `barcode` (text, primary key) — the EAN/UPC barcode string
  - `name` (text, not null) — product name
  - `brand` (text, nullable) — brand/manufacturer
  - `description` (text, nullable) — product description or generic name
  - `category` (text, nullable) — product category
  - `image_url` (text, nullable) — product image URL
  - `source` (text, not null, default 'manual') — which API or method provided the data
  - `created_at` (timestamptz) — when this entry was cached

## Security
- RLS enabled; anon + authenticated users can SELECT (read cache).
- INSERT/UPDATE/DELETE is performed only by the edge function via the service role key (bypasses RLS).

## Seeded Data
- Canon PG-545 XL Black ink cartridge (EAN 4960999974491) pre-seeded to fix the
  Open Food Facts crowdsourced misidentification as "Chicken Nuggets 6er / MacDonalds".
*/

CREATE TABLE IF NOT EXISTS barcode_cache (
  barcode text PRIMARY KEY,
  name text NOT NULL,
  brand text,
  description text,
  category text,
  image_url text,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE barcode_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_barcode_cache" ON barcode_cache;
CREATE POLICY "anon_select_barcode_cache" ON barcode_cache FOR SELECT
TO anon, authenticated USING (true);

-- Seed known product to fix the misidentification
INSERT INTO barcode_cache (barcode, name, brand, category, source)
VALUES ('4960999974491', 'CANON PG-545 XL INK CARTRIDGE BLACK', 'Canon', 'Ink Cartridges', 'seeded')
ON CONFLICT (barcode) DO NOTHING;
