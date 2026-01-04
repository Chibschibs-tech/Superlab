-- ============================================
-- MIGRATION 001: Add Editor Role
-- ============================================
-- This migration adds the 'Editor' role to the user_role enum
-- Editors can edit content but cannot delete or manage projects

-- Add Editor value to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Editor';

-- Verify the enum values
-- SELECT enum_range(NULL::user_role);

