-- BrandPushers.ai Full Schema
-- Run in: Supabase Dashboard → SQL Editor
-- Entity: WHUT.AI LLC | Admin: minkovgroup@gmail.com

-- =====================
-- PROFILES
-- Extends auth.users. role: 'pending' | 'member' | 'admin'
-- =====================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  full_name    TEXT,
  role         TEXT NOT NULL DEFAULT 'pending', -- pending | member | admin
  approved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
-- minkovgroup@gmail.com is auto-assigned 'admin' role; all others get 'pending'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'minkovgroup@gmail.com' THEN 'admin' ELSE 'pending' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Bootstrap admin user: auto-assigned via trigger (no manual step needed)
-- If profile was created before trigger fix: UPDATE public.profiles SET role = 'admin' WHERE email = 'minkovgroup@gmail.com';

-- =====================
-- APPLICATIONS
-- Submitted when someone fills out the landing page form
-- =====================
CREATE TABLE IF NOT EXISTS public.applications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,          -- brand name
  brand_stage  TEXT NOT NULL,          -- idea | early | growth | established
  answers      JSONB NOT NULL DEFAULT '{}', -- { description, goals, applicant_name }
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- PHASES
-- Admin-defined brand-building phases (e.g. Strategy, Launch, Scale)
-- =====================
CREATE TABLE IF NOT EXISTS public.phases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  "order"      INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- MEMBER_PHASES
-- Which phase each member is at, and their progress
-- =====================
CREATE TABLE IF NOT EXISTS public.member_phases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phase_id     UUID NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | in_progress | completed
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(member_id, phase_id)
);

-- =====================
-- RESOURCES
-- Links and materials admins share with all members
-- =====================
CREATE TABLE IF NOT EXISTS public.resources (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  url          TEXT NOT NULL,
  category     TEXT NOT NULL DEFAULT 'General',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- DOCUMENTS
-- Files uploaded by members (stored in Supabase Storage)
-- =====================
CREATE TABLE IF NOT EXISTS public.documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  file_url     TEXT NOT NULL,
  phase_id     UUID REFERENCES public.phases(id) ON DELETE SET NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phases         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_phases  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents      ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- APPLICATIONS
CREATE POLICY "Users read own application"
  ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create application"
  ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins full access to applications"
  ON public.applications FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- PHASES (read-only for everyone authenticated)
CREATE POLICY "Authenticated users can read phases"
  ON public.phases FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage phases"
  ON public.phases FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- MEMBER_PHASES
CREATE POLICY "Members read own phases"
  ON public.member_phases FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Admins manage member phases"
  ON public.member_phases FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- RESOURCES
CREATE POLICY "Members can read resources"
  ON public.resources FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('member', 'admin')));
CREATE POLICY "Admins manage resources"
  ON public.resources FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- DOCUMENTS
CREATE POLICY "Users read own documents"
  ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own documents"
  ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own documents"
  ON public.documents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins read all documents"
  ON public.documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_member_phases_member ON public.member_phases(member_id);
CREATE INDEX IF NOT EXISTS idx_member_phases_phase ON public.member_phases(phase_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);

-- =====================
-- STORAGE
-- Create 'documents' bucket in Supabase Dashboard → Storage
-- Then add this policy:
-- =====================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies (run after bucket creation):
-- CREATE POLICY "Users upload own docs" ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users read own docs" ON storage.objects FOR SELECT
--   USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users delete own docs" ON storage.objects FOR DELETE
--   USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================
-- SEED: Default phases (run after schema)
-- =====================
-- INSERT INTO public.phases (name, description, "order") VALUES
--   ('Brand Strategy', 'Define your brand identity, positioning, and target audience.', 1),
--   ('Content Creation', 'Produce your first batch of brand content for TikTok and social.', 2),
--   ('TikTok Launch', 'Publish your first videos and establish your channel presence.', 3),
--   ('Community Building', 'Grow and engage your audience across platforms.', 4),
--   ('Paid Ads', 'Run targeted ad campaigns to accelerate growth.', 5),
--   ('Scale & Optimize', 'Analyze performance and scale what is working.', 6);
