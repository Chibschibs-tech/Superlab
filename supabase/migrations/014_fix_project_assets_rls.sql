-- ============================================
-- Migration: 014_fix_project_assets_rls.sql
-- Purpose: Fix RLS policy for project_assets insert to allow authenticated users
-- ============================================

-- Drop the restrictive INSERT policy and create a more permissive one
DROP POLICY IF EXISTS project_assets_insert ON public.project_assets;

-- Create new policy allowing any authenticated user to insert assets
-- The project_id foreign key constraint already ensures the project exists
CREATE POLICY project_assets_insert ON public.project_assets
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

