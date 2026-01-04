-- ============================================
-- MIGRATION 003: Add RLS Policies
-- ============================================
-- Row Level Security policies for all new tables
-- 
-- Access Levels:
-- - Owner (global): Full read access to everything
-- - Admin (global): Full read/write access
-- - Project Lead: Full access to their own projects
-- - Editor: Can edit content on assigned projects
-- - Viewer: Read-only access to assigned projects

-- Enable RLS on all new tables
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROJECT_ASSETS POLICIES
-- ============================================

-- SELECT: Global Owners see all, others see their projects' assets
CREATE POLICY "project_assets_select"
  ON public.project_assets FOR SELECT
  USING (
    -- Global owners/admins see everything
    is_admin_or_owner()
    -- Public assets visible to all
    OR is_public = true
    -- Project members can see their project assets
    OR get_project_role(project_id) IS NOT NULL
  );

-- INSERT: Project leads and editors can add assets
CREATE POLICY "project_assets_insert"
  ON public.project_assets FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_edit_project(project_id)
  );

-- UPDATE: Project leads and editors can update assets
CREATE POLICY "project_assets_update"
  ON public.project_assets FOR UPDATE
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

-- DELETE: Only project leads can delete assets
CREATE POLICY "project_assets_delete"
  ON public.project_assets FOR DELETE
  USING (can_manage_project(project_id));

-- ============================================
-- MILESTONES POLICIES
-- ============================================

-- SELECT: Visible to project members and global admins
CREATE POLICY "milestones_select"
  ON public.milestones FOR SELECT
  USING (
    is_admin_or_owner()
    OR get_project_role(project_id) IS NOT NULL
  );

-- INSERT: Project leads and editors can create milestones
CREATE POLICY "milestones_insert"
  ON public.milestones FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_edit_project(project_id)
  );

-- UPDATE: Project leads and editors can update milestones
CREATE POLICY "milestones_update"
  ON public.milestones FOR UPDATE
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

-- DELETE: Only project leads can delete milestones
CREATE POLICY "milestones_delete"
  ON public.milestones FOR DELETE
  USING (can_manage_project(project_id));

-- ============================================
-- TASKS POLICIES
-- ============================================

-- SELECT: Visible to project members and global admins
CREATE POLICY "tasks_select"
  ON public.tasks FOR SELECT
  USING (
    is_admin_or_owner()
    OR get_project_role(project_id) IS NOT NULL
  );

-- INSERT: Project leads and editors can create tasks
CREATE POLICY "tasks_insert"
  ON public.tasks FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_edit_project(project_id)
  );

-- UPDATE: Project leads, editors, and assignees can update tasks
CREATE POLICY "tasks_update"
  ON public.tasks FOR UPDATE
  USING (
    can_edit_project(project_id)
    OR assignee_id = auth.uid()  -- Assignees can update their tasks
  )
  WITH CHECK (
    can_edit_project(project_id)
    OR assignee_id = auth.uid()
  );

-- DELETE: Only project leads can delete tasks
CREATE POLICY "tasks_delete"
  ON public.tasks FOR DELETE
  USING (can_manage_project(project_id));

-- ============================================
-- PROJECT_CONTACTS POLICIES
-- ============================================

-- SELECT: Visible to project members and global admins
CREATE POLICY "project_contacts_select"
  ON public.project_contacts FOR SELECT
  USING (
    is_admin_or_owner()
    OR get_project_role(project_id) IS NOT NULL
  );

-- INSERT: Project leads and editors can add contacts
CREATE POLICY "project_contacts_insert"
  ON public.project_contacts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_edit_project(project_id)
  );

-- UPDATE: Project leads and editors can update contacts
CREATE POLICY "project_contacts_update"
  ON public.project_contacts FOR UPDATE
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

-- DELETE: Only project leads can delete contacts
CREATE POLICY "project_contacts_delete"
  ON public.project_contacts FOR DELETE
  USING (can_manage_project(project_id));

-- ============================================
-- COMMITMENTS POLICIES
-- ============================================

-- SELECT: Visible to project members and global admins
CREATE POLICY "commitments_select"
  ON public.commitments FOR SELECT
  USING (
    is_admin_or_owner()
    OR get_project_role(project_id) IS NOT NULL
  );

-- INSERT: Project leads can request commitments
CREATE POLICY "commitments_insert"
  ON public.commitments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_manage_project(project_id)  -- Only leads can request resources
  );

-- UPDATE: Global owners/admins approve, project leads can update their requests
CREATE POLICY "commitments_update"
  ON public.commitments FOR UPDATE
  USING (
    is_admin_or_owner()  -- Owners/Admins can approve
    OR (
      can_manage_project(project_id)
      AND requested_by = auth.uid()  -- Requesters can update their own pending requests
      AND status = 'requested'
    )
  );

-- DELETE: Only global owners/admins can delete commitments
CREATE POLICY "commitments_delete"
  ON public.commitments FOR DELETE
  USING (is_admin_or_owner());

-- ============================================
-- EVENTS POLICIES
-- ============================================

-- SELECT: Visible to project members, attendees, and global admins
CREATE POLICY "events_select"
  ON public.events FOR SELECT
  USING (
    is_admin_or_owner()
    OR get_project_role(project_id) IS NOT NULL
    OR organizer_id = auth.uid()
    OR attendees @> to_jsonb(auth.uid()::text)  -- User is an attendee
  );

-- INSERT: Project leads and editors can create events
CREATE POLICY "events_insert"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_edit_project(project_id)
  );

-- UPDATE: Organizers, project leads, and editors can update events
CREATE POLICY "events_update"
  ON public.events FOR UPDATE
  USING (
    can_edit_project(project_id)
    OR organizer_id = auth.uid()  -- Organizers can update their events
  )
  WITH CHECK (
    can_edit_project(project_id)
    OR organizer_id = auth.uid()
  );

-- DELETE: Organizers and project leads can delete events
CREATE POLICY "events_delete"
  ON public.events FOR DELETE
  USING (
    can_manage_project(project_id)
    OR organizer_id = auth.uid()
  );

-- ============================================
-- PROJECT_MEMBERS POLICIES
-- ============================================

-- SELECT: Project leads and global admins can see members
CREATE POLICY "project_members_select"
  ON public.project_members FOR SELECT
  USING (
    is_admin_or_owner()
    OR can_manage_project(project_id)
    OR user_id = auth.uid()  -- Users can see their own memberships
  );

-- INSERT: Only project leads can add members
CREATE POLICY "project_members_insert"
  ON public.project_members FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_manage_project(project_id)
  );

-- UPDATE: Only project leads can change member roles
CREATE POLICY "project_members_update"
  ON public.project_members FOR UPDATE
  USING (can_manage_project(project_id))
  WITH CHECK (can_manage_project(project_id));

-- DELETE: Project leads can remove members
CREATE POLICY "project_members_delete"
  ON public.project_members FOR DELETE
  USING (
    can_manage_project(project_id)
    OR user_id = auth.uid()  -- Users can leave projects
  );

-- ============================================
-- UPDATE EXISTING POLICIES (if needed)
-- ============================================

-- Add Editors to projects update policy
DROP POLICY IF EXISTS "Project owners can update their projects" ON public.projects;
CREATE POLICY "Project leads and editors can update projects"
  ON public.projects FOR UPDATE
  USING (can_edit_project(id))
  WITH CHECK (can_edit_project(id));

-- Add Editors to updates insert policy
DROP POLICY IF EXISTS "Authenticated users can create updates" ON public.updates;
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

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on new types to authenticated users
GRANT USAGE ON TYPE asset_type TO authenticated;
GRANT USAGE ON TYPE task_status TO authenticated;
GRANT USAGE ON TYPE task_priority TO authenticated;
GRANT USAGE ON TYPE milestone_status TO authenticated;
GRANT USAGE ON TYPE contact_type TO authenticated;
GRANT USAGE ON TYPE commitment_type TO authenticated;
GRANT USAGE ON TYPE commitment_status TO authenticated;
GRANT USAGE ON TYPE event_type TO authenticated;
GRANT USAGE ON TYPE project_role TO authenticated;

-- Grant table permissions
GRANT ALL ON public.project_assets TO authenticated;
GRANT ALL ON public.milestones TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.project_contacts TO authenticated;
GRANT ALL ON public.commitments TO authenticated;
GRANT ALL ON public.events TO authenticated;
GRANT ALL ON public.project_members TO authenticated;

-- Grant sequence permissions (for id generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

