-- ============================================
-- MIGRATION 005: PRD Security Foundation
-- ============================================
-- Aligns schema with PRD v1 requirements:
-- - Adds LabAdmin role
-- - Adds InfoRequested decision status
-- - Adds project visibility controls
-- - Fixes highlights column type
-- - Adds needs/asks as first-class object
-- - Ensures owner is always a project member

-- ============================================
-- A) Add 'LabAdmin' to user_role enum
-- ============================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'LabAdmin' AFTER 'Admin';

-- ============================================
-- B) Add 'InfoRequested' to decision_status enum
-- ============================================
ALTER TYPE decision_status ADD VALUE IF NOT EXISTS 'InfoRequested' AFTER 'Pending';

-- ============================================
-- C) Project visibility without project_acl
-- ============================================
DO $$ BEGIN
  CREATE TYPE project_visibility AS ENUM ('Private', 'Org');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS visibility project_visibility NOT NULL DEFAULT 'Private';

CREATE INDEX IF NOT EXISTS idx_projects_visibility ON public.projects(visibility);

-- ============================================
-- D) Add tags to projects
-- ============================================
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_projects_tags ON public.projects USING GIN(tags);

-- ============================================
-- E) Fix highlights column (TEXT -> JSONB)
-- ============================================
-- Step 1: Rename existing TEXT column if it exists
DO $$ 
BEGIN
  -- Check if highlights column exists and is TEXT type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'highlights'
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.projects RENAME COLUMN highlights TO highlights_text;
  END IF;
END $$;

-- Step 2: Add new JSONB highlights column if it doesn't exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS highlights JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Step 3: Migrate data from highlights_text to highlights JSONB (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'projects' 
    AND column_name = 'highlights_text'
  ) THEN
    UPDATE public.projects 
    SET highlights = CASE 
      WHEN highlights_text IS NOT NULL AND highlights_text != '' 
      THEN to_jsonb(string_to_array(highlights_text, E'\n'))
      ELSE '[]'::jsonb
    END
    WHERE highlights = '[]'::jsonb;
  END IF;
END $$;

-- ============================================
-- F) Ensure project owner is always a member
-- ============================================

-- Function to auto-add owner as lead member
CREATE OR REPLACE FUNCTION ensure_owner_is_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert owner as lead member (upsert)
  INSERT INTO public.project_members (project_id, user_id, role, added_by)
  VALUES (NEW.id, NEW.owner_id, 'lead', NEW.owner_id)
  ON CONFLICT (project_id, user_id) 
  DO UPDATE SET role = 'lead';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on project insert
DROP TRIGGER IF EXISTS trigger_ensure_owner_is_member ON public.projects;
CREATE TRIGGER trigger_ensure_owner_is_member
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION ensure_owner_is_member();

-- Trigger on owner_id update
CREATE OR REPLACE FUNCTION ensure_new_owner_is_member()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
    -- Add new owner as lead
    INSERT INTO public.project_members (project_id, user_id, role, added_by)
    VALUES (NEW.id, NEW.owner_id, 'lead', NEW.owner_id)
    ON CONFLICT (project_id, user_id) 
    DO UPDATE SET role = 'lead';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_ensure_new_owner_is_member ON public.projects;
CREATE TRIGGER trigger_ensure_new_owner_is_member
  AFTER UPDATE OF owner_id ON public.projects
  FOR EACH ROW EXECUTE FUNCTION ensure_new_owner_is_member();

-- Backfill: insert missing owner memberships for existing projects
INSERT INTO public.project_members (project_id, user_id, role, added_by)
SELECT p.id, p.owner_id, 'lead', p.owner_id
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.project_members pm 
  WHERE pm.project_id = p.id AND pm.user_id = p.owner_id
)
ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'lead';

-- ============================================
-- G) Add PRD "Needs" as first-class object
-- ============================================

-- Need type enum
DO $$ BEGIN
  CREATE TYPE need_type AS ENUM ('Budget', 'Intro', 'Supplier', 'Legal', 'Hiring', 'Other');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Need status enum
DO $$ BEGIN
  CREATE TYPE need_status AS ENUM ('Open', 'InReview', 'Fulfilled', 'Rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Needs table
CREATE TABLE IF NOT EXISTS public.needs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Need details
  title TEXT NOT NULL,
  description TEXT,
  type need_type NOT NULL DEFAULT 'Other',
  status need_status NOT NULL DEFAULT 'Open',
  urgency INTEGER NOT NULL DEFAULT 3 CHECK (urgency >= 1 AND urgency <= 5),
  
  -- Deadline
  deadline DATE,
  
  -- Linking
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  decision_id UUID REFERENCES public.decisions(id) ON DELETE SET NULL,
  
  -- Tracking
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  fulfilled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  fulfilled_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for needs
CREATE INDEX IF NOT EXISTS idx_needs_project ON public.needs(project_id);
CREATE INDEX IF NOT EXISTS idx_needs_status ON public.needs(status);
CREATE INDEX IF NOT EXISTS idx_needs_type ON public.needs(type);
CREATE INDEX IF NOT EXISTS idx_needs_urgency ON public.needs(urgency DESC);
CREATE INDEX IF NOT EXISTS idx_needs_deadline ON public.needs(deadline);
CREATE INDEX IF NOT EXISTS idx_needs_milestone ON public.needs(milestone_id);
CREATE INDEX IF NOT EXISTS idx_needs_decision ON public.needs(decision_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_needs_updated_at ON public.needs;
CREATE TRIGGER trigger_needs_updated_at
  BEFORE UPDATE ON public.needs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS on needs (policies in 006)
ALTER TABLE public.needs ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT USAGE ON TYPE need_type TO authenticated;
GRANT USAGE ON TYPE need_status TO authenticated;
GRANT USAGE ON TYPE project_visibility TO authenticated;
GRANT ALL ON public.needs TO authenticated;

