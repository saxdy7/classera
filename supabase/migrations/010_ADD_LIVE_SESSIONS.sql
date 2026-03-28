-- PEER SESSIONS TABLE (SEPARATE from mentor live_sessions)
-- This table is for student-to-student peer sessions with Google Meet
-- Mentor sessions use the existing live_sessions table

CREATE TABLE IF NOT EXISTS public.peer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  google_meet_url TEXT NOT NULL,
  google_meet_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS peer_sessions_created_by_idx ON public.peer_sessions(created_by);
CREATE INDEX IF NOT EXISTS peer_sessions_target_student_id_idx ON public.peer_sessions(target_student_id);
CREATE INDEX IF NOT EXISTS peer_sessions_status_idx ON public.peer_sessions(status);

-- Enable RLS
ALTER TABLE public.peer_sessions ENABLE ROW LEVEL SECURITY;

-- Drop old peer session policies if they exist
DROP POLICY IF EXISTS "Users can view student sessions they're part of" ON public.peer_sessions;
DROP POLICY IF EXISTS "Users can create student sessions" ON public.peer_sessions;
DROP POLICY IF EXISTS "Session creators can update student sessions" ON public.peer_sessions;
DROP POLICY IF EXISTS "Session creators can delete student sessions" ON public.peer_sessions;

-- Create new RLS policies for peer sessions
CREATE POLICY "Users can view peer sessions they're part of"
  ON public.peer_sessions FOR SELECT
  USING (auth.uid() = created_by OR auth.uid() = target_student_id);

CREATE POLICY "Users can create peer sessions"
  ON public.peer_sessions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Session creators can update peer sessions"
  ON public.peer_sessions FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Session creators can delete peer sessions"
  ON public.peer_sessions FOR DELETE
  USING (auth.uid() = created_by);
