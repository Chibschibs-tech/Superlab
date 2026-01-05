-- ============================================
-- Migration: 016_rls_security_alignment.sql
-- Purpose: Align RLS with product vision
-- A) Revenue visible to all, edit restricted
-- B) Users table privacy
-- C) Project assets security
-- D) Restrict project creation to specific roles
-- E) Consistency hardening for all project tables
-- ============================================

-- ============================================
-- A) REVENUE ACCESS - Split functions
-- ============================================

-- First drop ALL revenue policies that depend on has_revenue_access()
DROP POLICY IF EXISTS "revenue_streams_select" ON public.revenue_streams;
DROP POLICY IF EXISTS "revenue_streams_insert" ON public.revenue_streams;
DROP POLICY IF EXISTS "revenue_streams_update" ON public.revenue_streams;
DROP POLICY IF EXISTS "revenue_streams_delete" ON public.revenue_streams;
DROP POLICY IF EXISTS "revenue_sources_select" ON public.revenue_sources;
DROP POLICY IF EXISTS "revenue_sources_insert" ON public.revenue_sources;
DROP POLICY IF EXISTS "revenue_sources_update" ON public.revenue_sources;
DROP POLICY IF EXISTS "revenue_sources_delete" ON public.revenue_sources;
DROP POLICY IF EXISTS "revenue_entries_select" ON public.revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_insert" ON public.revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_update" ON public.revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_delete" ON public.revenue_entries;
DROP POLICY IF EXISTS "revenue_targets_select" ON public.revenue_targets;
DROP POLICY IF EXISTS "revenue_targets_insert" ON public.revenue_targets;
DROP POLICY IF EXISTS "revenue_targets_update" ON public.revenue_targets;
DROP POLICY IF EXISTS "revenue_targets_delete" ON public.revenue_targets;
DROP POLICY IF EXISTS "sync_runs_select" ON public.sync_runs;
DROP POLICY IF EXISTS "sync_runs_insert" ON public.sync_runs;
DROP POLICY IF EXISTS "sync_runs_update" ON public.sync_runs;
DROP POLICY IF EXISTS "sync_runs_delete" ON public.sync_runs;

-- Now safe to drop the old function
DROP FUNCTION IF EXISTS has_revenue_access();

-- can_view_revenue: Any authenticated user
CREATE OR REPLACE FUNCTION can_view_revenue()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION can_view_revenue() TO authenticated;

-- can_edit_revenue: Only Owner/Admin/LabAdmin
CREATE OR REPLACE FUNCTION can_edit_revenue()
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

GRANT EXECUTE ON FUNCTION can_edit_revenue() TO authenticated;

-- Drop and recreate all revenue policies

-- REVENUE_STREAMS
DROP POLICY IF EXISTS "revenue_streams_select" ON public.revenue_streams;
DROP POLICY IF EXISTS "revenue_streams_insert" ON public.revenue_streams;
DROP POLICY IF EXISTS "revenue_streams_update" ON public.revenue_streams;
DROP POLICY IF EXISTS "revenue_streams_delete" ON public.revenue_streams;

CREATE POLICY "revenue_streams_select"
  ON public.revenue_streams FOR SELECT
  USING (can_view_revenue());

CREATE POLICY "revenue_streams_insert"
  ON public.revenue_streams FOR INSERT
  WITH CHECK (can_edit_revenue());

CREATE POLICY "revenue_streams_update"
  ON public.revenue_streams FOR UPDATE
  USING (can_edit_revenue())
  WITH CHECK (can_edit_revenue());

CREATE POLICY "revenue_streams_delete"
  ON public.revenue_streams FOR DELETE
  USING (can_edit_revenue());

-- REVENUE_SOURCES
DROP POLICY IF EXISTS "revenue_sources_select" ON public.revenue_sources;
DROP POLICY IF EXISTS "revenue_sources_insert" ON public.revenue_sources;
DROP POLICY IF EXISTS "revenue_sources_update" ON public.revenue_sources;
DROP POLICY IF EXISTS "revenue_sources_delete" ON public.revenue_sources;

CREATE POLICY "revenue_sources_select"
  ON public.revenue_sources FOR SELECT
  USING (can_view_revenue());

CREATE POLICY "revenue_sources_insert"
  ON public.revenue_sources FOR INSERT
  WITH CHECK (can_edit_revenue());

CREATE POLICY "revenue_sources_update"
  ON public.revenue_sources FOR UPDATE
  USING (can_edit_revenue())
  WITH CHECK (can_edit_revenue());

CREATE POLICY "revenue_sources_delete"
  ON public.revenue_sources FOR DELETE
  USING (can_edit_revenue());

-- REVENUE_ENTRIES
DROP POLICY IF EXISTS "revenue_entries_select" ON public.revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_insert" ON public.revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_update" ON public.revenue_entries;
DROP POLICY IF EXISTS "revenue_entries_delete" ON public.revenue_entries;

CREATE POLICY "revenue_entries_select"
  ON public.revenue_entries FOR SELECT
  USING (can_view_revenue());

CREATE POLICY "revenue_entries_insert"
  ON public.revenue_entries FOR INSERT
  WITH CHECK (can_edit_revenue());

CREATE POLICY "revenue_entries_update"
  ON public.revenue_entries FOR UPDATE
  USING (can_edit_revenue())
  WITH CHECK (can_edit_revenue());

CREATE POLICY "revenue_entries_delete"
  ON public.revenue_entries FOR DELETE
  USING (can_edit_revenue());

-- REVENUE_TARGETS
DROP POLICY IF EXISTS "revenue_targets_select" ON public.revenue_targets;
DROP POLICY IF EXISTS "revenue_targets_insert" ON public.revenue_targets;
DROP POLICY IF EXISTS "revenue_targets_update" ON public.revenue_targets;
DROP POLICY IF EXISTS "revenue_targets_delete" ON public.revenue_targets;

CREATE POLICY "revenue_targets_select"
  ON public.revenue_targets FOR SELECT
  USING (can_view_revenue());

CREATE POLICY "revenue_targets_insert"
  ON public.revenue_targets FOR INSERT
  WITH CHECK (can_edit_revenue());

CREATE POLICY "revenue_targets_update"
  ON public.revenue_targets FOR UPDATE
  USING (can_edit_revenue())
  WITH CHECK (can_edit_revenue());

CREATE POLICY "revenue_targets_delete"
  ON public.revenue_targets FOR DELETE
  USING (can_edit_revenue());

-- SYNC_RUNS
DROP POLICY IF EXISTS "sync_runs_select" ON public.sync_runs;
DROP POLICY IF EXISTS "sync_runs_insert" ON public.sync_runs;
DROP POLICY IF EXISTS "sync_runs_update" ON public.sync_runs;
DROP POLICY IF EXISTS "sync_runs_delete" ON public.sync_runs;

CREATE POLICY "sync_runs_select"
  ON public.sync_runs FOR SELECT
  USING (can_view_revenue());

CREATE POLICY "sync_runs_insert"
  ON public.sync_runs FOR INSERT
  WITH CHECK (can_edit_revenue());

CREATE POLICY "sync_runs_update"
  ON public.sync_runs FOR UPDATE
  USING (can_edit_revenue())
  WITH CHECK (can_edit_revenue());

CREATE POLICY "sync_runs_delete"
  ON public.sync_runs FOR DELETE
  USING (can_edit_revenue());

-- ============================================
-- B) FIX USERS TABLE PRIVACY
-- ============================================

-- Drop existing user policies
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;

-- Users SELECT: Allow self OR Owner/Admin/LabAdmin
CREATE POLICY "users_select"
  ON public.users FOR SELECT
  USING (
    id = auth.uid()
    OR is_admin_or_owner()
  );

-- Users UPDATE: self can update safe fields (name, avatar)
-- Admins can update any fields including role
CREATE POLICY "users_update_self"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_admin"
  ON public.users FOR UPDATE
  USING (is_admin_or_owner() AND auth.uid() != id)
  WITH CHECK (is_admin_or_owner());

-- ============================================
-- C) FIX PROJECT_ASSETS SECURITY
-- ============================================

-- Update can_view_project to handle is_public assets
CREATE OR REPLACE FUNCTION can_view_project(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_visibility project_visibility;
BEGIN
  -- Global admins can see everything
  IF is_admin_or_owner() THEN
    RETURN true;
  END IF;
  
  -- Project members can see their projects
  IF is_project_member(p_project_id) THEN
    RETURN true;
  END IF;
  
  -- Check org visibility for authenticated users
  SELECT visibility INTO v_visibility FROM public.projects WHERE id = p_project_id;
  
  -- Org-visible projects accessible to any authenticated user
  IF v_visibility = 'Org' AND auth.uid() IS NOT NULL THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop and recreate project_assets policies
DROP POLICY IF EXISTS "project_assets_select" ON public.project_assets;
DROP POLICY IF EXISTS "project_assets_insert" ON public.project_assets;
DROP POLICY IF EXISTS "project_assets_update" ON public.project_assets;
DROP POLICY IF EXISTS "project_assets_delete" ON public.project_assets;

CREATE POLICY "project_assets_select"
  ON public.project_assets FOR SELECT
  USING (
    can_view_project(project_id)
    OR is_public = true  -- Public assets visible to any authenticated user
  );

CREATE POLICY "project_assets_insert"
  ON public.project_assets FOR INSERT
  WITH CHECK (can_edit_project(project_id));

CREATE POLICY "project_assets_update"
  ON public.project_assets FOR UPDATE
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

CREATE POLICY "project_assets_delete"
  ON public.project_assets FOR DELETE
  USING (can_edit_project(project_id));

-- ============================================
-- D) RESTRICT PROJECT CREATION
-- ============================================

-- Helper function to check if user can create projects
CREATE OR REPLACE FUNCTION can_create_projects()
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN v_role IN ('Owner', 'Admin', 'LabAdmin', 'Editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION can_create_projects() TO authenticated;

-- Drop and recreate projects INSERT policy
DROP POLICY IF EXISTS "projects_insert" ON public.projects;

CREATE POLICY "projects_insert"
  ON public.projects FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = owner_id  -- Must be creating as owner
    AND can_create_projects()  -- Must have appropriate global role
  );

-- ============================================
-- E) CONSISTENCY HARDENING - All project tables
-- ============================================

-- MILESTONES
DROP POLICY IF EXISTS "milestones_select" ON public.milestones;
DROP POLICY IF EXISTS "milestones_insert" ON public.milestones;
DROP POLICY IF EXISTS "milestones_update" ON public.milestones;
DROP POLICY IF EXISTS "milestones_delete" ON public.milestones;

CREATE POLICY "milestones_select"
  ON public.milestones FOR SELECT
  USING (can_view_project(project_id));

CREATE POLICY "milestones_insert"
  ON public.milestones FOR INSERT
  WITH CHECK (can_edit_project(project_id));

CREATE POLICY "milestones_update"
  ON public.milestones FOR UPDATE
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

CREATE POLICY "milestones_delete"
  ON public.milestones FOR DELETE
  USING (can_manage_project(project_id));

-- TASKS
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;

CREATE POLICY "tasks_select"
  ON public.tasks FOR SELECT
  USING (can_view_project(project_id));

CREATE POLICY "tasks_insert"
  ON public.tasks FOR INSERT
  WITH CHECK (can_edit_project(project_id));

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

CREATE POLICY "tasks_delete"
  ON public.tasks FOR DELETE
  USING (can_manage_project(project_id));

-- NEEDS
DROP POLICY IF EXISTS "needs_select" ON public.needs;
DROP POLICY IF EXISTS "needs_insert" ON public.needs;
DROP POLICY IF EXISTS "needs_update" ON public.needs;
DROP POLICY IF EXISTS "needs_delete" ON public.needs;

CREATE POLICY "needs_select"
  ON public.needs FOR SELECT
  USING (can_view_project(project_id));

CREATE POLICY "needs_insert"
  ON public.needs FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND can_edit_project(project_id)
  );

CREATE POLICY "needs_update"
  ON public.needs FOR UPDATE
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

CREATE POLICY "needs_delete"
  ON public.needs FOR DELETE
  USING (can_manage_project(project_id));

-- UPDATES
DROP POLICY IF EXISTS "updates_select" ON public.updates;
DROP POLICY IF EXISTS "updates_insert" ON public.updates;
DROP POLICY IF EXISTS "updates_update" ON public.updates;
DROP POLICY IF EXISTS "updates_delete" ON public.updates;

CREATE POLICY "updates_select"
  ON public.updates FOR SELECT
  USING (can_view_project(project_id));

CREATE POLICY "updates_insert"
  ON public.updates FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
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

-- DECISIONS
DROP POLICY IF EXISTS "decisions_select" ON public.decisions;
DROP POLICY IF EXISTS "decisions_insert" ON public.decisions;
DROP POLICY IF EXISTS "decisions_update" ON public.decisions;
DROP POLICY IF EXISTS "decisions_delete" ON public.decisions;

CREATE POLICY "decisions_select"
  ON public.decisions FOR SELECT
  USING (can_view_project(project_id));

CREATE POLICY "decisions_insert"
  ON public.decisions FOR INSERT
  WITH CHECK (can_edit_project(project_id));

-- Only Owner/Admin/LabAdmin can update decision status
CREATE POLICY "decisions_update"
  ON public.decisions FOR UPDATE
  USING (can_approve_decisions())
  WITH CHECK (can_approve_decisions());

CREATE POLICY "decisions_delete"
  ON public.decisions FOR DELETE
  USING (can_approve_decisions());

-- PROJECT_CONTACTS
DROP POLICY IF EXISTS "project_contacts_select" ON public.project_contacts;
DROP POLICY IF EXISTS "project_contacts_insert" ON public.project_contacts;
DROP POLICY IF EXISTS "project_contacts_update" ON public.project_contacts;
DROP POLICY IF EXISTS "project_contacts_delete" ON public.project_contacts;

CREATE POLICY "project_contacts_select"
  ON public.project_contacts FOR SELECT
  USING (can_view_project(project_id));

CREATE POLICY "project_contacts_insert"
  ON public.project_contacts FOR INSERT
  WITH CHECK (can_edit_project(project_id));

CREATE POLICY "project_contacts_update"
  ON public.project_contacts FOR UPDATE
  USING (can_edit_project(project_id))
  WITH CHECK (can_edit_project(project_id));

CREATE POLICY "project_contacts_delete"
  ON public.project_contacts FOR DELETE
  USING (can_manage_project(project_id));

-- COMMITMENTS
DROP POLICY IF EXISTS "commitments_select" ON public.commitments;
DROP POLICY IF EXISTS "commitments_insert" ON public.commitments;
DROP POLICY IF EXISTS "commitments_update" ON public.commitments;
DROP POLICY IF EXISTS "commitments_delete" ON public.commitments;

CREATE POLICY "commitments_select"
  ON public.commitments FOR SELECT
  USING (can_view_project(project_id));

CREATE POLICY "commitments_insert"
  ON public.commitments FOR INSERT
  WITH CHECK (
    auth.uid() = requested_by
    AND can_manage_project(project_id)
  );

CREATE POLICY "commitments_update"
  ON public.commitments FOR UPDATE
  USING (
    can_approve_decisions()
    OR (
      requested_by = auth.uid()
      AND status = 'requested'
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

-- EVENTS
DROP POLICY IF EXISTS "events_select" ON public.events;
DROP POLICY IF EXISTS "events_insert" ON public.events;
DROP POLICY IF EXISTS "events_update" ON public.events;
DROP POLICY IF EXISTS "events_delete" ON public.events;

CREATE POLICY "events_select"
  ON public.events FOR SELECT
  USING (
    can_view_project(project_id)
    OR organizer_id = auth.uid()
  );

CREATE POLICY "events_insert"
  ON public.events FOR INSERT
  WITH CHECK (
    auth.uid() = organizer_id
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

-- PROJECT_MEMBERS
DROP POLICY IF EXISTS "project_members_select" ON public.project_members;
DROP POLICY IF EXISTS "project_members_insert" ON public.project_members;
DROP POLICY IF EXISTS "project_members_update" ON public.project_members;
DROP POLICY IF EXISTS "project_members_delete" ON public.project_members;

-- Anyone who can view project can see members
CREATE POLICY "project_members_select"
  ON public.project_members FOR SELECT
  USING (
    can_view_project(project_id)
    OR user_id = auth.uid()
  );

-- Only leads/admins can add members
CREATE POLICY "project_members_insert"
  ON public.project_members FOR INSERT
  WITH CHECK (can_manage_project(project_id));

CREATE POLICY "project_members_update"
  ON public.project_members FOR UPDATE
  USING (can_manage_project(project_id))
  WITH CHECK (can_manage_project(project_id));

-- Leads can remove, users can leave
CREATE POLICY "project_members_delete"
  ON public.project_members FOR DELETE
  USING (
    can_manage_project(project_id)
    OR user_id = auth.uid()
  );

-- PROJECTS (update SELECT to use can_view_project)
DROP POLICY IF EXISTS "projects_select" ON public.projects;

CREATE POLICY "projects_select"
  ON public.projects FOR SELECT
  USING (can_view_project(id));

-- COMMENTS (use can_view_project)
DROP POLICY IF EXISTS "comments_read" ON public.comments;
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_update" ON public.comments;
DROP POLICY IF EXISTS "comments_delete" ON public.comments;

CREATE POLICY "comments_select"
  ON public.comments FOR SELECT
  USING (can_view_project(project_id));

CREATE POLICY "comments_insert"
  ON public.comments FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND can_view_project(project_id)  -- Anyone who can view can comment
  );

CREATE POLICY "comments_update"
  ON public.comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "comments_delete"
  ON public.comments FOR DELETE
  USING (
    auth.uid() = author_id
    OR is_admin_or_owner()
  );

-- IDEAS (use can_view_project)
DROP POLICY IF EXISTS "ideas_read" ON public.ideas;
DROP POLICY IF EXISTS "ideas_insert" ON public.ideas;
DROP POLICY IF EXISTS "ideas_update" ON public.ideas;
DROP POLICY IF EXISTS "ideas_delete" ON public.ideas;

CREATE POLICY "ideas_select"
  ON public.ideas FOR SELECT
  USING (can_view_project(project_id));

CREATE POLICY "ideas_insert"
  ON public.ideas FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND can_view_project(project_id)  -- Anyone who can view can submit ideas
  );

CREATE POLICY "ideas_update"
  ON public.ideas FOR UPDATE
  USING (
    auth.uid() = author_id
    OR is_admin_or_owner()
  );

CREATE POLICY "ideas_delete"
  ON public.ideas FOR DELETE
  USING (is_admin_or_owner());

-- IDEA_VOTES (use can_view_project via ideas)
DROP POLICY IF EXISTS "idea_votes_read" ON public.idea_votes;
DROP POLICY IF EXISTS "idea_votes_insert" ON public.idea_votes;
DROP POLICY IF EXISTS "idea_votes_delete" ON public.idea_votes;

CREATE POLICY "idea_votes_select"
  ON public.idea_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ideas i
      WHERE i.id = idea_id
      AND can_view_project(i.project_id)
    )
  );

CREATE POLICY "idea_votes_insert"
  ON public.idea_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.ideas i
      WHERE i.id = idea_id
      AND can_view_project(i.project_id)
    )
  );

CREATE POLICY "idea_votes_delete"
  ON public.idea_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- CATEGORIES (public read, admin write)
-- ============================================

DROP POLICY IF EXISTS "categories_select" ON public.categories;
DROP POLICY IF EXISTS "categories_insert" ON public.categories;
DROP POLICY IF EXISTS "categories_update" ON public.categories;
DROP POLICY IF EXISTS "categories_delete" ON public.categories;

CREATE POLICY "categories_select"
  ON public.categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "categories_insert"
  ON public.categories FOR INSERT
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "categories_update"
  ON public.categories FOR UPDATE
  USING (is_admin_or_owner())
  WITH CHECK (is_admin_or_owner());

CREATE POLICY "categories_delete"
  ON public.categories FOR DELETE
  USING (is_admin_or_owner());

