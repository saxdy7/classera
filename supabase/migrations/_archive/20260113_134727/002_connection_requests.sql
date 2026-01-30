-- Connection Requests Migration
-- Adds support for student-mentor connections

-- =============================================
-- CONNECTION REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one connection request per student-mentor pair
  UNIQUE(student_id, mentor_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_connection_requests_student_id ON connection_requests(student_id);
CREATE INDEX idx_connection_requests_mentor_id ON connection_requests(mentor_id);
CREATE INDEX idx_connection_requests_status ON connection_requests(status);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Students can view their own requests
CREATE POLICY "Students can view own requests"
  ON connection_requests
  FOR SELECT
  USING (auth.uid() = student_id);

-- Mentors can view requests sent to them
CREATE POLICY "Mentors can view requests to them"
  ON connection_requests
  FOR SELECT
  USING (auth.uid() = mentor_id);

-- Students can create connection requests
CREATE POLICY "Students can create requests"
  ON connection_requests
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Mentors can update requests sent to them (accept/reject)
CREATE POLICY "Mentors can update requests to them"
  ON connection_requests
  FOR UPDATE
  USING (auth.uid() = mentor_id);

-- Students can delete their pending requests
CREATE POLICY "Students can delete pending requests"
  ON connection_requests
  FOR DELETE
  USING (auth.uid() = student_id AND status = 'pending');
