-- ============================================
-- MIGRATION 010: Revenue Cockpit Hardening
-- ============================================
-- Adds missing indexes, constraints, and ensures RLS is strict.

-- ============================================
-- 1) INDEXES FOR PERFORMANCE
-- ============================================

-- revenue_entries indexes (if not already present)
CREATE INDEX IF NOT EXISTS idx_revenue_entries_date ON public.revenue_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_stream_date ON public.revenue_entries(stream_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_source_date ON public.revenue_entries(source_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_type_date ON public.revenue_entries(entry_type, date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_status ON public.revenue_entries(status);

-- revenue_targets indexes
CREATE INDEX IF NOT EXISTS idx_revenue_targets_stream_month ON public.revenue_targets(stream_id, month_date);

-- revenue_streams indexes
CREATE INDEX IF NOT EXISTS idx_revenue_streams_owner ON public.revenue_streams(owner_id);

-- sync_runs indexes
CREATE INDEX IF NOT EXISTS idx_sync_runs_source_started ON public.sync_runs(source_id, started_at DESC);

-- ============================================
-- 2) UNIQUE CONSTRAINT FOR DEDUPLICATION
-- ============================================

-- Unique constraint: (source_id, reference_type, reference_id) WHERE reference_id IS NOT NULL
-- This prevents duplicate imports from the same source
DROP INDEX IF EXISTS idx_revenue_entries_unique_ref;
CREATE UNIQUE INDEX idx_revenue_entries_unique_ref 
  ON public.revenue_entries(source_id, reference_type, reference_id) 
  WHERE reference_id IS NOT NULL;

-- ============================================
-- 3) RLS VERIFICATION - Ensure strict access
-- ============================================

-- Drop and recreate the helper function to be extra strict
CREATE OR REPLACE FUNCTION has_revenue_access()
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT role INTO v_role 
  FROM public.users 
  WHERE id = auth.uid();
  
  -- Only Owner, Admin, LabAdmin have revenue access
  -- NULL role means no access
  IF v_role IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN v_role IN ('Owner', 'Admin', 'LabAdmin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 4) ADD AMOUNT VALIDATION CONSTRAINT
-- ============================================

-- Ensure amount is reasonable (between -1B and +1B)
ALTER TABLE public.revenue_entries 
  DROP CONSTRAINT IF EXISTS revenue_entries_amount_check;
ALTER TABLE public.revenue_entries 
  ADD CONSTRAINT revenue_entries_amount_check 
  CHECK (amount BETWEEN -1000000000 AND 1000000000);

-- Ensure target amount is positive
ALTER TABLE public.revenue_targets 
  DROP CONSTRAINT IF EXISTS revenue_targets_amount_check;
ALTER TABLE public.revenue_targets 
  ADD CONSTRAINT revenue_targets_amount_check 
  CHECK (target_amount >= 0);

-- ============================================
-- 5) ADD CURRENCY VALIDATION
-- ============================================

-- Common currency codes only
ALTER TABLE public.revenue_entries 
  DROP CONSTRAINT IF EXISTS revenue_entries_currency_check;
ALTER TABLE public.revenue_entries 
  ADD CONSTRAINT revenue_entries_currency_check 
  CHECK (currency IN ('EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'CNY'));

ALTER TABLE public.revenue_targets 
  DROP CONSTRAINT IF EXISTS revenue_targets_currency_check;
ALTER TABLE public.revenue_targets 
  ADD CONSTRAINT revenue_targets_currency_check 
  CHECK (currency IN ('EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'CNY'));

-- ============================================
-- 6) ADD IMPORT TRACKING FIELDS TO SYNC_RUNS
-- ============================================

-- Add columns if not present
ALTER TABLE public.sync_runs 
  ADD COLUMN IF NOT EXISTS total_amount DECIMAL(14, 2) DEFAULT 0;
ALTER TABLE public.sync_runs 
  ADD COLUMN IF NOT EXISTS sales_amount DECIMAL(14, 2) DEFAULT 0;
ALTER TABLE public.sync_runs 
  ADD COLUMN IF NOT EXISTS refunds_amount DECIMAL(14, 2) DEFAULT 0;
ALTER TABLE public.sync_runs 
  ADD COLUMN IF NOT EXISTS date_range_start DATE;
ALTER TABLE public.sync_runs 
  ADD COLUMN IF NOT EXISTS date_range_end DATE;


