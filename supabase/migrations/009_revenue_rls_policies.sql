-- ============================================
-- MIGRATION 009: Revenue Cockpit RLS Policies
-- ============================================
-- Restricts revenue data to Owner/Admin/LabAdmin only.
-- Other roles have NO access to revenue tables.

-- ============================================
-- ENABLE RLS ON ALL REVENUE TABLES
-- ============================================

ALTER TABLE public.revenue_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Check if user has revenue access
-- ============================================

CREATE OR REPLACE FUNCTION has_revenue_access()
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- Only Owner, Admin, LabAdmin have revenue access
  RETURN v_role IN ('Owner', 'Admin', 'LabAdmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION has_revenue_access() TO authenticated;

-- ============================================
-- REVENUE_STREAMS POLICIES
-- ============================================

CREATE POLICY "revenue_streams_select"
  ON public.revenue_streams FOR SELECT
  USING (has_revenue_access());

CREATE POLICY "revenue_streams_insert"
  ON public.revenue_streams FOR INSERT
  WITH CHECK (has_revenue_access());

CREATE POLICY "revenue_streams_update"
  ON public.revenue_streams FOR UPDATE
  USING (has_revenue_access())
  WITH CHECK (has_revenue_access());

CREATE POLICY "revenue_streams_delete"
  ON public.revenue_streams FOR DELETE
  USING (has_revenue_access());

-- ============================================
-- REVENUE_SOURCES POLICIES
-- ============================================

CREATE POLICY "revenue_sources_select"
  ON public.revenue_sources FOR SELECT
  USING (has_revenue_access());

CREATE POLICY "revenue_sources_insert"
  ON public.revenue_sources FOR INSERT
  WITH CHECK (has_revenue_access());

CREATE POLICY "revenue_sources_update"
  ON public.revenue_sources FOR UPDATE
  USING (has_revenue_access())
  WITH CHECK (has_revenue_access());

CREATE POLICY "revenue_sources_delete"
  ON public.revenue_sources FOR DELETE
  USING (has_revenue_access());

-- ============================================
-- REVENUE_ENTRIES POLICIES
-- ============================================

CREATE POLICY "revenue_entries_select"
  ON public.revenue_entries FOR SELECT
  USING (has_revenue_access());

CREATE POLICY "revenue_entries_insert"
  ON public.revenue_entries FOR INSERT
  WITH CHECK (has_revenue_access());

CREATE POLICY "revenue_entries_update"
  ON public.revenue_entries FOR UPDATE
  USING (has_revenue_access())
  WITH CHECK (has_revenue_access());

CREATE POLICY "revenue_entries_delete"
  ON public.revenue_entries FOR DELETE
  USING (has_revenue_access());

-- ============================================
-- REVENUE_TARGETS POLICIES
-- ============================================

CREATE POLICY "revenue_targets_select"
  ON public.revenue_targets FOR SELECT
  USING (has_revenue_access());

CREATE POLICY "revenue_targets_insert"
  ON public.revenue_targets FOR INSERT
  WITH CHECK (has_revenue_access());

CREATE POLICY "revenue_targets_update"
  ON public.revenue_targets FOR UPDATE
  USING (has_revenue_access())
  WITH CHECK (has_revenue_access());

CREATE POLICY "revenue_targets_delete"
  ON public.revenue_targets FOR DELETE
  USING (has_revenue_access());

-- ============================================
-- SYNC_RUNS POLICIES
-- ============================================

CREATE POLICY "sync_runs_select"
  ON public.sync_runs FOR SELECT
  USING (has_revenue_access());

CREATE POLICY "sync_runs_insert"
  ON public.sync_runs FOR INSERT
  WITH CHECK (has_revenue_access());

CREATE POLICY "sync_runs_update"
  ON public.sync_runs FOR UPDATE
  USING (has_revenue_access())
  WITH CHECK (has_revenue_access());

CREATE POLICY "sync_runs_delete"
  ON public.sync_runs FOR DELETE
  USING (has_revenue_access());


