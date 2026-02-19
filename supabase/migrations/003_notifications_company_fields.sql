-- ============================================================
-- Migration 003 — Notifications table + Company info fields
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/oesqdjfrbzpgkagwyhwm/sql/new
-- ============================================================

-- 1. Add company info columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_type TEXT; -- LLC, C Corp, S Corp, etc.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ein TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_address TEXT;

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,           -- 'agreement', 'phase_update', 'general'
  title TEXT NOT NULL,
  message TEXT,
  action_type TEXT,             -- 'sign_agreement', 'view_document', etc.
  action_data JSONB,            -- e.g. { "agreement_id": "uuid" }
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Members can read their own notifications
CREATE POLICY "users_select_own_notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Members can update (mark read) their own notifications
CREATE POLICY "users_update_own_notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can insert notifications for any user
CREATE POLICY "admins_insert_notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.is_admin());

-- Admins can read all notifications (for support)
CREATE POLICY "admins_select_all_notifications" ON public.notifications
  FOR SELECT USING (public.is_admin());

-- 4. Formation-docs bucket storage policies
-- (Bucket already created via API — just add policies)
CREATE POLICY "members_upload_own_formation_docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'formation-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "members_read_own_formation_docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'formation-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "admins_manage_formation_docs" ON storage.objects
  FOR ALL USING (
    bucket_id = 'formation-docs'
    AND public.is_admin()
  );
