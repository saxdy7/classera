-- ============================================================
-- FIX LIVE SESSIONS RLS
-- ============================================================
-- The original SELECT policy only allowed users to see sessions from mentors
-- in the same university. This blocked:
--   1. Students with no university_id
--   2. Cross-university sessions
--   3. Direct invitees with no university match
-- New policy: mentors see their own sessions; students see sessions they're
-- invited to (via session_participants) OR from mentors in their university.
-- ============================================================

DROP POLICY IF EXISTS "Users can view sessions in their university" ON public.live_sessions;
DROP POLICY IF EXISTS "Users can view their sessions" ON public.live_sessions;

CREATE POLICY "Users can view their sessions" ON public.live_sessions
    FOR SELECT USING (
        -- Mentor owns this session
        mentor_id = auth.uid()
        OR
        -- Student is a participant in this session
        id IN (
            SELECT session_id FROM public.session_participants
            WHERE user_id = auth.uid()
        )
        OR
        -- Same-university mentor sessions (original behaviour, but only when university is set)
        (
            mentor_id IN (
                SELECT id FROM public.users
                WHERE university_id IS NOT NULL
                  AND university_id = (
                      SELECT university_id FROM public.users
                      WHERE id = auth.uid() AND university_id IS NOT NULL
                  )
            )
        )
    );

-- Also ensure participants can INSERT themselves (join a session)
DROP POLICY IF EXISTS "Users can join sessions" ON public.session_participants;
CREATE POLICY "Users can join sessions" ON public.session_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Mentors (and admins via admin client) can add participants for others
DROP POLICY IF EXISTS "Mentors can add participants" ON public.session_participants;
CREATE POLICY "Mentors can add participants" ON public.session_participants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.live_sessions
            WHERE id = session_id AND mentor_id = auth.uid()
        )
    );

-- Participants can remove themselves
DROP POLICY IF EXISTS "Users can leave sessions" ON public.session_participants;
CREATE POLICY "Users can leave sessions" ON public.session_participants
    FOR DELETE USING (user_id = auth.uid());
