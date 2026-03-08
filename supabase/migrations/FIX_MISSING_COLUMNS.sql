-- ============================================================================
-- FIX_MISSING_COLUMNS.sql
-- Run this in the Supabase SQL Editor to restore richer features.
--
-- Background: The DB was originally created from archive/001_initial_schema.sql.
-- Migrations 102 (proctoring) and 103 (live sessions enhanced) were never run,
-- so several columns expected by the codebase are missing.
-- The API routes have been patched to work without these columns, but running
-- this migration will re-enable the full feature set.
-- ============================================================================

-- ============================================================
-- 1. live_sessions — add enhanced columns from archive/103
-- ============================================================
ALTER TABLE public.live_sessions
    ADD COLUMN IF NOT EXISTS host_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS session_type    TEXT DEFAULT 'mentor_meeting',
    ADD COLUMN IF NOT EXISTS university_id   UUID REFERENCES public.universities(id),
    ADD COLUMN IF NOT EXISTS daily_room_url  TEXT,
    ADD COLUMN IF NOT EXISTS daily_room_name TEXT,
    ADD COLUMN IF NOT EXISTS test_id         UUID REFERENCES public.tests(id),
    ADD COLUMN IF NOT EXISTS settings        JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS started_at      TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ended_at        TIMESTAMPTZ;

-- Back-fill host_id from mentor_id for existing rows
UPDATE public.live_sessions
SET host_id = mentor_id
WHERE host_id IS NULL;

-- ============================================================
-- 2. session_participants — add role/status from archive/103
-- ============================================================
ALTER TABLE public.session_participants
    ADD COLUMN IF NOT EXISTS role   TEXT DEFAULT 'attendee',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'invited';

-- Back-fill mentor as 'host' for existing participant rows
UPDATE public.session_participants sp
SET role = 'host', status = 'accepted'
FROM public.live_sessions ls
WHERE sp.session_id = ls.id
  AND sp.user_id = ls.mentor_id
  AND sp.role IS DISTINCT FROM 'host';

-- ============================================================
-- 3. tests — add settings/proctoring_settings from archive/102
-- ============================================================
ALTER TABLE public.tests
    ADD COLUMN IF NOT EXISTS settings            JSONB DEFAULT '{
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

-- ============================================================
-- 4. notifications — make type constraint more permissive
--    (adds 'system' and 'session' if not already present)
-- ============================================================
-- If the notifications table was created by 999_CLEAN it uses a CHECK constraint.
-- Add the missing columns and loosen the type check.
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS related_id   UUID,
    ADD COLUMN IF NOT EXISTS related_type TEXT,
    ADD COLUMN IF NOT EXISTS metadata     JSONB;

-- Drop old type constraint and replace with a broader one
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
