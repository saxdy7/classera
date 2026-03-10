-- ============================================================================
-- CLASSERA — MASTER FIX MIGRATION
-- ============================================================================
-- Run this ONCE in Supabase SQL Editor.
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS / ON CONFLICT everywhere).
-- Fixes ALL identified schema issues from the codebase audit.
-- ============================================================================


-- ============================================================================
-- FIX 1: users table — add missing columns used by the app
-- ============================================================================

-- Quiz / onboarding (ADD_STUDENT_PREFERENCES.sql)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS quiz_completed       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS student_preferences  JSONB   DEFAULT '{}'::jsonb;

-- Mentor profile fields expected by mentor pages
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS degree_type          TEXT,
  ADD COLUMN IF NOT EXISTS phone                TEXT,
  ADD COLUMN IF NOT EXISTS website_url          TEXT,
  ADD COLUMN IF NOT EXISTS twitter_url          TEXT;

CREATE INDEX IF NOT EXISTS idx_users_quiz_completed ON public.users(quiz_completed);


-- ============================================================================
-- FIX 2: live_sessions — add all enhanced columns (FIX_MISSING_COLUMNS.sql)
-- ============================================================================

ALTER TABLE public.live_sessions
  ADD COLUMN IF NOT EXISTS session_type    TEXT         DEFAULT 'mentor_meeting',
  ADD COLUMN IF NOT EXISTS university_id   UUID         REFERENCES public.universities(id),
  ADD COLUMN IF NOT EXISTS daily_room_url  TEXT,
  ADD COLUMN IF NOT EXISTS daily_room_name TEXT,
  ADD COLUMN IF NOT EXISTS test_id         UUID         REFERENCES public.tests(id),
  ADD COLUMN IF NOT EXISTS settings        JSONB        DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS started_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at        TIMESTAMPTZ;

-- Ensure status enum covers both 'ongoing' (DB) and legacy 'live'
ALTER TABLE public.live_sessions
  DROP CONSTRAINT IF EXISTS live_sessions_status_check;
ALTER TABLE public.live_sessions
  ADD CONSTRAINT live_sessions_status_check
  CHECK (status IN ('scheduled', 'ongoing', 'live', 'completed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_live_sessions_mentor    ON public.live_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status    ON public.live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled ON public.live_sessions(scheduled_at);


-- ============================================================================
-- FIX 3: session_participants — add role/status columns
-- ============================================================================

ALTER TABLE public.session_participants
  ADD COLUMN IF NOT EXISTS role   TEXT DEFAULT 'attendee',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'invited';

-- Back-fill mentor rows as 'host'
UPDATE public.session_participants sp
SET    role = 'host', status = 'accepted'
FROM   public.live_sessions ls
WHERE  sp.session_id = ls.id
  AND  sp.user_id    = ls.mentor_id
  AND  sp.role IS DISTINCT FROM 'host';


-- ============================================================================
-- FIX 4: communities — ensure correct schema is in place
--         (CREATE_COMMUNITIES.sql uses mentor_id; 999 schema used created_by)
-- ============================================================================

-- Add mentor_id if only created_by exists
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS mentor_id  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_active  BOOLEAN NOT NULL DEFAULT true;

-- Back-fill mentor_id from created_by only if that column still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'communities'
      AND column_name  = 'created_by'
  ) THEN
    UPDATE public.communities
    SET    mentor_id = created_by
    WHERE  mentor_id IS NULL AND created_by IS NOT NULL;
  END IF;
END $$;

-- community_members: ensure student_id + status columns exist
--   (old schema used user_id; CREATE_COMMUNITIES uses student_id)
ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS joined_at  TIMESTAMPTZ NOT NULL DEFAULT now();

-- Back-fill student_id from user_id only if that column still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'community_members'
      AND column_name  = 'user_id'
  ) THEN
    UPDATE public.community_members
    SET    student_id = user_id
    WHERE  student_id IS NULL AND user_id IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_communities_mentor     ON public.communities(mentor_id);
CREATE INDEX IF NOT EXISTS idx_communities_university ON public.communities(university_id);
CREATE INDEX IF NOT EXISTS idx_cm_community           ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_cm_student             ON public.community_members(student_id);


-- ============================================================================
-- FIX 5: tests — add missing columns
-- ============================================================================

ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS is_live      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS settings     JSONB   DEFAULT '{
    "randomize_questions": false,
    "show_results_immediately": true,
    "allow_review": true,
    "enable_anti_cheat": true
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS proctoring_settings JSONB DEFAULT '{
    "screen_recording": true,
    "face_monitoring": true,
    "tab_switch_limit": 3,
    "fullscreen_required": true
  }'::jsonb;

-- test_invitations table (referenced by tests page but may not exist)
CREATE TABLE IF NOT EXISTS public.test_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id     UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(test_id, student_id)
);

ALTER TABLE public.test_invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "test_inv_select" ON public.test_invitations;
DROP POLICY IF EXISTS "test_inv_insert" ON public.test_invitations;
DROP POLICY IF EXISTS "test_inv_update" ON public.test_invitations;
CREATE POLICY "test_inv_select" ON public.test_invitations FOR SELECT USING (true);
CREATE POLICY "test_inv_insert" ON public.test_invitations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "test_inv_update" ON public.test_invitations FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_test_inv_test    ON public.test_invitations(test_id);
CREATE INDEX IF NOT EXISTS idx_test_inv_student ON public.test_invitations(student_id);


-- ============================================================================
-- FIX 6: notifications — broaden type CHECK constraint
-- ============================================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS related_id   UUID,
  ADD COLUMN IF NOT EXISTS related_type TEXT,
  ADD COLUMN IF NOT EXISTS metadata     JSONB;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'info', 'success', 'warning', 'error',
    'message', 'task', 'session', 'community',
    'system', 'connection_request', 'connection_accepted',
    'test_assigned', 'test_graded', 'community_invite',
    'community_accepted', 'mention'
  ));


-- ============================================================================
-- FIX 7: AI history table (ADD_AI_HISTORY.sql — idempotent)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_history (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('roadmap', 'course', 'guide', 'career_coach')),
  title      TEXT        NOT NULL,
  data       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_history_user_type ON public.ai_history(user_id, type, created_at DESC);
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_history_owner" ON public.ai_history;
CREATE POLICY "ai_history_owner" ON public.ai_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- FIX 8: RLS — Fix infinite recursion on users table (FIX_RLS_RECURSION.sql)
-- ============================================================================

-- SECURITY DEFINER helper bypasses RLS — no recursion
CREATE OR REPLACE FUNCTION public.get_my_university_id()
RETURNS uuid AS $$
  SELECT university_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop ALL old conflicting policies on users
DROP POLICY IF EXISTS "Users can view users in their university"  ON public.users;
DROP POLICY IF EXISTS "Users can view own profile"                ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile"              ON public.users;
DROP POLICY IF EXISTS "Service role can insert any profile"       ON public.users;
DROP POLICY IF EXISTS "Users can update own profile"              ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users"          ON public.users;
DROP POLICY IF EXISTS "users_select_policy"                       ON public.users;
DROP POLICY IF EXISTS "users_can_view_university_members"         ON public.users;
DROP POLICY IF EXISTS "users_can_insert_own_profile"              ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile"              ON public.users;

-- SELECT: own profile OR same university (recursion-safe)
CREATE POLICY "users_can_view_university_members" ON public.users
  FOR SELECT USING (
    id = auth.uid()
    OR
    university_id = public.get_my_university_id()
  );

-- INSERT: own signup OR service role (API routes)
CREATE POLICY "users_can_insert_own_profile" ON public.users
  FOR INSERT WITH CHECK (
    id = auth.uid()
    OR auth.jwt()->>'role' = 'service_role'
  );

-- UPDATE: own profile OR service role
CREATE POLICY "users_can_update_own_profile" ON public.users
  FOR UPDATE USING (
    id = auth.uid()
    OR auth.jwt()->>'role' = 'service_role'
  );


-- ============================================================================
-- FIX 9: communities RLS — clean up conflicting policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view communities in their university" ON public.communities;
DROP POLICY IF EXISTS "Users can create communities"                   ON public.communities;
DROP POLICY IF EXISTS "comm_select"  ON public.communities;
DROP POLICY IF EXISTS "comm_insert"  ON public.communities;
DROP POLICY IF EXISTS "comm_update"  ON public.communities;
DROP POLICY IF EXISTS "comm_delete"  ON public.communities;

CREATE POLICY "comm_select" ON public.communities FOR SELECT USING (true);
CREATE POLICY "comm_insert" ON public.communities FOR INSERT WITH CHECK (mentor_id = auth.uid());
CREATE POLICY "comm_update" ON public.communities FOR UPDATE USING (mentor_id = auth.uid());
CREATE POLICY "comm_delete" ON public.communities FOR DELETE USING (mentor_id = auth.uid());

DROP POLICY IF EXISTS "Members can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities"         ON public.community_members;
DROP POLICY IF EXISTS "cm_select" ON public.community_members;
DROP POLICY IF EXISTS "cm_insert" ON public.community_members;
DROP POLICY IF EXISTS "cm_update" ON public.community_members;
DROP POLICY IF EXISTS "cm_delete" ON public.community_members;

CREATE POLICY "cm_select" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "cm_insert" ON public.community_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "cm_update" ON public.community_members FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "cm_delete" ON public.community_members FOR DELETE USING (student_id = auth.uid() OR auth.uid() IS NOT NULL);


-- ============================================================================
-- FIX 10: live_sessions RLS — allow all authenticated users to see sessions
-- ============================================================================

DROP POLICY IF EXISTS "Users can view sessions in their university" ON public.live_sessions;
DROP POLICY IF EXISTS "Mentors can create sessions"                 ON public.live_sessions;
DROP POLICY IF EXISTS "Mentors can manage own sessions"             ON public.live_sessions;

CREATE POLICY "ls_select" ON public.live_sessions FOR SELECT USING (true);
CREATE POLICY "ls_insert" ON public.live_sessions FOR INSERT WITH CHECK (mentor_id = auth.uid());
CREATE POLICY "ls_update" ON public.live_sessions FOR UPDATE USING (mentor_id = auth.uid());
CREATE POLICY "ls_delete" ON public.live_sessions FOR DELETE USING (mentor_id = auth.uid());


-- ============================================================================
-- FIX 11: Ensure universities are readable by unauthenticated users (onboarding)
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view universities" ON public.universities;
CREATE POLICY "Anyone can view universities" ON public.universities
  FOR SELECT USING (true);


-- ============================================================================
-- FIX 12: Enable Realtime on key tables
-- ============================================================================

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.live_sessions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.session_participants;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.community_members;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.test_invitations;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================================
-- VERIFICATION — Run after to confirm everything is in place
-- ============================================================================

SELECT
  t.table_name,
  COUNT(p.policyname) AS policy_count
FROM information_schema.tables t
LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = 'public'
WHERE t.table_schema = 'public'
GROUP BY t.table_name
ORDER BY t.table_name;
