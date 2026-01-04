-- ============================================
-- MIGRATION 008: Revenue Cockpit Core Tables
-- ============================================
-- Creates the data model for the Revenue Cockpit feature.
-- Executive-only dashboard for revenue stream visibility.
-- NOT a full accounting system.

-- ============================================
-- ENUMS
-- ============================================

-- Source type for revenue data ingestion
DO $$ BEGIN
  CREATE TYPE revenue_source_type AS ENUM ('Manual', 'API', 'Webhook', 'CSV');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Entry type classification
DO $$ BEGIN
  CREATE TYPE revenue_entry_type AS ENUM (
    'Sale',
    'Refund',
    'Subscription',
    'AdRevenue',
    'License',
    'Other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Entry status
DO $$ BEGIN
  CREATE TYPE revenue_entry_status AS ENUM (
    'Pending',
    'Confirmed',
    'Cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Sync run status
DO $$ BEGIN
  CREATE TYPE sync_run_status AS ENUM (
    'Running',
    'Success',
    'Failed',
    'Partial'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- REVENUE_STREAMS TABLE
-- ============================================
-- Logical grouping of revenue (e.g., "Subscriptions", "Ad Revenue")

CREATE TABLE IF NOT EXISTS public.revenue_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT,  -- e.g., "Recurring", "Transactional", "Partnership"
  description TEXT,
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_streams_active ON public.revenue_streams(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_revenue_streams_category ON public.revenue_streams(category);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_revenue_streams_updated_at ON public.revenue_streams;
CREATE TRIGGER trigger_revenue_streams_updated_at
  BEFORE UPDATE ON public.revenue_streams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REVENUE_SOURCES TABLE
-- ============================================
-- Data sources for revenue entries (Stripe, Google Ads, CSV, etc.)

CREATE TABLE IF NOT EXISTS public.revenue_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type revenue_source_type NOT NULL DEFAULT 'Manual',
  config_json JSONB DEFAULT '{}'::jsonb,  -- API keys, settings (encrypted in production)
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_sources_active ON public.revenue_sources(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_revenue_sources_type ON public.revenue_sources(type);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_revenue_sources_updated_at ON public.revenue_sources;
CREATE TRIGGER trigger_revenue_sources_updated_at
  BEFORE UPDATE ON public.revenue_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REVENUE_ENTRIES TABLE
-- ============================================
-- Individual revenue transactions/entries

CREATE TABLE IF NOT EXISTS public.revenue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Transaction details
  date DATE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  
  -- References
  stream_id UUID NOT NULL REFERENCES public.revenue_streams(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.revenue_sources(id) ON DELETE CASCADE,
  
  -- Classification
  entry_type revenue_entry_type NOT NULL DEFAULT 'Sale',
  status revenue_entry_status NOT NULL DEFAULT 'Confirmed',
  
  -- External reference for deduplication
  reference_type TEXT,  -- e.g., 'invoice', 'transaction', 'payout'
  reference_id TEXT,    -- External system ID
  
  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,  -- Additional data from source
  
  -- Audit
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_revenue_entries_date ON public.revenue_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_stream ON public.revenue_entries(stream_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_source ON public.revenue_entries(source_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_type ON public.revenue_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_status ON public.revenue_entries(status);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_month ON public.revenue_entries(date_trunc('month', date));

-- Unique constraint for deduplication (only when reference_id is not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_revenue_entries_unique_ref 
  ON public.revenue_entries(source_id, reference_type, reference_id) 
  WHERE reference_id IS NOT NULL;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_revenue_entries_updated_at ON public.revenue_entries;
CREATE TRIGGER trigger_revenue_entries_updated_at
  BEFORE UPDATE ON public.revenue_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REVENUE_TARGETS TABLE
-- ============================================
-- Monthly targets per stream

CREATE TABLE IF NOT EXISTS public.revenue_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID NOT NULL REFERENCES public.revenue_streams(id) ON DELETE CASCADE,
  month_date DATE NOT NULL,  -- First day of target month
  target_amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One target per stream per month
  UNIQUE(stream_id, month_date)
);

CREATE INDEX IF NOT EXISTS idx_revenue_targets_stream ON public.revenue_targets(stream_id);
CREATE INDEX IF NOT EXISTS idx_revenue_targets_month ON public.revenue_targets(month_date);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_revenue_targets_updated_at ON public.revenue_targets;
CREATE TRIGGER trigger_revenue_targets_updated_at
  BEFORE UPDATE ON public.revenue_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SYNC_RUNS TABLE
-- ============================================
-- Audit log for automated data syncs

CREATE TABLE IF NOT EXISTS public.sync_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES public.revenue_sources(id) ON DELETE CASCADE,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Status
  status sync_run_status NOT NULL DEFAULT 'Running',
  
  -- Results
  rows_imported INTEGER DEFAULT 0,
  rows_skipped INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  
  -- Errors
  error_log TEXT,
  
  -- Metadata
  initiated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_source ON public.sync_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_sync_runs_status ON public.sync_runs(status);
CREATE INDEX IF NOT EXISTS idx_sync_runs_started ON public.sync_runs(started_at DESC);

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON TYPE revenue_source_type TO authenticated;
GRANT USAGE ON TYPE revenue_entry_type TO authenticated;
GRANT USAGE ON TYPE revenue_entry_status TO authenticated;
GRANT USAGE ON TYPE sync_run_status TO authenticated;

GRANT ALL ON public.revenue_streams TO authenticated;
GRANT ALL ON public.revenue_sources TO authenticated;
GRANT ALL ON public.revenue_entries TO authenticated;
GRANT ALL ON public.revenue_targets TO authenticated;
GRANT ALL ON public.sync_runs TO authenticated;


