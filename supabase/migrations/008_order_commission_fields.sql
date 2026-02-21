-- Add per-order commission fields populated from TikTok Finance Statement Transactions API
-- These are the REAL commission amounts, not estimates

ALTER TABLE tiktok_orders ADD COLUMN IF NOT EXISTS platform_commission DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tiktok_orders ADD COLUMN IF NOT EXISTS affiliate_commission DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tiktok_orders ADD COLUMN IF NOT EXISTS transaction_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tiktok_orders ADD COLUMN IF NOT EXISTS settlement_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tiktok_orders ADD COLUMN IF NOT EXISTS commission_synced BOOLEAN DEFAULT false;
