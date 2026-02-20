-- Bible Variants & Expanded P&L
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/oesqdjfrbzpgkagwyhwm/sql/new

-- 1. Bible Product Variants (SKU-level COGS)
CREATE TABLE IF NOT EXISTS public.bible_product_variants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bible_product_id uuid NOT NULL REFERENCES public.bible_products(id) ON DELETE CASCADE,
  sku_id text,
  sku_name text NOT NULL,
  cogs numeric(10,2) DEFAULT 0,
  seller_sku text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bible_variants_product ON public.bible_product_variants(bible_product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bible_variants_sku ON public.bible_product_variants(bible_product_id, sku_id);

-- 2. Variant-level daily units tracking
CREATE TABLE IF NOT EXISTS public.bible_variant_daily_units (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.bible_daily_entries(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES public.bible_product_variants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.bible_products(id) ON DELETE CASCADE,
  date date NOT NULL,
  platform text NOT NULL DEFAULT 'tiktok_shop',
  units_sold integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bible_variant_units ON public.bible_variant_daily_units(entry_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_bible_variant_units_date ON public.bible_variant_daily_units(user_id, date, platform);

-- 3. Add shipping_fee column to bible_daily_entries (extracted from order data)
DO $$ BEGIN
  ALTER TABLE public.bible_daily_entries ADD COLUMN shipping_fee numeric(10,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 4. Add pick_pack_rate to bible_products (per-unit pick & pack cost)
DO $$ BEGIN
  ALTER TABLE public.bible_products ADD COLUMN pick_pack_rate numeric(10,2) DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 5. RLS Policies
ALTER TABLE public.bible_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_variant_daily_units ENABLE ROW LEVEL SECURITY;

-- Variants inherit access from parent bible_product (via join)
DO $$ BEGIN
  CREATE POLICY "Users manage own bible_product_variants" ON public.bible_product_variants
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM public.bible_products bp
        WHERE bp.id = bible_product_variants.bible_product_id
        AND bp.user_id = auth.uid()
      )
    ) WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.bible_products bp
        WHERE bp.id = bible_product_variants.bible_product_id
        AND bp.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users manage own bible_variant_daily_units" ON public.bible_variant_daily_units
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin policies
DO $$ BEGIN
  CREATE POLICY "Admins manage all bible_product_variants" ON public.bible_product_variants
    FOR ALL USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage all bible_variant_daily_units" ON public.bible_variant_daily_units
    FOR ALL USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
