-- ============================================
-- Migration: 012_comments_ideas_tables.sql
-- Purpose: Add comments and ideas tables for project collaboration
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================

-- Comment target types
CREATE TYPE comment_target_type AS ENUM (
  'project',
  'update',
  'decision',
  'milestone',
  'task',
  'need',
  'idea'
);

-- Idea status
CREATE TYPE idea_status AS ENUM (
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'implemented'
);

-- ============================================
-- 2. COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  target_type comment_target_type NOT NULL DEFAULT 'project',
  target_id UUID, -- Optional reference to specific entity (update_id, decision_id, etc.)
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- For threaded comments
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}', -- Array of mentioned user IDs
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for comments
CREATE INDEX idx_comments_project ON public.comments(project_id);
CREATE INDEX idx_comments_target ON public.comments(target_type, target_id);
CREATE INDEX idx_comments_author ON public.comments(author_id);
CREATE INDEX idx_comments_parent ON public.comments(parent_id);
CREATE INDEX idx_comments_mentions ON public.comments USING GIN (mentions);

-- Trigger for updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. IDEAS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status idea_status DEFAULT 'submitted' NOT NULL,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  votes_up INTEGER DEFAULT 0,
  votes_down INTEGER DEFAULT 0,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for ideas
CREATE INDEX idx_ideas_project ON public.ideas(project_id);
CREATE INDEX idx_ideas_author ON public.ideas(author_id);
CREATE INDEX idx_ideas_status ON public.ideas(status);

-- Trigger for updated_at
CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. IDEA VOTES TABLE (to track who voted)
-- ============================================

CREATE TABLE IF NOT EXISTS public.idea_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(idea_id, user_id)
);

-- Index for idea votes
CREATE INDEX idx_idea_votes_idea ON public.idea_votes(idea_id);
CREATE INDEX idx_idea_votes_user ON public.idea_votes(user_id);

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_votes ENABLE ROW LEVEL SECURITY;

-- Comments policies
-- Read: Any authenticated user can read comments on projects they can access
CREATE POLICY "comments_read" ON public.comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert: Any authenticated user can comment
CREATE POLICY "comments_insert" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Update: Only author can update their own comments
CREATE POLICY "comments_update" ON public.comments
  FOR UPDATE USING (auth.uid() = author_id);

-- Delete: Author or admin can delete comments
CREATE POLICY "comments_delete" ON public.comments
  FOR DELETE USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('Owner', 'Admin', 'LabAdmin')
    )
  );

-- Ideas policies
-- Read: Any authenticated user can read ideas
CREATE POLICY "ideas_read" ON public.ideas
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert: Any authenticated user can submit ideas
CREATE POLICY "ideas_insert" ON public.ideas
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Update: Author can update their own ideas, Admin can update status
CREATE POLICY "ideas_update" ON public.ideas
  FOR UPDATE USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('Owner', 'Admin', 'LabAdmin')
    )
  );

-- Delete: Only admin can delete ideas
CREATE POLICY "ideas_delete" ON public.ideas
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('Owner', 'Admin', 'LabAdmin')
    )
  );

-- Idea votes policies
-- Read: Any authenticated user can see votes
CREATE POLICY "idea_votes_read" ON public.idea_votes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Insert: Any authenticated user can vote
CREATE POLICY "idea_votes_insert" ON public.idea_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Delete: User can remove their own vote
CREATE POLICY "idea_votes_delete" ON public.idea_votes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. FUNCTION TO UPDATE VOTE COUNTS
-- ============================================

CREATE OR REPLACE FUNCTION update_idea_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE public.ideas SET votes_up = votes_up + 1 WHERE id = NEW.idea_id;
    ELSE
      UPDATE public.ideas SET votes_down = votes_down + 1 WHERE id = NEW.idea_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE public.ideas SET votes_up = GREATEST(0, votes_up - 1) WHERE id = OLD.idea_id;
    ELSE
      UPDATE public.ideas SET votes_down = GREATEST(0, votes_down - 1) WHERE id = OLD.idea_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER idea_vote_count_trigger
  AFTER INSERT OR DELETE ON public.idea_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_idea_vote_counts();

