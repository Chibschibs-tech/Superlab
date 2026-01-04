-- ============================================
-- MIGRATION 006: PRD RLS Overhaul
-- ============================================
-- Replaces all public SELECT policies with authenticated membership-based access.
-- No table should be publicly accessible.
-- Rewrites helper functions to avoid circular dependencies.

-- ============================================
-- STEP 1: Rewrite helper functions
-- ============================================
-- These functions avoid querying projects table in authorization checks.
-- Owner is now always a member via trigger, so we only check project_members.

-- Check if user has global admin/owner/labadmin role
CREATE OR REPLACE FUNCTION is_admin_or_owner()
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN v_role IN ('Owner', 'Admin', 'LabAdmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user has decision approval rights (Owner/Admin/LabAdmin only)
CREATE OR REPLACE FUNCTION can_approve_decisions()
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN v_role IN ('Owner', 'Admin', 'LabAdmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get user's role on a project (from project_members ONLY)
-- Owner is already inserted as lead via trigger, no need to check projects.owner_id
CREATE OR REPLACE FUNCTION get_project_role(p_project_id UUID)
RETURNS project_role AS $$
DECLARE
  v_role project_role;
BEGIN
  SELECT role INTO v_role
  FROM public.project_members
  WHERE project_id = p_project_id AND user_id = auth.uid();
  
  RETURN v_role;  -- Returns NULL if not a member
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user is a project member (any role)
CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user can view project (member or org-visible)
CREATE OR REPLACE FUNCTION can_view_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_visibility project_visibility;
  v_user_role user_role;
BEGIN
  -- Global admins can see everything
  IF is_admin_or_owner() THEN
    RETURN true;
  END IF;
  
  -- Project members can see their projects
  IF is_project_member(p_project_id) THEN
    RETURN true;
  END IF;
  
  -- Check org visibility for non-viewers
  SELECT visibility INTO v_visibility FROM public.projects WHERE id = p_project_id;
  SELECT role INTO v_user_role FROM public.users WHERE id = auth.uid();
  
  -- Org-visible projects accessible to non-Viewer users
  IF v_visibility = 'Org' AND v_user_role IS NOT NULL AND v_user_role != 'Viewer' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user can edit project (editor+ or global admin)
CREATE OR REPLACE FUNCTION can_edit_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role project_role;
BEGIN
  -- Global admins can edit anything
  IF is_admin_or_owner() THEN
    RETURN true;
  END IF;
  
  v_role := get_project_role(p_project_id);
  RETURN v_role IN ('lead', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user can manage project (lead or global admin)
CREATE OR REPLACE FUNCTION can_manage_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Global admins can manage anything
  IF is_admin_or_owner() THEN
    RETURN true;
  END IF;
  
  RETURN get_project_role(p_project_id) = 'lead';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper: is_project_owner is no longer needed (use get_project_role = 'lead')
DROP FUNCTION IF EXISTS is_project_owner(UUID);

-- ============================================
-- STEP 2: Drop ALL existing policies
-- ============================================

-- Users policies
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Projects policies
DROP POLICY IF EXISTS "Projects are viewable by everyone" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project leads and editors can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project owners can update their projects" ON public.projects;
DROP POLICY IF EXISTS "Project leads can delete their projects" ON public.projects;

-- Updates policies
DROP POLICY IF EXISTS "Updates are viewable by everyone" ON public.updates;
DROP POLICY IF EXISTS "Project members can create updates" ON public.updates;
DROP POLICY IF EXISTS "Authenticated users can create updates" ON public.updates;
DROP POLICY IF EXISTS "Authors can update their own updates" ON public.updates;
DROP POLICY IF EXISTS "Authors can delete their own updates" ON public.updates;

-- Decisions policies
DROP POLICY IF EXISTS "Decisions are viewable by everyone" ON public.decisions;
DROP POLICY IF EXISTS "Authenticated users can create decisions" ON public.decisions;
DROP POLICY IF EXISTS "Owners and Admins can update decisions" ON public.decisions;
DROP POLICY IF EXISTS "Owners and Admins can delete decisions" ON public.decisions;

-- Project assets policies
DROP POLICY IF EXISTS "project_assets_select" ON public.project_assets;
DROP POLICY IF EXISTS "project_assets_insert" ON public.project_assets;
DROP POLICY IF EXISTS "project_assets_update" ON public.project_assets;
DROP POLICY IF EXISTS "project_assets_delete" ON public.project_assets;

-- Milestones policies
DROP POLICY IF EXISTS "milestones_select" ON public.milestones;
DROP POLICY IF EXISTS "milestones_insert" ON public.milestones;
DROP POLICY IF EXISTS "milestones_update" ON public.milestones;
DROP POLICY IF EXISTS "milestones_delete" ON public.milestones;

-- Tasks policies
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;

-- Project contacts policies
DROP POLICY IF EXISTS "project_contacts_select" ON public.project_contacts;
DROP POLICY IF EXISTS "project_contacts_insert" ON public.project_contacts;
DROP POLICY IF EXISTS "project_contacts_update" ON public.project_contacts;
DROP POLICY IF EXISTS "project_contacts_delete" ON public.project_contacts;

-- Commitments policies
DROP POLICY IF EXISTS "commitments_select" ON public.commitments;
DROP POLICY IF EXISTS "commitments_insert" ON public.commitments;
DROP POLICY IF EXISTS "commitments_update" ON public.commitments;
DROP POLICY IF EXISTS "commitments_delete" ON public.commitments;

-- Events policies
DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;

-- Project members policies
DROP POLICY IF EXISTS "project_members_select" ON public.project_members;
DROP POLICY IF EXISTS "project_members_insert" ON public.project_members;
DROP POLICY IF EXISTS "project_members_update" ON public.project_members;
DROP POLICY IF EXISTS "project_members_delete" ON public.project_members;

-- ============================================
-- STEP 3: Create new restrictive policies
-- ============================================

-- --------------------------------------------
-- USERS POLICIES (Internal app only)
-- --------------------------------------------

CREATE POLICY "users_select_authenticated"
  ON public.users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only admins can update other users' roles
CREATE POLICY "users_update_admin"
  ON public.users FOR UPDATE
  USING (is_admin_or_owner() AND auth.uid() != id)
  WITH CHECK (is_admin_or_owner());

-- --------------------------------------------
-- PROJECTS POLICIES
-- --------------------------------------------

-- SELECT: admin/owner OR member OR (org-visible AND non-viewer)
CREATE POLICY "projects_select"
  ON public.projects FOR SELECT
  USING (can_view_project(id));

-- INSERT: any authenticated user can create projects
CREATE POLICY "projects_insert"
  ON public.projects FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = owner_id  -- Must be creating as owner
  );

-- UPDATE: editor+ or global admin
CREATE POLICY "projects_update"
  ON public.projects FOR UPDATE
  USING (can_edit_project(id))
  WITH CHECK (can_edit_project(id));

-- DELETE: lead or global admin
CREATE POLICY "projects_delete"
  ON public.projects FOR DELETE
  USING (can_manage_project(id));

-- --------------------------------------------
-- UPDATES POLICIES
-- --------------------------------------------

CREATE POLICY "updates_select"
  ON public.updates FOR SELECT
  USING (
    is_admin_or_owner()
    OR is_project_member(project_id)
  );

CREATE POLICY "updates_insert"
  ON public.updates FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = author_id
    AND can_edit_project(project_id)
  );

CREATE POLICY "updates_update"
  ON public.updates FOR UPDATE
  USING (auth.uid() = author_id OR is_admin_or_owner())
  WITH CHECK (auth.uid() = author_id OR is_admin_or_owner());

CREATE POLICY "updates_delete"
  ON public.updates FOR DELETE
  USING (
    auth.uid() = author_id
    OR can_manage_project(project_id)
  );

-- --------------------------------------------
-- DECISIONS POLICIES
-- --------------------------------------------

CREATE POLICY "decisions_select"
  ON public.decisions FOR SELECT
  USING (
    is_admin_or_owner()
    OR is_project_member(project_id)
  );

-- Project leads/editors can create decision requests
CREATE POLICY "decisions_insert"
  ON public.decisions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_edit_project(project_id)
  );

-- Only Owner/Admin/LabAdmin can approve/reject decisions
CREATE POLICY "decisions_update"
  ON public.decisions FOR UPDATE
  USING (can_approve_decisions())
  WITH CHECK (can_approve_decisions());

CREATE POLICY "decisions_delete"
  ON public.decisions FOR DELETE
  USING (can_approve_decisions());

-- --------------------------------------------
-- PROJECT_ASSETS POLICIES
-- --------------------------------------------

CREATE POLICY "project_assets_select"
  ON public.project_assets FOR SELECT
  USING (
    is_admin_or_owner()
    OR is_project_member(project_id)
  );

CREATE POLICY "project_assets_insert"
  ON public.project_assets FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = uploaded_by
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
    OR is_project_member(project_id)
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
    OR is_project_member(project_id)
  );

CREATE POLICY "tasks_insert"
  ON public.tasks FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND can_edit_project(project_id)
  );

-- Editors+ can update, OR assignees can update their own tasks
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
    OR is_project_member(project_id)
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
    OR is_project_member(project_id)
  );

-- Only leads can request commitments
CREATE POLICY "commitments_insert"
  ON public.commitments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = requested_by
    AND can_manage_project(project_id)
  );

-- Approval by global admins, or requester can update pending
CREATE POLICY "commitments_update"
  ON public.commitments FOR UPDATE
  USING (
    can_approve_decisions()  -- Owners/Admins/LabAdmins can approve
    OR (
      requested_by = auth.uid()
      AND status = 'requested'
      AND can_manage_project(project_id)
    )
  )
  WITH CHECK (
    can_approve_decisions()
    OR (
      requested_by = auth.uid()
      AND status = 'requested'
    )
  );

CREATE POLICY "commitments_delete"
  ON public.commitments FOR DELETE
  USING (can_approve_decisions());

-- --------------------------------------------
-- EVENTS POLICIES
-- --------------------------------------------

CREATE POLICY "events_select"
  ON public.events FOR SELECT
  USING (
    is_admin_or_owner()
    OR is_project_member(project_id)
    OR organizer_id = auth.uid()
    OR attendees @> to_jsonb(auth.uid()::text)
  );

CREATE POLICY "events_insert"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = organizer_id
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
    OR user_id = auth.uid()  -- Users can leave projects
  );

-- --------------------------------------------
-- NEEDS POLICIES (new table from 005)
-- --------------------------------------------

CREATE POLICY "needs_select"
  ON public.needs FOR SELECT
  USING (
    is_admin_or_owner()
    OR is_project_member(project_id)
  );

CREATE POLICY "needs_insert"
  ON public.needs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = created_by
    AND can_edit_project(project_id)
  );

CREATE POLICY "needs_update"
  ON public.needs FOR UPDATE
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

CREATE POLICY "needs_delete"
  ON public.needs FOR DELETE
  USING (can_manage_project(project_id));

-- ============================================
-- STEP 4: Grant permissions
-- ============================================

GRANT EXECUTE ON FUNCTION is_admin_or_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION can_approve_decisions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_project_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_edit_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_manage_project(UUID) TO authenticated;

