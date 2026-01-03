-- ============================================
-- SUPERMEDIA LAB - DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE project_status AS ENUM ('Idea', 'Validation', 'Scaling', 'Stalled');
CREATE TYPE update_type AS ENUM ('Milestone', 'Blocker', 'General');
CREATE TYPE decision_status AS ENUM ('Pending', 'Approved', 'Rejected');
CREATE TYPE user_role AS ENUM ('Owner', 'Admin', 'Viewer');

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'Viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- PROJECTS TABLE
-- ============================================

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'Idea',
  pitch_video_url TEXT,
  thumbnail_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  the_ask TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX idx_projects_slug ON public.projects(slug);
-- Index for owner lookups
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
-- Index for staleness queries
CREATE INDEX idx_projects_last_updated ON public.projects(last_updated_at);

-- ============================================
-- UPDATES TABLE
-- ============================================

CREATE TABLE public.updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type update_type NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for project updates
CREATE INDEX idx_updates_project ON public.updates(project_id);
-- Index for chronological ordering
CREATE INDEX idx_updates_created ON public.updates(created_at DESC);

-- ============================================
-- DECISIONS TABLE
-- ============================================

CREATE TABLE public.decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  status decision_status NOT NULL DEFAULT 'Pending',
  decided_by UUID REFERENCES public.users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for project decisions
CREATE INDEX idx_decisions_project ON public.decisions(project_id);
-- Index for pending decisions
CREATE INDEX idx_decisions_status ON public.decisions(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update project's last_updated_at when updates are added
CREATE OR REPLACE FUNCTION update_project_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.projects
  SET last_updated_at = NOW()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Users updated_at trigger
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Projects updated_at trigger
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Decisions updated_at trigger
CREATE TRIGGER trigger_decisions_updated_at
  BEFORE UPDATE ON public.decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update project last_updated_at when new update is added
CREATE TRIGGER trigger_project_last_updated
  AFTER INSERT ON public.updates
  FOR EACH ROW EXECUTE FUNCTION update_project_last_updated();

-- Auto-create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------
-- USERS POLICIES
-- --------------------------------------------

-- Everyone can read user profiles
CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- --------------------------------------------
-- PROJECTS POLICIES
-- --------------------------------------------

-- Everyone can read projects
CREATE POLICY "Projects are viewable by everyone"
  ON public.projects FOR SELECT
  USING (true);

-- Authenticated users can create projects
CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Project owners and admins can update projects
CREATE POLICY "Project owners can update their projects"
  ON public.projects FOR UPDATE
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('Owner', 'Admin')
    )
  );

-- Project owners and admins can delete projects
CREATE POLICY "Project owners can delete their projects"
  ON public.projects FOR DELETE
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('Owner', 'Admin')
    )
  );

-- --------------------------------------------
-- UPDATES POLICIES
-- --------------------------------------------

-- Everyone can read updates
CREATE POLICY "Updates are viewable by everyone"
  ON public.updates FOR SELECT
  USING (true);

-- Authenticated users can create updates
CREATE POLICY "Authenticated users can create updates"
  ON public.updates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

-- Update authors can edit their updates
CREATE POLICY "Authors can update their own updates"
  ON public.updates FOR UPDATE
  USING (auth.uid() = author_id);

-- Update authors and admins can delete updates
CREATE POLICY "Authors can delete their own updates"
  ON public.updates FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('Owner', 'Admin')
    )
  );

-- --------------------------------------------
-- DECISIONS POLICIES
-- --------------------------------------------

-- Everyone can read decisions
CREATE POLICY "Decisions are viewable by everyone"
  ON public.decisions FOR SELECT
  USING (true);

-- Authenticated users can create decisions
CREATE POLICY "Authenticated users can create decisions"
  ON public.decisions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Owners and Admins can update decisions (approve/reject)
CREATE POLICY "Owners and Admins can update decisions"
  ON public.decisions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('Owner', 'Admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_id AND owner_id = auth.uid()
    )
  );

-- Owners and Admins can delete decisions
CREATE POLICY "Owners and Admins can delete decisions"
  ON public.decisions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('Owner', 'Admin')
    )
  );

-- ============================================
-- STORAGE BUCKETS (run in Supabase Dashboard)
-- ============================================

-- Create storage bucket for project media
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-media', 'project-media', true);

-- Storage policies (uncomment and run in Supabase SQL Editor)
-- CREATE POLICY "Public read access for project media"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'project-media');

-- CREATE POLICY "Authenticated users can upload media"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'project-media' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Users can update their own uploads"
--   ON storage.objects FOR UPDATE
--   USING (bucket_id = 'project-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own uploads"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'project-media' AND auth.uid()::text = (storage.foldername(name))[1]);

