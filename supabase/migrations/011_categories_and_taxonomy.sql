-- ============================================
-- MIGRATION 011: Categories & Taxonomy
-- ============================================

-- ============================================
-- 1) CATEGORY TYPE ENUM
-- ============================================

CREATE TYPE category_type AS ENUM ('project', 'revenue');

-- ============================================
-- 2) CATEGORIES TABLE
-- ============================================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type category_type NOT NULL DEFAULT 'project',
  sort_order INTEGER NOT NULL DEFAULT 0,
  color TEXT, -- hex color e.g. #FF5733
  icon TEXT, -- lucide icon name
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_categories_type ON public.categories(type);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_sort ON public.categories(sort_order);

-- Updated at trigger
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3) ADD CATEGORY FK TO PROJECTS
-- ============================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX idx_projects_category ON public.projects(category_id);

-- ============================================
-- 4) ADD CATEGORY FK TO REVENUE_STREAMS
-- ============================================

ALTER TABLE public.revenue_streams
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

CREATE INDEX idx_revenue_streams_category_id ON public.revenue_streams(category_id);

-- ============================================
-- 5) RLS FOR CATEGORIES (read-only for all authenticated)
-- ============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read categories
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Only Owner/Admin/LabAdmin can modify
CREATE POLICY "categories_insert" ON public.categories
  FOR INSERT WITH CHECK (is_admin_or_owner());

CREATE POLICY "categories_update" ON public.categories
  FOR UPDATE USING (is_admin_or_owner()) WITH CHECK (is_admin_or_owner());

CREATE POLICY "categories_delete" ON public.categories
  FOR DELETE USING (is_admin_or_owner());

-- ============================================
-- 6) SEED CATEGORIES
-- ============================================

INSERT INTO public.categories (name, slug, type, sort_order, color, icon) VALUES
  ('Audiovisuel & Pro AV', 'audiovisual-pro-av', 'project', 1, '#8B5CF6', 'video'),
  ('Retail & E-commerce', 'retail-ecommerce', 'project', 2, '#F59E0B', 'shopping-cart'),
  ('Pro Audio Retail', 'pro-audio-retail', 'project', 3, '#EC4899', 'music'),
  ('Services & Événements', 'services-events', 'project', 4, '#10B981', 'calendar'),
  ('Production Média', 'media-production', 'project', 5, '#3B82F6', 'film'),
  ('Tech & IA', 'tech-ai', 'project', 6, '#6366F1', 'cpu'),
  ('Fintech & Procurement', 'fintech-procurement', 'project', 7, '#14B8A6', 'credit-card'),
  ('Data & Analytics', 'data-analytics', 'project', 8, '#F97316', 'bar-chart-2'),
  ('Ops & Infrastructure', 'ops-infrastructure', 'project', 9, '#64748B', 'server')
ON CONFLICT (slug) DO NOTHING;

-- Revenue stream categories
INSERT INTO public.categories (name, slug, type, sort_order, color, icon) VALUES
  ('Ventes Produits', 'product-sales', 'revenue', 1, '#10B981', 'package'),
  ('Services', 'services-revenue', 'revenue', 2, '#3B82F6', 'wrench'),
  ('Abonnements', 'subscriptions', 'revenue', 3, '#8B5CF6', 'repeat'),
  ('Publicité', 'advertising', 'revenue', 4, '#F59E0B', 'megaphone'),
  ('Commissions', 'commissions', 'revenue', 5, '#EC4899', 'percent')
ON CONFLICT (slug) DO NOTHING;


