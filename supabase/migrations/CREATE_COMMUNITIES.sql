-- ============================================================================
-- CLASSERA — Communities Tables (Drop & Recreate)
-- ============================================================================
-- Run this in Supabase SQL Editor
-- Drops existing tables first so column changes take effect
-- ============================================================================

-- Drop existing tables (CASCADE removes dependent objects like policies, FKs)
DROP TABLE IF EXISTS public.community_members CASCADE;
DROP TABLE IF EXISTS public.communities CASCADE;

-- Create communities table
CREATE TABLE public.communities (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    description   TEXT,
    avatar_url    TEXT,
    mentor_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create community_members table
CREATE TABLE public.community_members (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    student_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (community_id, student_id)
);

-- Indexes
CREATE INDEX idx_communities_mentor      ON public.communities(mentor_id);
CREATE INDEX idx_communities_university  ON public.communities(university_id);
CREATE INDEX idx_cm_community            ON public.community_members(community_id);
CREATE INDEX idx_cm_student              ON public.community_members(student_id);

-- Enable RLS
ALTER TABLE public.communities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Communities: simple direct-column policies
CREATE POLICY "comm_select" ON public.communities FOR SELECT USING (true);
CREATE POLICY "comm_insert" ON public.communities FOR INSERT WITH CHECK (mentor_id = auth.uid());
CREATE POLICY "comm_update" ON public.communities FOR UPDATE USING (mentor_id = auth.uid());
CREATE POLICY "comm_delete" ON public.communities FOR DELETE USING (mentor_id = auth.uid());

-- Community members: direct-column policies only (no cross-table refs)
CREATE POLICY "cm_select" ON public.community_members FOR SELECT USING (student_id = auth.uid() OR true);
CREATE POLICY "cm_insert" ON public.community_members FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "cm_update" ON public.community_members FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "cm_delete" ON public.community_members FOR DELETE USING (student_id = auth.uid());

-- Verify
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('communities', 'community_members')
ORDER BY table_name;
