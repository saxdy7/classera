-- Test Security Enhancement Migration
-- Adds secure test sessions with tokens, session tracking, and audit logs

-- Create test_sessions table for secure test access
CREATE TABLE IF NOT EXISTS public.test_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE, -- Secure session token
    browser_fingerprint VARCHAR(255), -- Browser/device fingerprint
    ip_address INET, -- IP address of student
    user_agent TEXT, -- Browser user agent
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    submission_id UUID REFERENCES public.test_submissions(id),

    -- Security tracking
    tab_switches_count INT DEFAULT 0,
    fullscreen_exits_count INT DEFAULT 0,
    face_detection_failures_count INT DEFAULT 0,
    copy_paste_attempts_count INT DEFAULT 0,
    screen_share_stopped_count INT DEFAULT 0,
    suspicious_activity_count INT DEFAULT 0,
    total_violations INT DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,

    -- Session state
    is_active BOOLEAN DEFAULT TRUE,
    is_submitted BOOLEAN DEFAULT FALSE,
    was_interrupted BOOLEAN DEFAULT FALSE,

    -- Audit trail
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_expiry CHECK (expires_at > started_at)
);

-- Partial unique index for active sessions only
CREATE UNIQUE INDEX idx_test_sessions_unique_active
ON public.test_sessions(test_id, student_id)
WHERE is_active = TRUE;

-- Audit log for test access
CREATE TABLE IF NOT EXISTS public.test_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'session_start', 'violation', 'submission', 'session_end', 'irregular_activity'
    event_details JSONB,
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Test proctoring violations detailed log
CREATE TABLE IF NOT EXISTS public.test_proctoring_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL, -- 'tab_switch', 'fullscreen_exit', 'face_detection', 'copy_paste', 'screen_share', 'suspicious'
    violation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    severity VARCHAR(20) DEFAULT 'warning', -- 'warning', 'critical'
    device_info JSONB, -- Browser/device context
    additional_data JSONB, -- Extra violation details
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table to track test submission integrity
CREATE TABLE IF NOT EXISTS public.test_submission_integrity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.test_submissions(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
    submission_hash VARCHAR(255) NOT NULL, -- Hash of answers for integrity check
    submission_encrypted BYTEA, -- Encrypted submission backup
    integrity_verified BOOLEAN DEFAULT FALSE,
    verification_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_test_sessions_test_student ON public.test_sessions(test_id, student_id);
CREATE INDEX idx_test_sessions_token ON public.test_sessions(session_token);
CREATE INDEX idx_test_sessions_active ON public.test_sessions(is_active, expires_at);
CREATE INDEX idx_test_audit_log_session ON public.test_audit_log(session_id);
CREATE INDEX idx_test_audit_log_event ON public.test_audit_log(event_type, created_at);
CREATE INDEX idx_test_proctoring_violations_session ON public.test_proctoring_violations(session_id);
CREATE INDEX idx_test_submission_integrity_submission ON public.test_submission_integrity(submission_id);

-- Add new columns to test_submissions if they don't exist
ALTER TABLE public.test_submissions
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.test_sessions(id),
ADD COLUMN IF NOT EXISTS submission_integrity_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS submission_encrypted BYTEA,
ADD COLUMN IF NOT EXISTS student_device_info JSONB,
ADD COLUMN IF NOT EXISTS submission_hash VARCHAR(255);

-- RLS Policies for test_sessions
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read their own test sessions" ON public.test_sessions
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Mentors can read sessions for their tests" ON public.test_sessions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.tests
        WHERE tests.id = test_sessions.test_id
        AND tests.mentor_id = auth.uid()
    )
);

CREATE POLICY "System can insert test sessions" ON public.test_sessions
FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "System can update test sessions" ON public.test_sessions
FOR UPDATE USING (TRUE);

-- RLS Policies for test_audit_log
ALTER TABLE public.test_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read their own audit logs" ON public.test_audit_log
FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Mentors can read audit logs for their tests" ON public.test_audit_log
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.tests
        WHERE tests.id = test_audit_log.test_id
        AND tests.mentor_id = auth.uid()
    )
);

-- RLS Policies for test_proctoring_violations
ALTER TABLE public.test_proctoring_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can read violations for their tests" ON public.test_proctoring_violations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.test_sessions
        JOIN public.tests ON tests.id = test_sessions.test_id
        WHERE test_sessions.id = test_proctoring_violations.session_id
        AND tests.mentor_id = auth.uid()
    )
);

-- RLS Policies for test_submission_integrity
ALTER TABLE public.test_submission_integrity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentors can read submission integrity for their tests" ON public.test_submission_integrity
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.test_submissions
        JOIN public.tests ON tests.id = test_submissions.test_id
        WHERE test_submissions.id = test_submission_integrity.submission_id
        AND tests.mentor_id = auth.uid()
    )
);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_test_sessions()
RETURNS void AS $$
BEGIN
    UPDATE public.test_sessions
    SET is_active = FALSE, was_interrupted = TRUE
    WHERE is_active = TRUE
    AND expires_at < NOW()
    AND is_submitted = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate test session
CREATE OR REPLACE FUNCTION validate_test_session(p_session_token VARCHAR)
RETURNS TABLE (
    session_id UUID,
    test_id UUID,
    student_id UUID,
    is_valid BOOLEAN,
    is_expired BOOLEAN,
    violations_count INT,
    time_remaining_seconds INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ts.id,
        ts.test_id,
        ts.student_id,
        ts.is_active AND ts.expires_at > NOW() AND NOT ts.is_submitted,
        ts.expires_at < NOW(),
        ts.total_violations,
        EXTRACT(EPOCH FROM (ts.expires_at - NOW()))::INT
    FROM public.test_sessions ts
    WHERE ts.session_token = p_session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.test_sessions TO authenticated;
GRANT SELECT, INSERT ON public.test_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.test_proctoring_violations TO authenticated;
GRANT SELECT, INSERT ON public.test_submission_integrity TO authenticated;
