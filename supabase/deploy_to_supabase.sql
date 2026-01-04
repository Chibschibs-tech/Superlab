-- ============================================
-- SUPERLAB - COMPLETE DEPLOYMENT SQL
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('Owner', 'Admin', 'LabAdmin', 'Editor', 'Viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('Idea', 'Validation', 'Scaling', 'Stalled', 'Supported');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_visibility AS ENUM ('Private', 'Org');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE update_type AS ENUM ('Milestone', 'Blocker', 'General');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE decision_status AS ENUM ('Pending', 'InfoRequested', 'Approved', 'Rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_type AS ENUM ('Image', 'Video', 'Document', 'Link', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE milestone_status AS ENUM ('Planned', 'InProgress', 'Completed', 'Blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('Todo', 'InProgress', 'Done', 'Blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('Low', 'Medium', 'High', 'Critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE commitment_type AS ENUM ('Budget', 'Resource', 'Intro', 'Hiring', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE commitment_status AS ENUM ('Pending', 'Active', 'Completed', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_type AS ENUM ('StageChanged', 'MilestoneCompleted', 'DecisionApproved', 'AskCreated', 'TaskCompleted', 'UpdatePosted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE project_role AS ENUM ('lead', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE need_type AS ENUM ('Budget', 'Intro', 'Supplier', 'Legal', 'Hiring', 'Resource', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE need_status AS ENUM ('Open', 'InReview', 'Fulfilled', 'Rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE category_type AS ENUM ('project', 'revenue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE entry_type AS ENUM ('Sale', 'Refund', 'Fee', 'Adjustment', 'Other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE revenue_status AS ENUM ('Pending', 'Confirmed', 'Disputed', 'Refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sync_run_status AS ENUM ('Running', 'Success', 'Failed', 'Partial');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- HELPER FUNCTION: Update timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'Viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================
-- CATEGORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  type category_type NOT NULL DEFAULT 'project',
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- ============================================
-- PROJECTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  highlights JSONB DEFAULT '[]' NOT NULL,
  highlights_text TEXT,
  status project_status DEFAULT 'Idea',
  visibility project_visibility DEFAULT 'Org',
  tags TEXT[] DEFAULT '{}',
  pitch_video_url TEXT,
  thumbnail_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  the_ask TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_highlights ON public.projects USING GIN (highlights);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON public.projects USING GIN (tags);

-- ============================================
-- PROJECT MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role project_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);

-- ============================================
-- UPDATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type update_type DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_updates_project ON public.updates(project_id);
CREATE INDEX IF NOT EXISTS idx_updates_author ON public.updates(author_id);

-- ============================================
-- DECISIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB DEFAULT '[]',
  status decision_status DEFAULT 'Pending',
  decided_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  rationale TEXT,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_project ON public.decisions(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON public.decisions(status);

-- ============================================
-- PROJECT ASSETS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.project_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type asset_type NOT NULL DEFAULT 'Other',
  url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  is_pinned BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_assets_project ON public.project_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_type ON public.project_assets(type);
CREATE INDEX IF NOT EXISTS idx_project_assets_pinned ON public.project_assets(is_pinned);
CREATE INDEX IF NOT EXISTS idx_project_assets_tags ON public.project_assets USING GIN (tags);

-- ============================================
-- MILESTONES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date DATE,
  status milestone_status DEFAULT 'Planned',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON public.milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON public.milestones(due_date);

-- ============================================
-- TASKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'Todo',
  priority task_priority DEFAULT 'Medium',
  due_date DATE,
  assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON public.tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);

-- ============================================
-- NEEDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.needs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type need_type NOT NULL DEFAULT 'Other',
  urgency task_priority DEFAULT 'Medium',
  status need_status DEFAULT 'Open',
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  decision_id UUID REFERENCES public.decisions(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  fulfilled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_needs_project ON public.needs(project_id);
CREATE INDEX IF NOT EXISTS idx_needs_status ON public.needs(status);
CREATE INDEX IF NOT EXISTS idx_needs_type ON public.needs(type);

-- ============================================
-- PROJECT CONTACTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.project_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  organization VARCHAR(255),
  role VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  notes TEXT,
  is_internal BOOLEAN DEFAULT false,
  internal_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_contacts_project ON public.project_contacts(project_id);

-- ============================================
-- COMMITMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  decision_id UUID REFERENCES public.decisions(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type commitment_type NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(14, 2),
  due_date DATE,
  status commitment_status DEFAULT 'Pending',
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commitments_project ON public.commitments(project_id);
CREATE INDEX IF NOT EXISTS idx_commitments_decision ON public.commitments(decision_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON public.commitments(status);

-- ============================================
-- EVENTS TABLE (Analytics)
-- ============================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_project ON public.events(project_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

-- ============================================
-- REVENUE STREAMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.revenue_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  currency VARCHAR(3) DEFAULT 'EUR',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_streams_active ON public.revenue_streams(is_active);
CREATE INDEX IF NOT EXISTS idx_revenue_streams_category ON public.revenue_streams(category_id);

-- ============================================
-- REVENUE SOURCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.revenue_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID NOT NULL REFERENCES public.revenue_streams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  source_type VARCHAR(100) NOT NULL,
  connection_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_frequency VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_sources_stream ON public.revenue_sources(stream_id);
CREATE INDEX IF NOT EXISTS idx_revenue_sources_type ON public.revenue_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_revenue_sources_active ON public.revenue_sources(is_active);

-- ============================================
-- REVENUE ENTRIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.revenue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID NOT NULL REFERENCES public.revenue_streams(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.revenue_sources(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(14, 2) NOT NULL CHECK (amount BETWEEN -1000000000 AND 1000000000),
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'CNY')),
  entry_type entry_type NOT NULL DEFAULT 'Sale',
  status revenue_status NOT NULL DEFAULT 'Confirmed',
  reference_type VARCHAR(100),
  reference_id VARCHAR(255),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_entries_stream ON public.revenue_entries(stream_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_source ON public.revenue_entries(source_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_date ON public.revenue_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_stream_date ON public.revenue_entries(stream_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_source_date ON public.revenue_entries(source_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_type ON public.revenue_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_status ON public.revenue_entries(status);

-- Unique constraint for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_revenue_entries_unique_ref 
  ON public.revenue_entries(source_id, reference_type, reference_id) 
  WHERE reference_id IS NOT NULL;

-- ============================================
-- REVENUE TARGETS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.revenue_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID NOT NULL REFERENCES public.revenue_streams(id) ON DELETE CASCADE,
  month_date DATE NOT NULL,
  target_amount DECIMAL(14, 2) NOT NULL CHECK (target_amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'CNY')),
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stream_id, month_date)
);

CREATE INDEX IF NOT EXISTS idx_revenue_targets_stream ON public.revenue_targets(stream_id);
CREATE INDEX IF NOT EXISTS idx_revenue_targets_month ON public.revenue_targets(month_date);
CREATE INDEX IF NOT EXISTS idx_revenue_targets_stream_month ON public.revenue_targets(stream_id, month_date);

-- ============================================
-- SYNC RUNS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.sync_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES public.revenue_sources(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status sync_run_status NOT NULL DEFAULT 'Running',
  rows_imported INTEGER DEFAULT 0,
  rows_skipped INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  total_amount DECIMAL(14, 2) DEFAULT 0,
  sales_amount DECIMAL(14, 2) DEFAULT 0,
  refunds_amount DECIMAL(14, 2) DEFAULT 0,
  date_range_start DATE,
  date_range_end DATE,
  error_log TEXT,
  initiated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_source ON public.sync_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_started ON public.sync_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_runs_status ON public.sync_runs(status);
CREATE INDEX IF NOT EXISTS idx_sync_runs_source_started ON public.sync_runs(source_id, started_at DESC);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_decisions_updated_at ON public.decisions;
CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON public.decisions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_milestones_updated_at ON public.milestones;
CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_needs_updated_at ON public.needs;
CREATE TRIGGER update_needs_updated_at BEFORE UPDATE ON public.needs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role IN ('Owner', 'Admin', 'LabAdmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION has_revenue_access()
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  RETURN v_role IN ('Owner', 'Admin', 'LabAdmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_project_role(p_project_id UUID)
RETURNS project_role AS $$
DECLARE
  v_role project_role;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  SELECT role INTO v_role FROM public.project_members WHERE project_id = p_project_id AND user_id = auth.uid();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION can_edit_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_global_role user_role;
  v_project_role project_role;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT role INTO v_global_role FROM public.users WHERE id = auth.uid();
  IF v_global_role IN ('Owner', 'Admin', 'LabAdmin') THEN RETURN true; END IF;
  SELECT role INTO v_project_role FROM public.project_members WHERE project_id = p_project_id AND user_id = auth.uid();
  RETURN v_project_role IN ('lead', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users: Read self, admin reads all
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (id = auth.uid() OR is_admin_or_owner());

-- Categories: All authenticated can read
DROP POLICY IF EXISTS "categories_select" ON public.categories;
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "categories_insert" ON public.categories;
CREATE POLICY "categories_insert" ON public.categories FOR INSERT WITH CHECK (is_admin_or_owner());

DROP POLICY IF EXISTS "categories_update" ON public.categories;
CREATE POLICY "categories_update" ON public.categories FOR UPDATE USING (is_admin_or_owner());

DROP POLICY IF EXISTS "categories_delete" ON public.categories;
CREATE POLICY "categories_delete" ON public.categories FOR DELETE USING (is_admin_or_owner());

-- Projects: Based on visibility and membership
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    visibility = 'Org' OR
    owner_id = auth.uid() OR
    is_admin_or_owner() OR
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (can_edit_project(id));

DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (is_admin_or_owner() OR owner_id = auth.uid());

-- Project Members
DROP POLICY IF EXISTS "project_members_select" ON public.project_members;
CREATE POLICY "project_members_select" ON public.project_members FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "project_members_insert" ON public.project_members;
CREATE POLICY "project_members_insert" ON public.project_members FOR INSERT WITH CHECK (
  is_admin_or_owner() OR get_project_role(project_id) = 'lead'
);

DROP POLICY IF EXISTS "project_members_update" ON public.project_members;
CREATE POLICY "project_members_update" ON public.project_members FOR UPDATE USING (
  is_admin_or_owner() OR get_project_role(project_id) = 'lead'
);

DROP POLICY IF EXISTS "project_members_delete" ON public.project_members;
CREATE POLICY "project_members_delete" ON public.project_members FOR DELETE USING (
  is_admin_or_owner() OR get_project_role(project_id) = 'lead'
);

-- Updates, Assets, Milestones, Tasks, Needs, Contacts, Commitments: Project-based access
DROP POLICY IF EXISTS "updates_select" ON public.updates;
CREATE POLICY "updates_select" ON public.updates FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "updates_insert" ON public.updates;
CREATE POLICY "updates_insert" ON public.updates FOR INSERT WITH CHECK (can_edit_project(project_id));

DROP POLICY IF EXISTS "project_assets_select" ON public.project_assets;
CREATE POLICY "project_assets_select" ON public.project_assets FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "project_assets_insert" ON public.project_assets;
CREATE POLICY "project_assets_insert" ON public.project_assets FOR INSERT WITH CHECK (can_edit_project(project_id));

DROP POLICY IF EXISTS "project_assets_update" ON public.project_assets;
CREATE POLICY "project_assets_update" ON public.project_assets FOR UPDATE USING (can_edit_project(project_id));

DROP POLICY IF EXISTS "project_assets_delete" ON public.project_assets;
CREATE POLICY "project_assets_delete" ON public.project_assets FOR DELETE USING (can_edit_project(project_id));

DROP POLICY IF EXISTS "milestones_select" ON public.milestones;
CREATE POLICY "milestones_select" ON public.milestones FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "milestones_insert" ON public.milestones;
CREATE POLICY "milestones_insert" ON public.milestones FOR INSERT WITH CHECK (can_edit_project(project_id));

DROP POLICY IF EXISTS "milestones_update" ON public.milestones;
CREATE POLICY "milestones_update" ON public.milestones FOR UPDATE USING (can_edit_project(project_id));

DROP POLICY IF EXISTS "milestones_delete" ON public.milestones;
CREATE POLICY "milestones_delete" ON public.milestones FOR DELETE USING (can_edit_project(project_id));

DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT WITH CHECK (can_edit_project(project_id));

DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE USING (can_edit_project(project_id));

DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE USING (can_edit_project(project_id));

DROP POLICY IF EXISTS "needs_select" ON public.needs;
CREATE POLICY "needs_select" ON public.needs FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "needs_insert" ON public.needs;
CREATE POLICY "needs_insert" ON public.needs FOR INSERT WITH CHECK (can_edit_project(project_id));

DROP POLICY IF EXISTS "needs_update" ON public.needs;
CREATE POLICY "needs_update" ON public.needs FOR UPDATE USING (can_edit_project(project_id));

DROP POLICY IF EXISTS "needs_delete" ON public.needs;
CREATE POLICY "needs_delete" ON public.needs FOR DELETE USING (can_edit_project(project_id));

DROP POLICY IF EXISTS "project_contacts_select" ON public.project_contacts;
CREATE POLICY "project_contacts_select" ON public.project_contacts FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "project_contacts_insert" ON public.project_contacts;
CREATE POLICY "project_contacts_insert" ON public.project_contacts FOR INSERT WITH CHECK (can_edit_project(project_id));

DROP POLICY IF EXISTS "project_contacts_update" ON public.project_contacts;
CREATE POLICY "project_contacts_update" ON public.project_contacts FOR UPDATE USING (can_edit_project(project_id));

DROP POLICY IF EXISTS "project_contacts_delete" ON public.project_contacts;
CREATE POLICY "project_contacts_delete" ON public.project_contacts FOR DELETE USING (can_edit_project(project_id));

DROP POLICY IF EXISTS "commitments_select" ON public.commitments;
CREATE POLICY "commitments_select" ON public.commitments FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "commitments_insert" ON public.commitments;
CREATE POLICY "commitments_insert" ON public.commitments FOR INSERT WITH CHECK (is_admin_or_owner());

DROP POLICY IF EXISTS "commitments_update" ON public.commitments;
CREATE POLICY "commitments_update" ON public.commitments FOR UPDATE USING (is_admin_or_owner());

DROP POLICY IF EXISTS "commitments_delete" ON public.commitments;
CREATE POLICY "commitments_delete" ON public.commitments FOR DELETE USING (is_admin_or_owner());

-- Decisions: Admin only for approvals
DROP POLICY IF EXISTS "decisions_select" ON public.decisions;
CREATE POLICY "decisions_select" ON public.decisions FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "decisions_insert" ON public.decisions;
CREATE POLICY "decisions_insert" ON public.decisions FOR INSERT WITH CHECK (can_edit_project(project_id));

DROP POLICY IF EXISTS "decisions_update" ON public.decisions;
CREATE POLICY "decisions_update" ON public.decisions FOR UPDATE USING (is_admin_or_owner());

DROP POLICY IF EXISTS "decisions_delete" ON public.decisions;
CREATE POLICY "decisions_delete" ON public.decisions FOR DELETE USING (is_admin_or_owner());

-- Events
DROP POLICY IF EXISTS "events_select" ON public.events;
CREATE POLICY "events_select" ON public.events FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "events_insert" ON public.events;
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Revenue tables: Admin only
DROP POLICY IF EXISTS "revenue_streams_select" ON public.revenue_streams;
CREATE POLICY "revenue_streams_select" ON public.revenue_streams FOR SELECT USING (has_revenue_access());

DROP POLICY IF EXISTS "revenue_streams_insert" ON public.revenue_streams;
CREATE POLICY "revenue_streams_insert" ON public.revenue_streams FOR INSERT WITH CHECK (has_revenue_access());

DROP POLICY IF EXISTS "revenue_streams_update" ON public.revenue_streams;
CREATE POLICY "revenue_streams_update" ON public.revenue_streams FOR UPDATE USING (has_revenue_access());

DROP POLICY IF EXISTS "revenue_streams_delete" ON public.revenue_streams;
CREATE POLICY "revenue_streams_delete" ON public.revenue_streams FOR DELETE USING (has_revenue_access());

DROP POLICY IF EXISTS "revenue_sources_select" ON public.revenue_sources;
CREATE POLICY "revenue_sources_select" ON public.revenue_sources FOR SELECT USING (has_revenue_access());

DROP POLICY IF EXISTS "revenue_sources_insert" ON public.revenue_sources;
CREATE POLICY "revenue_sources_insert" ON public.revenue_sources FOR INSERT WITH CHECK (has_revenue_access());

DROP POLICY IF EXISTS "revenue_sources_update" ON public.revenue_sources;
CREATE POLICY "revenue_sources_update" ON public.revenue_sources FOR UPDATE USING (has_revenue_access());

DROP POLICY IF EXISTS "revenue_sources_delete" ON public.revenue_sources;
CREATE POLICY "revenue_sources_delete" ON public.revenue_sources FOR DELETE USING (has_revenue_access());

DROP POLICY IF EXISTS "revenue_entries_select" ON public.revenue_entries;
CREATE POLICY "revenue_entries_select" ON public.revenue_entries FOR SELECT USING (has_revenue_access());

DROP POLICY IF EXISTS "revenue_entries_insert" ON public.revenue_entries;
CREATE POLICY "revenue_entries_insert" ON public.revenue_entries FOR INSERT WITH CHECK (has_revenue_access());

DROP POLICY IF EXISTS "revenue_entries_update" ON public.revenue_entries;
CREATE POLICY "revenue_entries_update" ON public.revenue_entries FOR UPDATE USING (has_revenue_access());

DROP POLICY IF EXISTS "revenue_entries_delete" ON public.revenue_entries;
CREATE POLICY "revenue_entries_delete" ON public.revenue_entries FOR DELETE USING (has_revenue_access());

DROP POLICY IF EXISTS "revenue_targets_select" ON public.revenue_targets;
CREATE POLICY "revenue_targets_select" ON public.revenue_targets FOR SELECT USING (has_revenue_access());

DROP POLICY IF EXISTS "revenue_targets_insert" ON public.revenue_targets;
CREATE POLICY "revenue_targets_insert" ON public.revenue_targets FOR INSERT WITH CHECK (has_revenue_access());

DROP POLICY IF EXISTS "revenue_targets_update" ON public.revenue_targets;
CREATE POLICY "revenue_targets_update" ON public.revenue_targets FOR UPDATE USING (has_revenue_access());

DROP POLICY IF EXISTS "revenue_targets_delete" ON public.revenue_targets;
CREATE POLICY "revenue_targets_delete" ON public.revenue_targets FOR DELETE USING (has_revenue_access());

DROP POLICY IF EXISTS "sync_runs_select" ON public.sync_runs;
CREATE POLICY "sync_runs_select" ON public.sync_runs FOR SELECT USING (has_revenue_access());

DROP POLICY IF EXISTS "sync_runs_insert" ON public.sync_runs;
CREATE POLICY "sync_runs_insert" ON public.sync_runs FOR INSERT WITH CHECK (has_revenue_access());

DROP POLICY IF EXISTS "sync_runs_update" ON public.sync_runs;
CREATE POLICY "sync_runs_update" ON public.sync_runs FOR UPDATE USING (has_revenue_access());

DROP POLICY IF EXISTS "sync_runs_delete" ON public.sync_runs;
CREATE POLICY "sync_runs_delete" ON public.sync_runs FOR DELETE USING (has_revenue_access());

-- ============================================
-- SEED CATEGORIES
-- ============================================

INSERT INTO public.categories (id, name, slug, type, color, icon, sort_order, description) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Audiovisuel & Pro AV', 'audiovisual-pro-av', 'project', '#8B5CF6', 'Video', 1, 'Solutions audiovisuelles professionnelles'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000002', 'Retail & E-commerce', 'retail-ecommerce', 'project', '#EC4899', 'ShoppingBag', 2, 'Commerce de détail'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000003', 'Pro Audio Retail', 'pro-audio-retail', 'project', '#F59E0B', 'Music', 3, 'Audio professionnel'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000004', 'Services & Events', 'services-events', 'project', '#10B981', 'Calendar', 4, 'Services et événementiel'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000005', 'Media Production', 'media-production', 'project', '#3B82F6', 'Film', 5, 'Production média'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000006', 'Tech & AI', 'tech-ai', 'project', '#6366F1', 'Cpu', 6, 'Technologies et IA'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000007', 'Fintech & Procurement', 'fintech-procurement', 'project', '#14B8A6', 'Wallet', 7, 'Finance et achats'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000008', 'Data & Analytics', 'data-analytics', 'project', '#0EA5E9', 'BarChart3', 8, 'Data et analytique'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000009', 'Internal Ops', 'internal-ops', 'project', '#64748B', 'Settings', 9, 'Infrastructure')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description;

-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'Viewer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- DEPLOYMENT COMPLETE
-- ============================================

SELECT 'Superlab schema deployed successfully!' AS status;

