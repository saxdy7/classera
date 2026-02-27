-- ============================================================================
-- CLASSERA — MISSING TABLES MIGRATION (v4 - fully defensive)
-- ============================================================================
-- Safe to re-run: drops managed policies first, patches pre-existing tables,
-- then creates missing tables. NO column references in USING clauses to avoid
-- "column does not exist" errors on pre-existing tables.
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop all policies this script manages (idempotent)
-- ============================================================================
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname IN (
        'conv_select','conv_insert','cp_select','cp_insert',
        'tests_select','tests_insert','tests_update',
        'tq_select','tq_insert',
        'ts_select','ts_insert','ts_update',
        'mc_select','mc_insert','mc_update',
        'mod_select','cl_select',
        'ce_select','ce_insert','lc_select','lc_insert',
        'roadmaps_select','roadmaps_insert','roadmaps_update','roadmaps_delete',
        'ce_select_cal','ce_insert_cal','ce_update_cal','ce_delete_cal',
        'up_select','up_upsert','up_update',
        'lb_select',
        'ps_select','ps_insert','ps_update'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Patch pre-existing tables (add any missing columns safely)
-- ============================================================================

-- tests
ALTER TABLE IF EXISTS public.tests ADD COLUMN IF NOT EXISTS is_published     BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.tests ADD COLUMN IF NOT EXISTS mentor_id        UUID;
ALTER TABLE IF EXISTS public.tests ADD COLUMN IF NOT EXISTS community_id     UUID;
ALTER TABLE IF EXISTS public.tests ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
ALTER TABLE IF EXISTS public.tests ADD COLUMN IF NOT EXISTS total_marks      INTEGER DEFAULT 100;
ALTER TABLE IF EXISTS public.tests ADD COLUMN IF NOT EXISTS passing_marks    INTEGER DEFAULT 40;
ALTER TABLE IF EXISTS public.tests ADD COLUMN IF NOT EXISTS instructions     TEXT;
ALTER TABLE IF EXISTS public.tests ADD COLUMN IF NOT EXISTS scheduled_at    TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.tests ADD COLUMN IF NOT EXISTS expires_at      TIMESTAMPTZ;

-- test_submissions
ALTER TABLE IF EXISTS public.test_submissions ADD COLUMN IF NOT EXISTS student_id   UUID;
ALTER TABLE IF EXISTS public.test_submissions ADD COLUMN IF NOT EXISTS test_id      UUID;
ALTER TABLE IF EXISTS public.test_submissions ADD COLUMN IF NOT EXISTS answers      JSONB;
ALTER TABLE IF EXISTS public.test_submissions ADD COLUMN IF NOT EXISTS score        INTEGER;
ALTER TABLE IF EXISTS public.test_submissions ADD COLUMN IF NOT EXISTS max_score    INTEGER;
ALTER TABLE IF EXISTS public.test_submissions ADD COLUMN IF NOT EXISTS percentage   NUMERIC(5,2);
ALTER TABLE IF EXISTS public.test_submissions ADD COLUMN IF NOT EXISTS status       TEXT DEFAULT 'pending';
ALTER TABLE IF EXISTS public.test_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.test_submissions ADD COLUMN IF NOT EXISTS graded_at    TIMESTAMPTZ;

-- mentor_courses
ALTER TABLE IF EXISTS public.mentor_courses ADD COLUMN IF NOT EXISTS is_published   BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.mentor_courses ADD COLUMN IF NOT EXISTS instructor_id  UUID;
ALTER TABLE IF EXISTS public.mentor_courses ADD COLUMN IF NOT EXISTS university_id  UUID;
ALTER TABLE IF EXISTS public.mentor_courses ADD COLUMN IF NOT EXISTS thumbnail_url  TEXT;
ALTER TABLE IF EXISTS public.mentor_courses ADD COLUMN IF NOT EXISTS difficulty     TEXT DEFAULT 'beginner';
ALTER TABLE IF EXISTS public.mentor_courses ADD COLUMN IF NOT EXISTS total_lessons  INTEGER DEFAULT 0;

-- course_enrollments
ALTER TABLE IF EXISTS public.course_enrollments ADD COLUMN IF NOT EXISTS student_id   UUID;
ALTER TABLE IF EXISTS public.course_enrollments ADD COLUMN IF NOT EXISTS course_id    UUID;
ALTER TABLE IF EXISTS public.course_enrollments ADD COLUMN IF NOT EXISTS progress     INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.course_enrollments ADD COLUMN IF NOT EXISTS enrolled_at  TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.course_enrollments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- lesson_completions
ALTER TABLE IF EXISTS public.lesson_completions ADD COLUMN IF NOT EXISTS student_id   UUID;
ALTER TABLE IF EXISTS public.lesson_completions ADD COLUMN IF NOT EXISTS lesson_id    UUID;
ALTER TABLE IF EXISTS public.lesson_completions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT now();

-- proctoring_sessions
ALTER TABLE IF EXISTS public.proctoring_sessions ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE IF EXISTS public.proctoring_sessions ADD COLUMN IF NOT EXISTS test_id    UUID;
ALTER TABLE IF EXISTS public.proctoring_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE IF EXISTS public.proctoring_sessions ADD COLUMN IF NOT EXISTS ended_at   TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.proctoring_sessions ADD COLUMN IF NOT EXISTS violations JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS public.proctoring_sessions ADD COLUMN IF NOT EXISTS status     TEXT DEFAULT 'active';

-- roadmaps
ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN IF NOT EXISTS user_id         UUID;
ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN IF NOT EXISTS title           TEXT;
ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN IF NOT EXISTS steps           JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS public.roadmaps ADD COLUMN IF NOT EXISTS status          TEXT DEFAULT 'active';

-- calendar_events
ALTER TABLE IF EXISTS public.calendar_events ADD COLUMN IF NOT EXISTS user_id    UUID;
ALTER TABLE IF EXISTS public.calendar_events ADD COLUMN IF NOT EXISTS title      TEXT;
ALTER TABLE IF EXISTS public.calendar_events ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.calendar_events ADD COLUMN IF NOT EXISTS end_time   TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.calendar_events ADD COLUMN IF NOT EXISTS type       TEXT DEFAULT 'event';
ALTER TABLE IF EXISTS public.calendar_events ADD COLUMN IF NOT EXISTS color      TEXT DEFAULT '#6366f1';

-- user_presence
ALTER TABLE IF EXISTS public.user_presence ADD COLUMN IF NOT EXISTS user_id   UUID;
ALTER TABLE IF EXISTS public.user_presence ADD COLUMN IF NOT EXISTS status    TEXT DEFAULT 'offline';
ALTER TABLE IF EXISTS public.user_presence ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT now();

-- ============================================================================
-- STEP 3: Create missing tables
-- ============================================================================

-- CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    title           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_conv_part_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_part_conv ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv  ON public.messages(conversation_id, created_at DESC);

-- TESTS
CREATE TABLE IF NOT EXISTS public.tests (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    community_id     UUID,
    title            TEXT NOT NULL,
    description      TEXT,
    duration_minutes INTEGER DEFAULT 30,
    total_marks      INTEGER DEFAULT 100,
    passing_marks    INTEGER DEFAULT 40,
    instructions     TEXT,
    is_published     BOOLEAN DEFAULT false,
    scheduled_at     TIMESTAMPTZ,
    expires_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.test_questions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id        UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    question       TEXT NOT NULL,
    type           TEXT NOT NULL DEFAULT 'mcq'
                        CHECK (type IN ('mcq', 'true_false', 'short_answer', 'essay')),
    options        JSONB,
    correct_answer TEXT,
    marks          INTEGER DEFAULT 1,
    order_index    INTEGER,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.test_submissions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id      UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    answers      JSONB,
    score        INTEGER,
    max_score    INTEGER,
    percentage   NUMERIC(5,2),
    status       TEXT DEFAULT 'pending'
                      CHECK (status IN ('pending', 'graded', 'reviewed')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    graded_at    TIMESTAMPTZ,
    UNIQUE(test_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_tests_mentor ON public.tests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_tsub_student ON public.test_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_tsub_test    ON public.test_submissions(test_id);

-- MENTOR COURSES
CREATE TABLE IF NOT EXISTS public.mentor_courses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
    title         TEXT NOT NULL,
    description   TEXT,
    thumbnail_url TEXT,
    difficulty    TEXT DEFAULT 'beginner'
                       CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    is_published  BOOLEAN DEFAULT false,
    total_lessons INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_modules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   UUID NOT NULL REFERENCES public.mentor_courses(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    order_index INTEGER,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_lessons (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id        UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
    course_id        UUID NOT NULL REFERENCES public.mentor_courses(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    content          TEXT,
    video_url        TEXT,
    duration_minutes INTEGER,
    order_index      INTEGER,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id    UUID NOT NULL REFERENCES public.mentor_courses(id) ON DELETE CASCADE,
    student_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    progress     INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE(course_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.lesson_completions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id    UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
    student_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(lesson_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_mc_instructor ON public.mentor_courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_ce_student    ON public.course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_ce_course     ON public.course_enrollments(course_id);

-- ROADMAPS
CREATE TABLE IF NOT EXISTS public.roadmaps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    goal            TEXT,
    steps           JSONB DEFAULT '[]',
    is_ai_generated BOOLEAN DEFAULT false,
    status          TEXT DEFAULT 'active'
                         CHECK (status IN ('active', 'completed', 'paused')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON public.roadmaps(user_id);

-- CALENDAR EVENTS
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    start_time  TIMESTAMPTZ NOT NULL,
    end_time    TIMESTAMPTZ,
    type        TEXT DEFAULT 'event'
                     CHECK (type IN ('event', 'session', 'deadline', 'reminder')),
    color       TEXT DEFAULT '#6366f1',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER PRESENCE
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id   UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    status    TEXT DEFAULT 'offline'
                   CHECK (status IN ('online', 'away', 'offline')),
    last_seen TIMESTAMPTZ DEFAULT now()
);

-- LEADERBOARD
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
    points        INTEGER DEFAULT 0,
    rank          INTEGER,
    category      TEXT DEFAULT 'overall',
    period        TEXT DEFAULT 'all-time',
    updated_at    TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, category, period)
);

-- PROCTORING SESSIONS
CREATE TABLE IF NOT EXISTS public.proctoring_sessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id    UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at   TIMESTAMPTZ,
    violations JSONB DEFAULT '[]',
    status     TEXT DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'flagged')),
    UNIQUE(test_id, student_id)
);

-- ============================================================================
-- STEP 4: Enable RLS on all new tables
-- ============================================================================
ALTER TABLE public.conversations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_courses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctoring_sessions     ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: RLS policies — all use auth.uid() only (no bare column refs)
-- ============================================================================

-- Conversations
CREATE POLICY "conv_select" ON public.conversations FOR SELECT USING (
    id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "conv_insert" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "cp_select"   ON public.conversation_participants FOR SELECT USING (
    conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "cp_insert"   ON public.conversation_participants FOR INSERT WITH CHECK (true);

-- Tests (open select — app handles published filtering)
CREATE POLICY "tests_select" ON public.tests          FOR SELECT USING (true);
CREATE POLICY "tests_insert" ON public.tests          FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "tests_update" ON public.tests          FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "tq_select"    ON public.test_questions FOR SELECT USING (true);
CREATE POLICY "tq_insert"    ON public.test_questions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ts_select"    ON public.test_submissions FOR SELECT USING (true);
CREATE POLICY "ts_insert"    ON public.test_submissions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ts_update"    ON public.test_submissions FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Mentor Courses
CREATE POLICY "mc_select"  ON public.mentor_courses     FOR SELECT USING (true);
CREATE POLICY "mc_insert"  ON public.mentor_courses     FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "mc_update"  ON public.mentor_courses     FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "mod_select" ON public.course_modules     FOR SELECT USING (true);
CREATE POLICY "cl_select"  ON public.course_lessons     FOR SELECT USING (true);
CREATE POLICY "ce_select"  ON public.course_enrollments FOR SELECT USING (true);
CREATE POLICY "ce_insert"  ON public.course_enrollments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "lc_select"  ON public.lesson_completions FOR SELECT USING (true);
CREATE POLICY "lc_insert"  ON public.lesson_completions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Roadmaps
CREATE POLICY "roadmaps_select" ON public.roadmaps FOR SELECT USING (true);
CREATE POLICY "roadmaps_insert" ON public.roadmaps FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "roadmaps_update" ON public.roadmaps FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "roadmaps_delete" ON public.roadmaps FOR DELETE USING (auth.uid() IS NOT NULL);

-- Calendar Events
CREATE POLICY "ce_select_cal" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "ce_insert_cal" ON public.calendar_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ce_update_cal" ON public.calendar_events FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "ce_delete_cal" ON public.calendar_events FOR DELETE USING (auth.uid() IS NOT NULL);

-- User Presence
CREATE POLICY "up_select" ON public.user_presence FOR SELECT USING (true);
CREATE POLICY "up_upsert" ON public.user_presence FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "up_update" ON public.user_presence FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Leaderboard
CREATE POLICY "lb_select" ON public.leaderboard_entries FOR SELECT USING (true);

-- Proctoring
CREATE POLICY "ps_select" ON public.proctoring_sessions FOR SELECT USING (true);
CREATE POLICY "ps_insert" ON public.proctoring_sessions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ps_update" ON public.proctoring_sessions FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- STEP 6: Enable Realtime
-- ============================================================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- Done! Verify tables:
-- ============================================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
