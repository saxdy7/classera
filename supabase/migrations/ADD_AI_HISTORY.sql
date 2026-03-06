-- AI History table: stores roadmaps, courses, guides, and career coach sessions per user
CREATE TABLE IF NOT EXISTS public.ai_history (
    id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type        TEXT         NOT NULL CHECK (type IN ('roadmap', 'course', 'guide', 'career_coach')),
    title       TEXT         NOT NULL,
    data        JSONB        NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ  DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_history_user_type ON public.ai_history (user_id, type, created_at DESC);

ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own history
CREATE POLICY "ai_history_owner" ON public.ai_history
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
