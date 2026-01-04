-- ============================================
-- MIGRATION 011: Categories & Taxonomy
-- ============================================
-- Creates categories table for projects and revenue streams

-- ============================================
-- 1) CATEGORY TYPE ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE category_type AS ENUM ('project', 'revenue');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2) CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  type category_type NOT NULL DEFAULT 'project',
  description TEXT,
  color VARCHAR(7), -- Hex color like #FF5733
  icon VARCHAR(50), -- Lucide icon name
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(sort_order);

-- Updated at trigger
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3) ADD CATEGORY FK TO PROJECTS
-- ============================================
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects(category_id);

-- ============================================
-- 4) ADD CATEGORY FK TO REVENUE_STREAMS
-- ============================================
ALTER TABLE public.revenue_streams 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_revenue_streams_category_id ON public.revenue_streams(category_id);

-- ============================================
-- 5) RLS POLICIES FOR CATEGORIES
-- ============================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read categories
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only Owner/Admin/LabAdmin can manage categories
CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT WITH CHECK (is_admin_or_owner());

CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (is_admin_or_owner()) WITH CHECK (is_admin_or_owner());

CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (is_admin_or_owner());

-- ============================================
-- 6) SEED DEFAULT CATEGORIES
-- ============================================
INSERT INTO public.categories (id, name, slug, type, color, icon, sort_order, description) VALUES
  -- Project categories
  ('a1b2c3d4-e5f6-7890-abcd-100000000001', 'Audiovisuel & Pro AV', 'audiovisual-pro-av', 'project', '#8B5CF6', 'Video', 1, 'Solutions audiovisuelles professionnelles'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000002', 'Retail & E-commerce', 'retail-ecommerce', 'project', '#EC4899', 'ShoppingBag', 2, 'Commerce de détail et e-commerce'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000003', 'Pro Audio Retail', 'pro-audio-retail', 'project', '#F59E0B', 'Music', 3, 'Vente d''équipements audio professionnels'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000004', 'Services & Events', 'services-events', 'project', '#10B981', 'Calendar', 4, 'Services et événementiel'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000005', 'Media Production', 'media-production', 'project', '#3B82F6', 'Film', 5, 'Production média et contenu'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000006', 'Tech & AI', 'tech-ai', 'project', '#6366F1', 'Cpu', 6, 'Technologies et intelligence artificielle'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000007', 'Fintech & Procurement', 'fintech-procurement', 'project', '#14B8A6', 'Wallet', 7, 'Technologies financières et achats'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000008', 'Data & Analytics', 'data-analytics', 'project', '#0EA5E9', 'BarChart3', 8, 'Données et analytique'),
  ('a1b2c3d4-e5f6-7890-abcd-100000000009', 'Internal Ops & Infrastructure', 'internal-ops', 'project', '#64748B', 'Settings', 9, 'Opérations internes et infrastructure'),
  -- Revenue categories
  ('a1b2c3d4-e5f6-7890-abcd-200000000001', 'Audiovisuel & Pro AV', 'revenue-audiovisual', 'revenue', '#8B5CF6', 'Video', 1, 'Revenus audiovisuels'),
  ('a1b2c3d4-e5f6-7890-abcd-200000000002', 'Retail & E-commerce', 'revenue-retail', 'revenue', '#EC4899', 'ShoppingBag', 2, 'Revenus retail'),
  ('a1b2c3d4-e5f6-7890-abcd-200000000003', 'Pro Audio Retail', 'revenue-pro-audio', 'revenue', '#F59E0B', 'Music', 3, 'Revenus audio pro'),
  ('a1b2c3d4-e5f6-7890-abcd-200000000004', 'Services & Events', 'revenue-services', 'revenue', '#10B981', 'Calendar', 4, 'Revenus services')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  description = EXCLUDED.description;

