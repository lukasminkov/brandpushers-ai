-- Migration: Add onboarding fields to profiles
-- Run in: Supabase Dashboard → SQL Editor
-- Date: 2026-02-19

-- Add new columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS residential_address TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Note: brand_name was already added in a previous migration
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_name TEXT;

-- Update the "Admins read all profiles" policy to use is_admin() SECURITY DEFINER
-- (is_admin() was created separately — it avoids RLS recursion)
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins full access to applications" ON public.applications;
CREATE POLICY "Admins full access to applications"
  ON public.applications FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage phases" ON public.phases;
CREATE POLICY "Admins manage phases"
  ON public.phases FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage member phases" ON public.member_phases;
CREATE POLICY "Admins manage member phases"
  ON public.member_phases FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage resources" ON public.resources;
CREATE POLICY "Admins manage resources"
  ON public.resources FOR ALL
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins read all documents" ON public.documents;
CREATE POLICY "Admins read all documents"
  ON public.documents FOR SELECT
  USING (public.is_admin());
