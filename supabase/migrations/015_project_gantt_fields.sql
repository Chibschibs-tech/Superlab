-- ============================================
-- Migration: 015_project_gantt_fields.sql
-- Purpose: Add fields required for Project Control Tower and Gantt view
-- ============================================

-- ============================================
-- 1. PROJECTS TABLE - Add launch_date and budget fields
-- ============================================

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS launch_date DATE,
ADD COLUMN IF NOT EXISTS budget_total NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS budget_used NUMERIC(12,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_projects_launch_date ON public.projects(launch_date);

-- ============================================
-- 2. MILESTONES TABLE - Add order_index and ensure start_date exists
-- ============================================

-- Check if start_date exists, add if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'milestones' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.milestones ADD COLUMN start_date DATE;
  END IF;
END $$;

-- Add end_date as alias reference (use due_date as end_date)
-- Rename due_date to end_date for clarity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'milestones' 
    AND column_name = 'due_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'milestones' 
    AND column_name = 'end_date'
  ) THEN
    ALTER TABLE public.milestones RENAME COLUMN due_date TO end_date;
  END IF;
END $$;

-- Add order_index if not exists
ALTER TABLE public.milestones 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Update existing milestones to have sequential order_index based on end_date
UPDATE public.milestones m
SET order_index = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY 
    COALESCE(end_date, '9999-12-31'), created_at
  ) as rn
  FROM public.milestones
) sub
WHERE m.id = sub.id AND m.order_index = 0;

CREATE INDEX IF NOT EXISTS idx_milestones_order ON public.milestones(project_id, order_index);

-- ============================================
-- 3. TASKS TABLE - Add start_date, order_index, and points
-- ============================================

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS points INTEGER;

-- Update existing tasks to have sequential order_index
UPDATE public.tasks t
SET order_index = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id, milestone_id ORDER BY 
    COALESCE(due_date, '9999-12-31'), created_at
  ) as rn
  FROM public.tasks
) sub
WHERE t.id = sub.id AND t.order_index = 0;

CREATE INDEX IF NOT EXISTS idx_tasks_order ON public.tasks(project_id, milestone_id, order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_dates ON public.tasks(start_date, due_date);

-- ============================================
-- 4. Add comments for documentation
-- ============================================

COMMENT ON COLUMN public.projects.launch_date IS 'Target launch date for the project';
COMMENT ON COLUMN public.projects.budget_total IS 'Total approved budget for the project';
COMMENT ON COLUMN public.projects.budget_used IS 'Budget spent so far (derived from commitments or manual)';
COMMENT ON COLUMN public.milestones.order_index IS 'Display order within the project roadmap';
COMMENT ON COLUMN public.milestones.start_date IS 'When work on this milestone begins';
COMMENT ON COLUMN public.tasks.order_index IS 'Display order within the milestone';
COMMENT ON COLUMN public.tasks.start_date IS 'When work on this task begins';
COMMENT ON COLUMN public.tasks.points IS 'Story points or effort estimate';

