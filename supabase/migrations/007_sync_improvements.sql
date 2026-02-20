-- Add timezone to tiktok_connections (defaults to Pacific for US shops)
ALTER TABLE tiktok_connections ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Los_Angeles';

-- Add gmv column to tiktok_orders for storing calculated GMV
ALTER TABLE tiktok_orders ADD COLUMN IF NOT EXISTS gmv DECIMAL(12,2) DEFAULT 0;
