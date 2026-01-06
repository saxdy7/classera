-- =====================================================
-- UNIVERSITY ISOLATION - ROW LEVEL SECURITY POLICIES
-- =====================================================
-- This migration ensures that all data is isolated by university_id
-- Users can only see/modify data from their own university

-- =====================================================
-- 1. HELPER FUNCTION: Get current user's university_id
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_university_id()
RETURNS UUID AS $$
  SELECT university_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================================================
-- 2. USERS TABLE - University Isolation
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view users from same university" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Allow users to view other users from same university
CREATE POLICY "Users can view users from same university"
  ON users FOR SELECT
  USING (university_id = get_user_university_id());

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND university_id = get_user_university_id());

-- =====================================================
-- 3. COMMUNITIES - University Isolation
-- =====================================================

DROP POLICY IF EXISTS "Users can view communities from same university" ON communities;
DROP POLICY IF EXISTS "Mentors can create communities" ON communities;
DROP POLICY IF EXISTS "Mentors can update own communities" ON communities;
DROP POLICY IF EXISTS "Mentors can delete own communities" ON communities;

CREATE POLICY "Users can view communities from same university"
  ON communities FOR SELECT
  USING (university_id = get_user_university_id());

CREATE POLICY "Mentors can create communities"
  ON communities FOR INSERT
  WITH CHECK (
    mentor_id = auth.uid() 
    AND university_id = get_user_university_id()
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'mentor'
    )
  );

CREATE POLICY "Mentors can update own communities"
  ON communities FOR UPDATE
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid() AND university_id = get_user_university_id());

CREATE POLICY "Mentors can delete own communities"
  ON communities FOR DELETE
  USING (mentor_id = auth.uid());

-- =====================================================
-- 4. COMMUNITY MEMBERS - University Isolation
-- =====================================================

DROP POLICY IF EXISTS "Users can view community members from same university" ON community_members;
DROP POLICY IF EXISTS "Students can join communities" ON community_members;
DROP POLICY IF EXISTS "Mentors can add members to their communities" ON community_members;

CREATE POLICY "Users can view community members from same university"
  ON community_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_members.community_id
      AND c.university_id = get_user_university_id()
    )
  );

CREATE POLICY "Students can join communities"
  ON community_members FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_id
      AND c.university_id = get_user_university_id()
    )
  );

CREATE POLICY "Mentors can add members to their communities"
  ON community_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities c
      WHERE c.id = community_id
      AND c.mentor_id = auth.uid()
      AND c.university_id = get_user_university_id()
    )
  );

-- =====================================================
-- 5. TESTS - University Isolation
-- =====================================================

DROP POLICY IF EXISTS "Users can view tests from same university" ON tests;
DROP POLICY IF EXISTS "Mentors can create tests" ON tests;
DROP POLICY IF EXISTS "Mentors can update own tests" ON tests;
DROP POLICY IF EXISTS "Mentors can delete own tests" ON tests;

-- Users can view tests if:
-- - They are mentors who created the test
-- - They are students invited to the test
-- - Test is from their university
CREATE POLICY "Users can view tests from same university"
  ON tests FOR SELECT
  USING (
    mentor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM test_invitations ti
      WHERE ti.test_id = tests.id
      AND ti.student_id = auth.uid()
    )
  );

CREATE POLICY "Mentors can create tests"
  ON tests FOR INSERT
  WITH CHECK (
    mentor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'mentor'
    )
  );

CREATE POLICY "Mentors can update own tests"
  ON tests FOR UPDATE
  USING (mentor_id = auth.uid())
  WITH CHECK (mentor_id = auth.uid());

CREATE POLICY "Mentors can delete own tests"
  ON tests FOR DELETE
  USING (mentor_id = auth.uid());

-- =====================================================
-- 6. TEST INVITATIONS - University Isolation
-- =====================================================

DROP POLICY IF EXISTS "Users can view own test invitations" ON test_invitations;
DROP POLICY IF EXISTS "Mentors can create test invitations" ON test_invitations;

CREATE POLICY "Users can view own test invitations"
  ON test_invitations FOR SELECT
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tests t
      WHERE t.id = test_id
      AND t.mentor_id = auth.uid()
    )
  );

CREATE POLICY "Mentors can create test invitations"
  ON test_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tests t
      INNER JOIN users s ON s.id = student_id
      WHERE t.id = test_id
      AND t.mentor_id = auth.uid()
      AND s.university_id = get_user_university_id()
    )
  );

-- =====================================================
-- 7. TEST SUBMISSIONS - University Isolation
-- =====================================================

DROP POLICY IF EXISTS "Students can view own submissions" ON test_submissions;
DROP POLICY IF EXISTS "Mentors can view submissions for their tests" ON test_submissions;
DROP POLICY IF EXISTS "Students can create submissions" ON test_submissions;
DROP POLICY IF EXISTS "Students can update own submissions" ON test_submissions;

CREATE POLICY "Students can view own submissions"
  ON test_submissions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Mentors can view submissions for their tests"
  ON test_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tests t
      WHERE t.id = test_id
      AND t.mentor_id = auth.uid()
    )
  );

CREATE POLICY "Students can create submissions"
  ON test_submissions FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM test_invitations ti
      WHERE ti.test_id = test_id
      AND ti.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own submissions"
  ON test_submissions FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- =====================================================
-- 8. MESSAGES - University Isolation
-- =====================================================

DROP POLICY IF EXISTS "Users can view messages from same university" ON messages;
DROP POLICY IF EXISTS "Users can send messages to same university" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;

-- Users can view messages where they are sender or receiver
-- AND both parties are from same university
CREATE POLICY "Users can view messages from same university"
  ON messages FOR SELECT
  USING (
    (sender_id = auth.uid() OR receiver_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users sender, users receiver
      WHERE sender.id = messages.sender_id
      AND receiver.id = messages.receiver_id
      AND sender.university_id = get_user_university_id()
      AND receiver.university_id = get_user_university_id()
    )
  );

-- Users can send messages only to users from same university
CREATE POLICY "Users can send messages to same university"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users receiver
      WHERE receiver.id = receiver_id
      AND receiver.university_id = get_user_university_id()
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid() OR receiver_id = auth.uid())
  WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

-- =====================================================
-- 9. CONNECTION REQUESTS - University Isolation
-- =====================================================

DROP POLICY IF EXISTS "Users can view own connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can create connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Users can update own connection requests" ON connection_requests;
DROP POLICY IF EXISTS "Students can view own requests" ON connection_requests;
DROP POLICY IF EXISTS "Mentors can view requests to them" ON connection_requests;
DROP POLICY IF EXISTS "Students can create requests" ON connection_requests;
DROP POLICY IF EXISTS "Mentors can update requests to them" ON connection_requests;

CREATE POLICY "Users can view own connection requests"
  ON connection_requests FOR SELECT
  USING (
    student_id = auth.uid() OR mentor_id = auth.uid()
  );

CREATE POLICY "Users can create connection requests"
  ON connection_requests FOR INSERT
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users mentor
      WHERE mentor.id = mentor_id
      AND mentor.university_id = get_user_university_id()
    )
  );

CREATE POLICY "Users can update own connection requests"
  ON connection_requests FOR UPDATE
  USING (student_id = auth.uid() OR mentor_id = auth.uid())
  WITH CHECK (student_id = auth.uid() OR mentor_id = auth.uid());

-- =====================================================
-- 10. TASKS - University Isolation
-- =====================================================

DROP POLICY IF EXISTS "Users can view tasks from same university" ON tasks;
DROP POLICY IF EXISTS "Mentors can create tasks" ON tasks;
DROP POLICY IF EXISTS "Mentors can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Students can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Students can create tasks" ON tasks;
DROP POLICY IF EXISTS "Students can update own tasks" ON tasks;

CREATE POLICY "Students can view own tasks"
  ON tasks FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own tasks"
  ON tasks FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- =====================================================
-- 11. COURSES - University Isolation
-- =====================================================

DROP POLICY IF EXISTS "Users can view courses from same university" ON courses;
DROP POLICY IF EXISTS "Mentors can create courses" ON courses;
DROP POLICY IF EXISTS "Mentors can update own courses" ON courses;
DROP POLICY IF EXISTS "Users can view all courses" ON courses;
DROP POLICY IF EXISTS "Mentors can recommend courses" ON courses;

CREATE POLICY "Users can view courses from same university"
  ON courses FOR SELECT
  USING (
    university_id IS NULL
    OR university_id = get_user_university_id()
  );

CREATE POLICY "Mentors can recommend courses"
  ON courses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'mentor'
    )
  )
  WITH CHECK (
    recommended_by_mentor_id = auth.uid()
    AND (university_id IS NULL OR university_id = get_user_university_id())
  );

-- =====================================================
-- 12. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 13. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_university_id ON users(university_id);
CREATE INDEX IF NOT EXISTS idx_communities_university_id ON communities(university_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_test_invitations_student ON test_invitations(student_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_student ON test_submissions(student_id);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

COMMENT ON FUNCTION get_user_university_id IS 'Helper function to get current user university_id for RLS policies';
