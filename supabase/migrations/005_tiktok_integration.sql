-- TikTok Shop Integration Tables
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/oesqdjfrbzpgkagwyhwm/sql/new

-- 1. TikTok Connections (OAuth tokens + shop info)
CREATE TABLE IF NOT EXISTS public.tiktok_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id text,
  shop_cipher text,
  shop_name text,
  region text DEFAULT 'US',
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  refresh_token_expires_at timestamptz,
  connected_at timestamptz DEFAULT now(),
  last_sync_at timestamptz,
  sync_status text DEFAULT 'idle', -- idle, syncing, error
  sync_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tiktok_connections_user ON public.tiktok_connections(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tiktok_connections_shop ON public.tiktok_connections(user_id, shop_id);

-- 2. TikTok Orders
CREATE TABLE IF NOT EXISTS public.tiktok_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES public.tiktok_connections(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  order_status text,
  payment_status text,
  total_amount numeric(12,2) DEFAULT 0,
  subtotal numeric(12,2) DEFAULT 0,
  shipping_fee numeric(12,2) DEFAULT 0,
  platform_discount numeric(12,2) DEFAULT 0,
  seller_discount numeric(12,2) DEFAULT 0,
  refund_amount numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  order_create_time timestamptz,
  order_paid_time timestamptz,
  items jsonb DEFAULT '[]'::jsonb, -- [{product_id, product_name, sku_id, sku_name, quantity, price}]
  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tiktok_orders_order ON public.tiktok_orders(user_id, order_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_orders_date ON public.tiktok_orders(order_create_time);

-- 3. TikTok Affiliate Data
CREATE TABLE IF NOT EXISTS public.tiktok_affiliate_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES public.tiktok_connections(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  affiliate_type text, -- 'open_collab', 'target_collab', 'ads', 'gmv_max'
  commission_rate numeric(5,2) DEFAULT 0,
  commission_amount numeric(12,2) DEFAULT 0,
  order_amount numeric(12,2) DEFAULT 0,
  product_id text,
  product_name text,
  creator_username text,
  order_create_time timestamptz,
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tiktok_aff_order ON public.tiktok_affiliate_orders(user_id, order_id, affiliate_type);
CREATE INDEX IF NOT EXISTS idx_tiktok_aff_date ON public.tiktok_affiliate_orders(order_create_time);

-- 4. TikTok Settlements
CREATE TABLE IF NOT EXISTS public.tiktok_settlements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES public.tiktok_connections(id) ON DELETE CASCADE,
  settlement_id text NOT NULL,
  settlement_time timestamptz,
  settlement_amount numeric(12,2) DEFAULT 0,
  revenue numeric(12,2) DEFAULT 0,
  platform_fee numeric(12,2) DEFAULT 0,
  affiliate_commission numeric(12,2) DEFAULT 0,
  shipping_fee_subsidy numeric(12,2) DEFAULT 0,
  refund_amount numeric(12,2) DEFAULT 0,
  adjustment numeric(12,2) DEFAULT 0,
  currency text DEFAULT 'USD',
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tiktok_settlement ON public.tiktok_settlements(user_id, settlement_id);

-- 5. TikTok Products (for auto-creating Bible products)
CREATE TABLE IF NOT EXISTS public.tiktok_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid REFERENCES public.tiktok_connections(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text,
  product_status text,
  skus jsonb DEFAULT '[]'::jsonb,
  bible_product_id uuid REFERENCES public.bible_products(id),
  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tiktok_products ON public.tiktok_products(user_id, product_id);

-- 6. Bible sync tracking
CREATE TABLE IF NOT EXISTS public.bible_sync_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_date date NOT NULL,
  platform text DEFAULT 'tiktok_shop',
  estimated_data jsonb, -- what we calculated from orders
  settled_data jsonb,   -- what came from settlement API
  match_percentage numeric(5,2) DEFAULT 0,
  synced_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bible_sync ON public.bible_sync_log(user_id, sync_date, platform);

-- RLS Policies
ALTER TABLE public.tiktok_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_affiliate_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_sync_log ENABLE ROW LEVEL SECURITY;

-- User can manage their own connections
DO $$ BEGIN
  CREATE POLICY "Users manage own tiktok_connections" ON public.tiktok_connections
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users view own tiktok_orders" ON public.tiktok_orders
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users view own tiktok_affiliate_orders" ON public.tiktok_affiliate_orders
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users view own tiktok_settlements" ON public.tiktok_settlements
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users view own tiktok_products" ON public.tiktok_products
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users view own bible_sync_log" ON public.bible_sync_log
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin policies
DO $$ BEGIN
  CREATE POLICY "Admins manage all tiktok_connections" ON public.tiktok_connections
    FOR ALL USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins view all tiktok_orders" ON public.tiktok_orders
    FOR ALL USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins view all tiktok_affiliate_orders" ON public.tiktok_affiliate_orders
    FOR ALL USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins view all tiktok_settlements" ON public.tiktok_settlements
    FOR ALL USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins view all tiktok_products" ON public.tiktok_products
    FOR ALL USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins view all bible_sync_log" ON public.bible_sync_log
    FOR ALL USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Service role policy for API routes (using service_role key bypasses RLS anyway)
