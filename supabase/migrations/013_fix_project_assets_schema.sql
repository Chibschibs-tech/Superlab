-- ============================================
-- Migration: 013_fix_project_assets_schema.sql
-- Purpose: Fix project_assets table to match TypeScript interface
-- ============================================

-- 1. Rename 'url' column to 'file_url' if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'project_assets' 
    AND column_name = 'url'
  ) THEN
    ALTER TABLE public.project_assets RENAME COLUMN url TO file_url;
  END IF;
END $$;

-- 2. Add 'is_public' column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'project_assets' 
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.project_assets 
    ADD COLUMN is_public BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

-- 3. Add 'is_featured' column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'project_assets' 
    AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE public.project_assets 
    ADD COLUMN is_featured BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

-- 4. Ensure 'uploaded_by' column exists (some deployments might be missing it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'project_assets' 
    AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE public.project_assets 
    ADD COLUMN uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Create indexes for new columns if they don't exist
CREATE INDEX IF NOT EXISTS idx_project_assets_public 
ON public.project_assets(is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_project_assets_featured 
ON public.project_assets(is_featured) WHERE is_featured = true;

-- 6. Update deploy_to_supabase.sql structure comment
-- The project_assets table should now have:
-- - file_url (renamed from url)
-- - is_public (new)
-- - is_featured (new)
-- - uploaded_by (ensured)

