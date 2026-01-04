-- ============================================
-- MIGRATION 007: PRD Storage Policies
-- ============================================
-- Implements secure storage for project assets.
-- Bucket is PRIVATE (public=false), use signed URLs in app.
-- Path convention: "projects/<project_id>/<filename>"

-- ============================================
-- STEP 1: Create private storage bucket
-- ============================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-media',
  'project-media',
  false,  -- PRIVATE bucket
  52428800,  -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv', 'application/json']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- ============================================
-- STEP 2: Helper function to extract project_id from path
-- ============================================

-- Path convention: "projects/<project_id>/<filename>"
-- Example: "projects/123e4567-e89b-12d3-a456-426614174000/image.png"
CREATE OR REPLACE FUNCTION storage_get_project_id(object_name TEXT)
RETURNS UUID AS $$
DECLARE
  path_parts TEXT[];
  project_id_text TEXT;
BEGIN
  -- Split path by '/'
  path_parts := string_to_array(object_name, '/');
  
  -- Validate path structure
  IF array_length(path_parts, 1) < 3 THEN
    RETURN NULL;
  END IF;
  
  -- First part should be 'projects'
  IF path_parts[1] != 'projects' THEN
    RETURN NULL;
  END IF;
  
  -- Second part is project_id
  project_id_text := path_parts[2];
  
  -- Try to cast to UUID
  BEGIN
    RETURN project_id_text::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- STEP 3: Storage RLS Policies
-- ============================================

-- Drop existing storage policies for this bucket
DROP POLICY IF EXISTS "Public read access for project media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "project_media_select" ON storage.objects;
DROP POLICY IF EXISTS "project_media_insert" ON storage.objects;
DROP POLICY IF EXISTS "project_media_update" ON storage.objects;
DROP POLICY IF EXISTS "project_media_delete" ON storage.objects;

-- SELECT: admin/owner/labadmin OR project member (viewer+)
CREATE POLICY "project_media_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-media'
    AND (
      -- Global admins see all
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('Owner', 'Admin', 'LabAdmin')
      )
      OR
      -- Project members can see their project's files
      EXISTS (
        SELECT 1 FROM public.project_members
        WHERE user_id = auth.uid()
        AND project_id = storage_get_project_id(name)
      )
    )
  );

-- INSERT: editor+ for the project
CREATE POLICY "project_media_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-media'
    AND auth.uid() IS NOT NULL
    AND (
      -- Global admins can upload anywhere
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('Owner', 'Admin', 'LabAdmin')
      )
      OR
      -- Project editors/leads can upload to their projects
      EXISTS (
        SELECT 1 FROM public.project_members
        WHERE user_id = auth.uid()
        AND project_id = storage_get_project_id(name)
        AND role IN ('lead', 'editor')
      )
    )
  );

-- UPDATE: editor+ for the project
CREATE POLICY "project_media_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-media'
    AND (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('Owner', 'Admin', 'LabAdmin')
      )
      OR
      EXISTS (
        SELECT 1 FROM public.project_members
        WHERE user_id = auth.uid()
        AND project_id = storage_get_project_id(name)
        AND role IN ('lead', 'editor')
      )
    )
  )
  WITH CHECK (
    bucket_id = 'project-media'
    AND (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('Owner', 'Admin', 'LabAdmin')
      )
      OR
      EXISTS (
        SELECT 1 FROM public.project_members
        WHERE user_id = auth.uid()
        AND project_id = storage_get_project_id(name)
        AND role IN ('lead', 'editor')
      )
    )
  );

-- DELETE: editor+ for the project (leads and global admins preferred for delete)
CREATE POLICY "project_media_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-media'
    AND (
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('Owner', 'Admin', 'LabAdmin')
      )
      OR
      EXISTS (
        SELECT 1 FROM public.project_members
        WHERE user_id = auth.uid()
        AND project_id = storage_get_project_id(name)
        AND role IN ('lead', 'editor')
      )
    )
  );

-- ============================================
-- STEP 4: Grant function permissions
-- ============================================

GRANT EXECUTE ON FUNCTION storage_get_project_id(TEXT) TO authenticated;

