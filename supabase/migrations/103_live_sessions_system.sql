-- =============================================
-- LIVE SESSIONS SYSTEM
-- For scheduling mentor meetings and proctored test sessions
-- =============================================

-- Live Sessions Table
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Session info
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT NOT NULL CHECK (session_type IN ('mentor_meeting', 'proctored_test', 'group_study', 'office_hours', 'webinar')),
  
  -- Creator/Host
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  
  -- Video/Room
  daily_room_url TEXT,
  daily_room_name TEXT,
  
  -- Linked test (for proctored tests)
  test_id UUID REFERENCES tests(id) ON DELETE SET NULL,
  
  -- Settings
  settings JSONB DEFAULT '{
    "waiting_room": true,
    "record_session": false,
    "max_participants": 50,
    "require_camera": false,
    "require_microphone": false,
    "allow_screen_share": true,
    "chat_enabled": true,
    "raise_hand_enabled": true
  }'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session Participants Table
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Participant info
  role TEXT NOT NULL DEFAULT 'attendee' CHECK (role IN ('host', 'co_host', 'presenter', 'attendee')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'joined', 'left')),
  
  -- Tracking
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  time_in_session INTEGER DEFAULT 0, -- seconds
  
  -- For proctored tests
  proctoring_data JSONB, -- violations, screenshots, etc.
  
  UNIQUE(session_id, user_id)
);

-- Session Chat Messages
CREATE TABLE IF NOT EXISTS session_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'question', 'announcement', 'system')),
  
  -- For Q&A
  is_question BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  answered_by UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session Recordings
CREATE TABLE IF NOT EXISTS session_recordings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  
  recording_url TEXT NOT NULL,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  
  -- Processing
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  transcription TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_live_sessions_host ON live_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_university ON live_sessions(university_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_scheduled ON live_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_live_sessions_status ON live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_live_sessions_test ON live_sessions(test_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_session ON session_messages(session_id);

-- Enable RLS
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_recordings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Live Sessions
DROP POLICY IF EXISTS "Users can view sessions in their university" ON live_sessions;
CREATE POLICY "Users can view sessions in their university"
  ON live_sessions FOR SELECT
  USING (
    university_id = (SELECT university_id FROM users WHERE id = auth.uid())
    OR host_id = auth.uid()
  );

DROP POLICY IF EXISTS "Mentors can create sessions" ON live_sessions;
CREATE POLICY "Mentors can create sessions"
  ON live_sessions FOR INSERT
  WITH CHECK (
    host_id = auth.uid()
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'mentor')
  );

DROP POLICY IF EXISTS "Hosts can update their sessions" ON live_sessions;
CREATE POLICY "Hosts can update their sessions"
  ON live_sessions FOR UPDATE
  USING (host_id = auth.uid());

DROP POLICY IF EXISTS "Hosts can delete their sessions" ON live_sessions;
CREATE POLICY "Hosts can delete their sessions"
  ON live_sessions FOR DELETE
  USING (host_id = auth.uid());

-- RLS Policies for Participants
DROP POLICY IF EXISTS "Users can view participants in their sessions" ON session_participants;
CREATE POLICY "Users can view participants in their sessions"
  ON session_participants FOR SELECT
  USING (
    -- User is a participant in this session (direct check on current row's session)
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM live_sessions ls 
      WHERE ls.id = session_id AND ls.host_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM live_sessions ls 
      WHERE ls.id = session_id 
      AND ls.university_id = (SELECT university_id FROM users WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Hosts can manage participants" ON session_participants;
CREATE POLICY "Hosts can manage participants"
  ON session_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM live_sessions ls 
      WHERE ls.id = session_id AND ls.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hosts can delete participants" ON session_participants;
CREATE POLICY "Hosts can delete participants"
  ON session_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM live_sessions ls 
      WHERE ls.id = session_id AND ls.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own participation" ON session_participants;
CREATE POLICY "Users can update own participation"
  ON session_participants FOR UPDATE
  USING (user_id = auth.uid());

-- RLS for Messages
DROP POLICY IF EXISTS "Participants can view session messages" ON session_messages;
CREATE POLICY "Participants can view session messages"
  ON session_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants sp 
      WHERE sp.session_id = session_id AND sp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Participants can send messages" ON session_messages;
CREATE POLICY "Participants can send messages"
  ON session_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM session_participants sp 
      WHERE sp.session_id = session_id AND sp.user_id = auth.uid()
    )
  );

-- RLS for Recordings
DROP POLICY IF EXISTS "Hosts can manage recordings" ON session_recordings;
CREATE POLICY "Hosts can manage recordings"
  ON session_recordings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM live_sessions ls 
      WHERE ls.id = session_id AND ls.host_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Participants can view recordings" ON session_recordings;
CREATE POLICY "Participants can view recordings"
  ON session_recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants sp 
      WHERE sp.session_id = session_id AND sp.user_id = auth.uid()
    )
  );

-- Function to auto-update session status
CREATE OR REPLACE FUNCTION update_session_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_session_status_trigger ON live_sessions;
CREATE TRIGGER update_session_status_trigger
  BEFORE UPDATE ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_status();

-- Function to notify participants when session starts
CREATE OR REPLACE FUNCTION notify_session_start()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'live' AND OLD.status = 'scheduled' THEN
    INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url, metadata)
    SELECT 
      sp.user_id,
      'system',
      'Session Started: ' || NEW.title,
      'The session "' || NEW.title || '" has started. Click to join!',
      NEW.id,
      'session',
      '/dashboard/student/sessions',
      jsonb_build_object('session_id', NEW.id, 'room_url', NEW.daily_room_url, 'action', 'started')
    FROM session_participants sp
    WHERE sp.session_id = NEW.id AND sp.user_id != NEW.host_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_session_start_trigger ON live_sessions;
CREATE TRIGGER notify_session_start_trigger
  AFTER UPDATE ON live_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_session_start();

-- In queries, compute end_time like this:
-- SELECT *, scheduled_at + (duration_minutes * INTERVAL '1 minute') AS end_time 
-- FROM live_sessions;
