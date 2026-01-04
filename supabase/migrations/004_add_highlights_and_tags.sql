-- ============================================
-- MIGRATION 004: Add Highlights and Asset Tags
-- ============================================

-- Add highlights column to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS highlights TEXT;

-- Add is_pinned and tags columns to project_assets table  
ALTER TABLE public.project_assets
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.project_assets
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for pinned assets
CREATE INDEX IF NOT EXISTS idx_project_assets_pinned 
ON public.project_assets(is_pinned) WHERE is_pinned = true;

-- Create GIN index for tags search
CREATE INDEX IF NOT EXISTS idx_project_assets_tags
ON public.project_assets USING GIN(tags);


