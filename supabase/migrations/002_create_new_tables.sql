-- ============================================
-- MIGRATION 002: Create New Tables
-- ============================================
-- This migration adds: project_assets, milestones, tasks,
-- project_contacts, commitments, and events tables

-- ============================================
-- NEW ENUMS
-- ============================================

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

-- ============================================
-- PROJECT_ASSETS TABLE
-- ============================================
-- Stores files and media associated with projects

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
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_project_assets_project ON public.project_assets(project_id);
CREATE INDEX idx_project_assets_type ON public.project_assets(type);
CREATE INDEX idx_project_assets_featured ON public.project_assets(is_featured) WHERE is_featured = true;

-- ============================================
-- MILESTONES TABLE
-- ============================================
-- Project phases and major checkpoints

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
-- Individual tasks within projects or milestones

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
  
  -- Dependencies (optional: task that must be completed first)
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
-- External contacts and stakeholders for projects

CREATE TABLE public.project_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Contact info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,                           -- Their role/title
  type contact_type NOT NULL DEFAULT 'stakeholder',
  
  -- Notes
  notes TEXT,
  
  -- Link to internal user (if applicable)
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
-- Resource commitments and pledges for projects

CREATE TABLE public.commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Commitment details
  title TEXT NOT NULL,
  description TEXT,
  type commitment_type NOT NULL,
  status commitment_status NOT NULL DEFAULT 'requested',
  
  -- Amount/value
  amount DECIMAL(12,2),                -- Monetary value if applicable
  currency TEXT DEFAULT 'EUR',
  quantity INTEGER,                     -- For headcount, equipment
  unit TEXT,                           -- 'hours', 'FTE', 'units', etc.
  
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
-- Project events, meetings, and deadlines

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Event info
  title TEXT NOT NULL,
  description TEXT,
  type event_type NOT NULL DEFAULT 'meeting',
  
  -- Location/link
  location TEXT,                       -- Physical location
  meeting_url TEXT,                    -- Video call link
  
  -- Scheduling
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  is_all_day BOOLEAN NOT NULL DEFAULT false,
  
  -- Recurrence (simple)
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,                -- iCal RRULE format
  
  -- Organizer
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Attendees (JSONB array of user IDs)
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
-- Links users to projects with specific roles

CREATE TYPE project_role AS ENUM (
  'lead',          -- Project lead (owner_id)
  'editor',        -- Can edit project content
  'viewer'         -- Read-only access
);

CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role project_role NOT NULL DEFAULT 'viewer',
  
  -- Timestamps
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Ensure unique membership
  UNIQUE(project_id, user_id)
);

-- Indexes
CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);
CREATE INDEX idx_project_members_role ON public.project_members(role);

-- ============================================
-- TRIGGERS FOR NEW TABLES
-- ============================================

-- project_assets updated_at
CREATE TRIGGER trigger_project_assets_updated_at
  BEFORE UPDATE ON public.project_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- milestones updated_at
CREATE TRIGGER trigger_milestones_updated_at
  BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- tasks updated_at
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- project_contacts updated_at
CREATE TRIGGER trigger_project_contacts_updated_at
  BEFORE UPDATE ON public.project_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- commitments updated_at
CREATE TRIGGER trigger_commitments_updated_at
  BEFORE UPDATE ON public.commitments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- events updated_at
CREATE TRIGGER trigger_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

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

-- Check if user is a project member with specific role
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

