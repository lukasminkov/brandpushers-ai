-- Fix equity_agreements_status_check constraint to include 'cancelled' status
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/oesqdjfrbzpgkagwyhwm/sql/new

ALTER TABLE public.equity_agreements DROP CONSTRAINT IF EXISTS equity_agreements_status_check;

ALTER TABLE public.equity_agreements ADD CONSTRAINT equity_agreements_status_check 
  CHECK (status = ANY(ARRAY['pending'::text, 'signed'::text, 'expired'::text, 'revoked'::text, 'cancelled'::text]));
