-- =====================================================
-- TEST PROCTORING SYSTEM - DATABASE SCHEMA
-- =====================================================
-- This migration adds tables for test proctoring and anti-cheat

-- =====================================================
-- 1. PROCTORING SESSIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS test_proctoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Session tracking
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- Daily.co integration
  daily_room_url TEXT,
  daily_room_name TEXT,
  
  -- Recording
  recording_url TEXT,
  recording_started_at TIMESTAMP WITH TIME ZONE,
  recording_ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Monitoring status
  is_being_monitored BOOLEAN DEFAULT false,
  mentor_joined_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one session per student per test
  UNIQUE(test_id, student_id)
);

-- =====================================================
-- 2. PROCTORING ALERTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS proctoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES test_proctoring_sessions(id) ON DELETE CASCADE NOT NULL,
  
  -- Alert details
  type TEXT NOT NULL, -- 'tab_switch', 'full_screen_exit', 'multiple_faces', 'no_face', 'copy_paste', 'suspicious_behavior'
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Alert metadata
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB, -- Additional context (e.g., number of tab switches, duration)
  
  -- Evidence
  screenshot_url TEXT,
  video_timestamp INTEGER, -- Timestamp in recording (seconds)
  
  -- Status
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_note TEXT,
  
  -- Timestamps
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TEST HEARTBEAT TABLE (Anti-cheat)
-- =====================================================

CREATE TABLE IF NOT EXISTS test_heartbeats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES test_proctoring_sessions(id) ON DELETE CASCADE NOT NULL,
  
  -- Heartbeat data
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true, -- Is tab active/focused?
  is_fullscreen BOOLEAN DEFAULT true, -- Is in fullscreen mode?
  
  -- Browser state
  browser_info JSONB, -- User agent, screen resolution, etc.
  
  -- Network latency
  latency_ms INTEGER
);

-- =====================================================
-- 4. SUSPICIOUS ACTIVITIES LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS suspicious_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES test_proctoring_sessions(id) ON DELETE CASCADE NOT NULL,
  
  -- Activity details
  activity_type TEXT NOT NULL, -- 'devtools_open', 'console_access', 'network_disconnect', 'long_inactivity'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Context
  details JSONB,
  screenshot_url TEXT,
  
  -- Auto-generated or manual
  is_auto_detected BOOLEAN DEFAULT true,
  detected_by TEXT -- 'client', 'server', 'mentor'
);

-- =====================================================
-- 5. ADD PROCTORING FIELDS TO TESTS TABLE
-- =====================================================

-- Add columns to tests table for proctoring configuration
ALTER TABLE tests ADD COLUMN IF NOT EXISTS enable_proctoring BOOLEAN DEFAULT false;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS require_screen_share BOOLEAN DEFAULT false;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS require_webcam BOOLEAN DEFAULT false;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS enable_recording BOOLEAN DEFAULT false;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS max_tab_switches INTEGER DEFAULT 3;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS max_fullscreen_exits INTEGER DEFAULT 2;
ALTER TABLE tests ADD COLUMN IF NOT EXISTS auto_submit_on_violations BOOLEAN DEFAULT true;

-- Add settings JSONB column for additional test configuration
ALTER TABLE tests ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "randomize_questions": false,
  "show_results_immediately": true,
  "allow_review": true,
  "enable_anti_cheat": true
}'::jsonb;

-- Add proctoring_settings JSONB column
ALTER TABLE tests ADD COLUMN IF NOT EXISTS proctoring_settings JSONB DEFAULT '{
  "screen_recording": true,
  "face_monitoring": true,
  "tab_switch_limit": 3,
  "fullscreen_required": true
}'::jsonb;

-- =====================================================
-- 6. RLS POLICIES FOR PROCTORING TABLES
-- =====================================================

ALTER TABLE test_proctoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_heartbeats ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspicious_activities ENABLE ROW LEVEL SECURITY;

-- Students can view their own proctoring sessions
DROP POLICY IF EXISTS "Students can view own proctoring sessions" ON test_proctoring_sessions;
CREATE POLICY "Students can view own proctoring sessions"
  ON test_proctoring_sessions FOR SELECT
  USING (student_id = auth.uid());

-- Mentors can view proctoring sessions for their tests
DROP POLICY IF EXISTS "Mentors can view proctoring sessions for their tests" ON test_proctoring_sessions;
CREATE POLICY "Mentors can view proctoring sessions for their tests"
  ON test_proctoring_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tests t
      WHERE t.id = test_id
      AND t.mentor_id = auth.uid()
    )
  );

-- Students can create their own proctoring sessions
DROP POLICY IF EXISTS "Students can create own proctoring sessions" ON test_proctoring_sessions;
CREATE POLICY "Students can create own proctoring sessions"
  ON test_proctoring_sessions FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Students can update their own proctoring sessions
DROP POLICY IF EXISTS "Students can update own proctoring sessions" ON test_proctoring_sessions;
CREATE POLICY "Students can update own proctoring sessions"
  ON test_proctoring_sessions FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Mentors can update proctoring sessions for their tests (for monitoring status)
DROP POLICY IF EXISTS "Mentors can update proctoring sessions for their tests" ON test_proctoring_sessions;
CREATE POLICY "Mentors can update proctoring sessions for their tests"
  ON test_proctoring_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tests t
      WHERE t.id = test_id
      AND t.mentor_id = auth.uid()
    )
  );

-- Alerts: Students can view their own alerts
DROP POLICY IF EXISTS "Students can view own alerts" ON proctoring_alerts;
CREATE POLICY "Students can view own alerts"
  ON proctoring_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_proctoring_sessions s
      WHERE s.id = session_id
      AND s.student_id = auth.uid()
    )
  );

-- Alerts: Mentors can view alerts for their tests
DROP POLICY IF EXISTS "Mentors can view alerts for their tests" ON proctoring_alerts;
CREATE POLICY "Mentors can view alerts for their tests"
  ON proctoring_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_proctoring_sessions s
      INNER JOIN tests t ON t.id = s.test_id
      WHERE s.id = session_id
      AND t.mentor_id = auth.uid()
    )
  );

-- Alerts: System can create alerts
DROP POLICY IF EXISTS "System can create alerts" ON proctoring_alerts;
CREATE POLICY "System can create alerts"
  ON proctoring_alerts FOR INSERT
  WITH CHECK (true);

-- Alerts: Mentors can resolve alerts
DROP POLICY IF EXISTS "Mentors can resolve alerts" ON proctoring_alerts;
CREATE POLICY "Mentors can resolve alerts"
  ON proctoring_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM test_proctoring_sessions s
      INNER JOIN tests t ON t.id = s.test_id
      WHERE s.id = session_id
      AND t.mentor_id = auth.uid()
    )
  );

-- Heartbeats: Students can insert their own heartbeats
DROP POLICY IF EXISTS "Students can insert own heartbeats" ON test_heartbeats;
CREATE POLICY "Students can insert own heartbeats"
  ON test_heartbeats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_proctoring_sessions s
      WHERE s.id = session_id
      AND s.student_id = auth.uid()
    )
  );

-- Heartbeats: Mentors can view heartbeats for their tests
DROP POLICY IF EXISTS "Mentors can view heartbeats for their tests" ON test_heartbeats;
CREATE POLICY "Mentors can view heartbeats for their tests"
  ON test_heartbeats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_proctoring_sessions s
      INNER JOIN tests t ON t.id = s.test_id
      WHERE s.id = session_id
      AND t.mentor_id = auth.uid()
    )
  );

-- Suspicious activities: Students can view their own activities
DROP POLICY IF EXISTS "Students can view own suspicious activities" ON suspicious_activities;
CREATE POLICY "Students can view own suspicious activities"
  ON suspicious_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_proctoring_sessions s
      WHERE s.id = session_id
      AND s.student_id = auth.uid()
    )
  );

-- Suspicious activities: Mentors can view activities for their tests
DROP POLICY IF EXISTS "Mentors can view suspicious activities for their tests" ON suspicious_activities;
CREATE POLICY "Mentors can view suspicious activities for their tests"
  ON suspicious_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_proctoring_sessions s
      INNER JOIN tests t ON t.id = s.test_id
      WHERE s.id = session_id
      AND t.mentor_id = auth.uid()
    )
  );

-- Suspicious activities: System can create activities
DROP POLICY IF EXISTS "System can create suspicious activities" ON suspicious_activities;
CREATE POLICY "System can create suspicious activities"
  ON suspicious_activities FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_test 
  ON test_proctoring_sessions(test_id);

CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_student 
  ON test_proctoring_sessions(student_id);

CREATE INDEX IF NOT EXISTS idx_proctoring_alerts_session 
  ON proctoring_alerts(session_id);

CREATE INDEX IF NOT EXISTS idx_proctoring_alerts_severity 
  ON proctoring_alerts(severity);

CREATE INDEX IF NOT EXISTS idx_test_heartbeats_session 
  ON test_heartbeats(session_id);

CREATE INDEX IF NOT EXISTS idx_test_heartbeats_timestamp 
  ON test_heartbeats(timestamp);

CREATE INDEX IF NOT EXISTS idx_suspicious_activities_session 
  ON suspicious_activities(session_id);

-- =====================================================
-- 8. CREATE FUNCTION TO AUTO-GENERATE ALERTS
-- =====================================================

CREATE OR REPLACE FUNCTION check_heartbeat_violations()
RETURNS TRIGGER AS $$
DECLARE
  session_record RECORD;
  test_record RECORD;
  tab_switch_count INTEGER;
  fullscreen_exit_count INTEGER;
BEGIN
  -- Get session and test details
  SELECT * INTO session_record FROM test_proctoring_sessions WHERE id = NEW.session_id;
  SELECT * INTO test_record FROM tests WHERE id = session_record.test_id;
  
  -- Check if not active (tab switch)
  IF NOT NEW.is_active THEN
    -- Count recent tab switches (last 5 minutes)
    SELECT COUNT(*) INTO tab_switch_count
    FROM test_heartbeats
    WHERE session_id = NEW.session_id
    AND is_active = false
    AND timestamp > NOW() - INTERVAL '5 minutes';
    
    -- Create alert if threshold exceeded
    IF tab_switch_count >= test_record.max_tab_switches THEN
      INSERT INTO proctoring_alerts (session_id, type, severity, title, description)
      VALUES (
        NEW.session_id,
        'tab_switch',
        'high',
        'Multiple Tab Switches Detected',
        format('Student switched tabs %s times in the last 5 minutes', tab_switch_count)
      );
    END IF;
  END IF;
  
  -- Check if not fullscreen
  IF NOT NEW.is_fullscreen THEN
    -- Count recent fullscreen exits (last 10 minutes)
    SELECT COUNT(*) INTO fullscreen_exit_count
    FROM test_heartbeats
    WHERE session_id = NEW.session_id
    AND is_fullscreen = false
    AND timestamp > NOW() - INTERVAL '10 minutes';
    
    -- Create alert if threshold exceeded
    IF fullscreen_exit_count >= test_record.max_fullscreen_exits THEN
      INSERT INTO proctoring_alerts (session_id, type, severity, title, description)
      VALUES (
        NEW.session_id,
        'full_screen_exit',
        'critical',
        'Multiple Fullscreen Exits Detected',
        format('Student exited fullscreen %s times in the last 10 minutes', fullscreen_exit_count)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check violations on every heartbeat
DROP TRIGGER IF EXISTS check_heartbeat_violations_trigger ON test_heartbeats;
CREATE TRIGGER check_heartbeat_violations_trigger
  AFTER INSERT ON test_heartbeats
  FOR EACH ROW
  EXECUTE FUNCTION check_heartbeat_violations();

-- =====================================================
-- 9. CREATE FUNCTION TO AUTO-END SESSIONS
-- =====================================================

CREATE OR REPLACE FUNCTION auto_end_proctoring_sessions()
RETURNS void AS $$
BEGIN
  -- Auto-end sessions where test has ended
  UPDATE test_proctoring_sessions s
  SET 
    ended_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
  FROM tests t
  WHERE s.test_id = t.id
  AND s.ended_at IS NULL
  AND t.scheduled_at + (t.duration_minutes || ' minutes')::INTERVAL < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. ADD COMMENTS
-- =====================================================

COMMENT ON TABLE test_proctoring_sessions IS 'Tracks video proctoring sessions for tests';
COMMENT ON TABLE proctoring_alerts IS 'Stores alerts generated during proctoring (tab switches, exits, etc.)';
COMMENT ON TABLE test_heartbeats IS 'Tracks student activity heartbeats during tests for anti-cheat';
COMMENT ON TABLE suspicious_activities IS 'Logs suspicious activities detected during tests';
