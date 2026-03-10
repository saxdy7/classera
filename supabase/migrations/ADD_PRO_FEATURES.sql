-- ============================================================================
-- ADD_PRO_FEATURES.sql
-- Pro-tier GitHub integration features:
--   1. Assignment rubrics + per-criterion scoring
--   2. Analysis snapshots (append-only progress history)
--   3. AI review caching columns on repo_analytics
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- ============================================================
-- 1.  Assignment Rubrics
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assignment_rubrics (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.project_assignments(id) ON DELETE CASCADE,
    mentor_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    -- criteria: [{id, name, description, max_points, weight}]  weights must total 100
    criteria      JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(assignment_id)
);

CREATE INDEX IF NOT EXISTS idx_rubrics_assignment ON public.assignment_rubrics(assignment_id);

-- ============================================================
-- 2.  Rubric Scores (one row per submission × criterion)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rubric_scores (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
    rubric_id     UUID NOT NULL REFERENCES public.assignment_rubrics(id) ON DELETE CASCADE,
    criterion_id  TEXT NOT NULL,
    score         NUMERIC(6,2) NOT NULL DEFAULT 0,
    comment       TEXT,
    scored_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(submission_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_rubric_scores_submission ON public.rubric_scores(submission_id);

-- ============================================================
-- 3.  Analysis Snapshots (append-only — never updated)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analysis_snapshots (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id     UUID NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
    overall_score     INTEGER NOT NULL DEFAULT 0,
    consistency_score INTEGER NOT NULL DEFAULT 0,
    activity_score    INTEGER NOT NULL DEFAULT 0,
    quality_score     INTEGER NOT NULL DEFAULT 0,
    total_commits     INTEGER NOT NULL DEFAULT 0,
    active_days       INTEGER NOT NULL DEFAULT 0,
    analyzed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_submission_date
    ON public.analysis_snapshots(submission_id, analyzed_at DESC);

-- ============================================================
-- 4.  AI Review caching on repo_analytics
-- ============================================================
ALTER TABLE public.repo_analytics
    ADD COLUMN IF NOT EXISTS ai_review       JSONB,
    ADD COLUMN IF NOT EXISTS ai_file_reviews JSONB DEFAULT '{}'::jsonb;

-- ============================================================
-- 5.  RLS
-- ============================================================
ALTER TABLE public.assignment_rubrics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_scores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_snapshots  ENABLE ROW LEVEL SECURITY;

-- Rubrics: fully public SELECT, CUD restricted to owning mentor
CREATE POLICY "rubric_select" ON public.assignment_rubrics FOR SELECT USING (true);
CREATE POLICY "rubric_insert" ON public.assignment_rubrics FOR INSERT WITH CHECK (mentor_id = auth.uid());
CREATE POLICY "rubric_update" ON public.assignment_rubrics FOR UPDATE USING (mentor_id = auth.uid());
CREATE POLICY "rubric_delete" ON public.assignment_rubrics FOR DELETE USING (mentor_id = auth.uid());

-- Rubric scores: any authenticated user can read/write (mentor grades, student reads their own)
CREATE POLICY "rubric_scores_select" ON public.rubric_scores FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "rubric_scores_insert" ON public.rubric_scores FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "rubric_scores_update" ON public.rubric_scores FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Snapshots: any authenticated user can read, any can insert (API enforces rules)
CREATE POLICY "snapshots_select" ON public.analysis_snapshots FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "snapshots_insert" ON public.analysis_snapshots FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
