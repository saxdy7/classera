-- =============================================
-- TEST SYSTEM ENHANCEMENTS
-- =============================================

-- Ensure required columns exist on tests table
ALTER TABLE tests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE tests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure required columns exist on test_submissions table
ALTER TABLE test_submissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add test invitations table
CREATE TABLE IF NOT EXISTS test_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(test_id, student_id)
);

-- Add indexes for performance (use IF NOT EXISTS pattern)
CREATE INDEX IF NOT EXISTS idx_tests_mentor_id ON tests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_tests_university_id ON tests(university_id);
CREATE INDEX IF NOT EXISTS idx_tests_community_id ON tests(community_id);
CREATE INDEX IF NOT EXISTS idx_tests_scheduled_at ON tests(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tests_is_live ON tests(is_live);
CREATE INDEX IF NOT EXISTS idx_tests_created_at ON tests(created_at);

CREATE INDEX IF NOT EXISTS idx_test_submissions_test_id ON test_submissions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_student_id ON test_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_created_at ON test_submissions(created_at);

CREATE INDEX IF NOT EXISTS idx_test_invitations_test_id ON test_invitations(test_id);
CREATE INDEX IF NOT EXISTS idx_test_invitations_student_id ON test_invitations(student_id);
CREATE INDEX IF NOT EXISTS idx_test_invitations_status ON test_invitations(status);

-- =============================================
-- RLS POLICIES FOR TESTS (SIMPLIFIED - NO CROSS-TABLE REFERENCES)
-- =============================================

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Mentors can view their own tests" ON tests;
DROP POLICY IF EXISTS "Mentors can create tests" ON tests;
DROP POLICY IF EXISTS "Mentors can update their own tests" ON tests;
DROP POLICY IF EXISTS "Mentors can delete their own tests" ON tests;
DROP POLICY IF EXISTS "Students can view invited tests" ON tests;
DROP POLICY IF EXISTS "Allow all authenticated users to view tests" ON tests;
DROP POLICY IF EXISTS "Tests are viewable by authenticated users" ON tests;

-- Simple policy: authenticated users can view all tests (invitation check done in app)
CREATE POLICY "Tests are viewable by authenticated users"
  ON tests FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Mentors can create tests
CREATE POLICY "Mentors can create tests"
  ON tests FOR INSERT
  WITH CHECK (mentor_id = auth.uid());

-- Mentors can update their own tests
CREATE POLICY "Mentors can update their own tests"
  ON tests FOR UPDATE
  USING (mentor_id = auth.uid());

-- Mentors can delete their own tests
CREATE POLICY "Mentors can delete their own tests"
  ON tests FOR DELETE
  USING (mentor_id = auth.uid());

-- =============================================
-- RLS POLICIES FOR TEST SUBMISSIONS (SIMPLIFIED)
-- =============================================

ALTER TABLE test_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own submissions" ON test_submissions;
DROP POLICY IF EXISTS "Students can submit tests" ON test_submissions;
DROP POLICY IF EXISTS "Mentors can view test submissions" ON test_submissions;
DROP POLICY IF EXISTS "Mentors can update submissions" ON test_submissions;
DROP POLICY IF EXISTS "Test submissions viewable by authenticated users" ON test_submissions;

-- Authenticated users can view submissions (filtering done in app)
CREATE POLICY "Test submissions viewable by authenticated users"
  ON test_submissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Students can insert their own submissions
CREATE POLICY "Students can submit tests"
  ON test_submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Allow updates for feedback
CREATE POLICY "Mentors can update submissions"
  ON test_submissions FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- =============================================
-- RLS POLICIES FOR TEST INVITATIONS (SIMPLIFIED)
-- =============================================

ALTER TABLE test_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own invitations" ON test_invitations;
DROP POLICY IF EXISTS "Students can respond to invitations" ON test_invitations;
DROP POLICY IF EXISTS "Mentors can view test invitations" ON test_invitations;
DROP POLICY IF EXISTS "Mentors can invite students" ON test_invitations;
DROP POLICY IF EXISTS "Mentors can delete invitations" ON test_invitations;
DROP POLICY IF EXISTS "Test invitations viewable by authenticated users" ON test_invitations;

-- Authenticated users can view invitations (filtering done in app)
CREATE POLICY "Test invitations viewable by authenticated users"
  ON test_invitations FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can respond to their invitations
CREATE POLICY "Students can respond to invitations"
  ON test_invitations FOR UPDATE
  USING (student_id = auth.uid());

-- Mentors can create invitations
CREATE POLICY "Mentors can invite students"
  ON test_invitations FOR INSERT
  WITH CHECK (invited_by = auth.uid());

-- Mentors can delete invitations
CREATE POLICY "Mentors can delete invitations"
  ON test_invitations FOR DELETE
  USING (invited_by = auth.uid());

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to auto-accept invitation when test is started
CREATE OR REPLACE FUNCTION auto_accept_test_invitation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE test_invitations
  SET status = 'accepted', responded_at = NOW()
  WHERE test_id = NEW.test_id AND student_id = NEW.student_id AND status = 'pending';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_accept_invitation ON test_submissions;
CREATE TRIGGER trigger_auto_accept_invitation
  BEFORE INSERT ON test_submissions
  FOR EACH ROW
  EXECUTE FUNCTION auto_accept_test_invitation();
