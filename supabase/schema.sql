-- ============================================
-- SUPERMEDIA LAB - DATABASE SCHEMA
-- ============================================
-- Complete schema including all tables, RLS policies, and helper functions
-- 
-- To apply migrations to a fresh database, run:
-- 1. schema.sql (this file)
-- 
-- Tables:
-- - users (extends auth.users)
-- - projects
-- - updates
-- - decisions
-- - project_assets
-- - milestones
-- - tasks
-- - project_contacts
-- - commitments
-- - events
-- - project_members

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('Owner', 'Admin', 'Editor', 'Viewer');
CREATE TYPE project_status AS ENUM ('Idea', 'Validation', 'Scaling', 'Stalled', 'Supported');
CREATE TYPE update_type AS ENUM ('Milestone', 'Blocker', 'General');
CREATE TYPE decision_status AS ENUM ('Pending', 'Approved', 'Rejected');

-- Asset types for project files
CREATE TYPE asset_type AS ENUM (
  'document',      -- PDFs, docs, presentations
  'image',         -- Images, screenshots, mockups
  'video',         -- Video files, recordings
  'design',        -- Figma, Sketch files
  'code',          -- Code snippets, repos
  'spreadsheet',   -- Excel, Google Sheets
  'other'          -- Misc files
);

-- Task status
CREATE TYPE task_status AS ENUM (
  'backlog',       -- Not started, in queue
  'todo',          -- Ready to start
  'in_progress',   -- Currently being worked on
  'review',        -- Awaiting review
  'done',          -- Completed
  'blocked'        -- Blocked by dependency
);

-- Task priority
CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Milestone status
CREATE TYPE milestone_status AS ENUM (
  'planned',       -- Future milestone
  'in_progress',   -- Currently active
  'completed',     -- Successfully finished
  'delayed',       -- Behind schedule
  'cancelled'      -- Not happening
);

-- Contact type
CREATE TYPE contact_type AS ENUM (
  'stakeholder',   -- Internal stakeholder
  'sponsor',       -- Project sponsor
  'partner',       -- External partner
  'vendor',        -- Service provider
  'advisor',       -- Consultant/advisor
  'client'         -- End client/customer
);

-- Commitment type
CREATE TYPE commitment_type AS ENUM (
  'budget',        -- Financial commitment
  'headcount',     -- Personnel allocation
  'equipment',     -- Hardware/software
  'time',          -- Time allocation
  'other'          -- Other resources
);

-- Commitment status
CREATE TYPE commitment_status AS ENUM (
  'requested',     -- Pending approval
  'approved',      -- Approved by Owner
  'allocated',     -- Resources assigned
  'delivered',     -- Resources delivered
  'cancelled'      -- Cancelled
);

-- Event type
CREATE TYPE event_type AS ENUM (
  'meeting',       -- Team meetings
  'review',        -- Project reviews
  'demo',          -- Demonstrations
  'milestone',     -- Milestone events
  'deadline',      -- Important deadlines
  'workshop',      -- Working sessions
  'presentation'   -- Presentations/pitches
);

-- Project member role
CREATE TYPE project_role AS ENUM (
  'lead',          -- Project lead (owner_id)
  'editor',        -- Can edit project content
  'viewer'         -- Read-only access
);

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
  highlights TEXT,
  status project_status NOT NULL DEFAULT 'Idea',
  pitch_video_url TEXT,
  thumbnail_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  the_ask TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_last_updated ON public.projects(last_updated_at);
CREATE INDEX idx_projects_status ON public.projects(status);

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

-- Indexes
CREATE INDEX idx_updates_project ON public.updates(project_id);
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

-- Indexes
CREATE INDEX idx_decisions_project ON public.decisions(project_id);
CREATE INDEX idx_decisions_status ON public.decisions(status);

-- ============================================
-- PROJECT_ASSETS TABLE
-- ============================================

CREATE TABLE public.project_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Asset metadata
  name TEXT NOT NULL,
  description TEXT,
  type asset_type NOT NULL DEFAULT 'other',
  
  -- Storage info
  file_url TEXT NOT NULL,
  file_size BIGINT,                    -- Size in bytes
  mime_type TEXT,
  
  -- Visibility
  is_public BOOLEAN NOT NULL DEFAULT false,  -- Visible in Showroom?
  is_featured BOOLEAN NOT NULL DEFAULT false, -- Show prominently?
  is_pinned BOOLEAN NOT NULL DEFAULT false,   -- Pinned to top?
  tags TEXT[] DEFAULT '{}',                   -- Asset tags
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_project_assets_project ON public.project_assets(project_id);
CREATE INDEX idx_project_assets_type ON public.project_assets(type);
CREATE INDEX idx_project_assets_featured ON public.project_assets(is_featured) WHERE is_featured = true;
CREATE INDEX idx_project_assets_pinned ON public.project_assets(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_project_assets_tags ON public.project_assets USING GIN(tags);

-- ============================================
-- MILESTONES TABLE
-- ============================================

CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Milestone info
  title TEXT NOT NULL,
  description TEXT,
  status milestone_status NOT NULL DEFAULT 'planned',
  
  -- Dates
  start_date DATE,
  target_date DATE NOT NULL,
  completed_date DATE,
  
  -- Progress tracking
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  
  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_milestones_project ON public.milestones(project_id);
CREATE INDEX idx_milestones_status ON public.milestones(status);
CREATE INDEX idx_milestones_target_date ON public.milestones(target_date);

-- ============================================
-- TASKS TABLE
-- ============================================

CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  
  -- Task info
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'backlog',
  priority task_priority NOT NULL DEFAULT 'medium',
  
  -- Assignment
  assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Dates
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Effort estimation
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),
  
  -- Dependencies
  depends_on UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  
  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_milestone ON public.tasks(milestone_id);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);

-- ============================================
-- PROJECT_CONTACTS TABLE
-- ============================================

CREATE TABLE public.project_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Contact info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  type contact_type NOT NULL DEFAULT 'stakeholder',
  
  -- Notes
  notes TEXT,
  
  -- Link to internal user
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_project_contacts_project ON public.project_contacts(project_id);
CREATE INDEX idx_project_contacts_type ON public.project_contacts(type);
CREATE INDEX idx_project_contacts_user ON public.project_contacts(user_id);

-- ============================================
-- COMMITMENTS TABLE
-- ============================================

CREATE TABLE public.commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Commitment details
  title TEXT NOT NULL,
  description TEXT,
  type commitment_type NOT NULL,
  status commitment_status NOT NULL DEFAULT 'requested',
  
  -- Amount/value
  amount DECIMAL(12,2),
  currency TEXT DEFAULT 'EUR',
  quantity INTEGER,
  unit TEXT,
  
  -- Approval workflow
  requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  
  -- Dates
  start_date DATE,
  end_date DATE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_commitments_project ON public.commitments(project_id);
CREATE INDEX idx_commitments_type ON public.commitments(type);
CREATE INDEX idx_commitments_status ON public.commitments(status);
CREATE INDEX idx_commitments_requested_by ON public.commitments(requested_by);

-- ============================================
-- EVENTS TABLE
-- ============================================

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Event info
  title TEXT NOT NULL,
  description TEXT,
  type event_type NOT NULL DEFAULT 'meeting',
  
  -- Location/link
  location TEXT,
  meeting_url TEXT,
  
  -- Scheduling
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  
  -- Recurrence
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  
  -- Organizer
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Attendees
  attendees JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_project ON public.events(project_id);
CREATE INDEX idx_events_type ON public.events(type);
CREATE INDEX idx_events_start_time ON public.events(start_time);
CREATE INDEX idx_events_organizer ON public.events(organizer_id);

-- ============================================
-- PROJECT_MEMBERS TABLE (Junction Table)
-- ============================================

CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role project_role NOT NULL DEFAULT 'viewer',
  
  -- Timestamps
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Unique membership
  UNIQUE(project_id, user_id)
);

-- Indexes
CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);
CREATE INDEX idx_project_members_role ON public.project_members(role);

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

-- Check if user is a global Owner or Admin
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('Owner', 'Admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is the project owner (lead)
CREATE OR REPLACE FUNCTION is_project_owner(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = p_project_id
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role on a project
CREATE OR REPLACE FUNCTION get_project_role(p_project_id UUID)
RETURNS project_role AS $$
DECLARE
  v_role project_role;
BEGIN
  -- Check if user is the project owner
  IF EXISTS (SELECT 1 FROM public.projects WHERE id = p_project_id AND owner_id = auth.uid()) THEN
    RETURN 'lead';
  END IF;
  
  -- Check project_members table
  SELECT role INTO v_role
  FROM public.project_members
  WHERE project_id = p_project_id AND user_id = auth.uid();
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can edit project (lead or editor)
CREATE OR REPLACE FUNCTION can_edit_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role project_role;
BEGIN
  -- Global admins/owners can edit anything
  IF is_admin_or_owner() THEN
    RETURN true;
  END IF;
  
  v_role := get_project_role(p_project_id);
  RETURN v_role IN ('lead', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage project (lead only)
CREATE OR REPLACE FUNCTION can_manage_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Global admins/owners can manage anything
  IF is_admin_or_owner() THEN
    RETURN true;
  END IF;
  
  RETURN get_project_role(p_project_id) = 'lead';
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

-- New tables updated_at triggers
CREATE TRIGGER trigger_project_assets_updated_at
  BEFORE UPDATE ON public.project_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_project_contacts_updated_at
  BEFORE UPDATE ON public.project_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_commitments_updated_at
  BEFORE UPDATE ON public.commitments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------
-- USERS POLICIES
-- --------------------------------------------

CREATE POLICY "Users are viewable by everyone"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- --------------------------------------------
-- PROJECTS POLICIES
-- --------------------------------------------

CREATE POLICY "Projects are viewable by everyone"
  ON public.projects FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Project leads and editors can update projects"
  ON public.projects FOR UPDATE
  USING (can_edit_project(id))
  WITH CHECK (can_edit_project(id));

CREATE POLICY "Project leads can delete their projects"
  ON public.projects FOR DELETE
  USING (can_manage_project(id));

-- --------------------------------------------
-- UPDATES POLICIES
-- --------------------------------------------

CREATE POLICY "Updates are viewable by everyone"
  ON public.updates FOR SELECT
  USING (true);

CREATE POLICY "Project members can create updates"
  ON public.updates FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = author_id
    AND (
      is_admin_or_owner()
      OR get_project_role(project_id) IS NOT NULL
    )
  );

CREATE POLICY "Authors can update their own updates"
  ON public.updates FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own updates"
  ON public.updates FOR DELETE
  USING (
    auth.uid() = author_id
    OR is_admin_or_owner()
  );

-- --------------------------------------------
-- DECISIONS POLICIES
-- --------------------------------------------

CREATE POLICY "Decisions are viewable by everyone"
  ON public.decisions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create decisions"
  ON public.decisions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and Admins can update decisions"
  ON public.decisions FOR UPDATE
  USING (
    is_admin_or_owner()
    OR is_project_owner(project_id)
  );

CREATE POLICY "Owners and Admins can delete decisions"
  ON public.decisions FOR DELETE
  USING (is_admin_or_owner());

-- --------------------------------------------
-- PROJECT_ASSETS POLICIES
-- --------------------------------------------

CREATE POLICY "project_assets_select"
  ON public.project_assets FOR SELECT
  USING (
    is_admin_or_owner()
    OR is_public = true
    OR get_project_role(project_id) IS NOT NULL
  );

CREATE POLICY "project_assets_insert"
  ON public.project_assets FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_edit_project(project_id)
  );

CREATE POLICY "project_assets_update"
  ON public.project_assets FOR UPDATE
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

CREATE POLICY "project_assets_delete"
  ON public.project_assets FOR DELETE
  USING (can_manage_project(project_id));

-- --------------------------------------------
-- MILESTONES POLICIES
-- --------------------------------------------

CREATE POLICY "milestones_select"
  ON public.milestones FOR SELECT
  USING (
    is_admin_or_owner()
    OR get_project_role(project_id) IS NOT NULL
  );

CREATE POLICY "milestones_insert"
  ON public.milestones FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_edit_project(project_id)
  );

CREATE POLICY "milestones_update"
  ON public.milestones FOR UPDATE
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

CREATE POLICY "milestones_delete"
  ON public.milestones FOR DELETE
  USING (can_manage_project(project_id));

-- --------------------------------------------
-- TASKS POLICIES
-- --------------------------------------------

CREATE POLICY "tasks_select"
  ON public.tasks FOR SELECT
  USING (
    is_admin_or_owner()
    OR get_project_role(project_id) IS NOT NULL
  );

CREATE POLICY "tasks_insert"
  ON public.tasks FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_edit_project(project_id)
  );

CREATE POLICY "tasks_update"
  ON public.tasks FOR UPDATE
  USING (
    can_edit_project(project_id)
    OR assignee_id = auth.uid()
  )
  WITH CHECK (
    can_edit_project(project_id)
    OR assignee_id = auth.uid()
  );

CREATE POLICY "tasks_delete"
  ON public.tasks FOR DELETE
  USING (can_manage_project(project_id));

-- --------------------------------------------
-- PROJECT_CONTACTS POLICIES
-- --------------------------------------------

CREATE POLICY "project_contacts_select"
  ON public.project_contacts FOR SELECT
  USING (
    is_admin_or_owner()
    OR get_project_role(project_id) IS NOT NULL
  );

CREATE POLICY "project_contacts_insert"
  ON public.project_contacts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_edit_project(project_id)
  );

CREATE POLICY "project_contacts_update"
  ON public.project_contacts FOR UPDATE
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

CREATE POLICY "project_contacts_delete"
  ON public.project_contacts FOR DELETE
  USING (can_manage_project(project_id));

-- --------------------------------------------
-- COMMITMENTS POLICIES
-- --------------------------------------------

CREATE POLICY "commitments_select"
  ON public.commitments FOR SELECT
  USING (
    is_admin_or_owner()
    OR get_project_role(project_id) IS NOT NULL
  );

CREATE POLICY "commitments_insert"
  ON public.commitments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_manage_project(project_id)
  );

CREATE POLICY "commitments_update"
  ON public.commitments FOR UPDATE
  USING (
    is_admin_or_owner()
    OR (
      can_manage_project(project_id)
      AND requested_by = auth.uid()
      AND status = 'requested'
    )
  );

CREATE POLICY "commitments_delete"
  ON public.commitments FOR DELETE
  USING (is_admin_or_owner());

-- --------------------------------------------
-- EVENTS POLICIES
-- --------------------------------------------

CREATE POLICY "events_select"
  ON public.events FOR SELECT
  USING (
    is_admin_or_owner()
    OR get_project_role(project_id) IS NOT NULL
    OR organizer_id = auth.uid()
    OR attendees @> to_jsonb(auth.uid()::text)
  );

CREATE POLICY "events_insert"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_edit_project(project_id)
  );

CREATE POLICY "events_update"
  ON public.events FOR UPDATE
  USING (
    can_edit_project(project_id)
    OR organizer_id = auth.uid()
  )
  WITH CHECK (
    can_edit_project(project_id)
    OR organizer_id = auth.uid()
  );

CREATE POLICY "events_delete"
  ON public.events FOR DELETE
  USING (
    can_manage_project(project_id)
    OR organizer_id = auth.uid()
  );

-- --------------------------------------------
-- PROJECT_MEMBERS POLICIES
-- --------------------------------------------

CREATE POLICY "project_members_select"
  ON public.project_members FOR SELECT
  USING (
    is_admin_or_owner()
    OR can_manage_project(project_id)
    OR user_id = auth.uid()
  );

CREATE POLICY "project_members_insert"
  ON public.project_members FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_manage_project(project_id)
  );

CREATE POLICY "project_members_update"
  ON public.project_members FOR UPDATE
  USING (can_manage_project(project_id))
  WITH CHECK (can_manage_project(project_id));

CREATE POLICY "project_members_delete"
  ON public.project_members FOR DELETE
  USING (
    can_manage_project(project_id)
    OR user_id = auth.uid()
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

