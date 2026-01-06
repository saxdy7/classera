-- =============================================
-- NOTIFICATIONS AND ADDITIONAL ENHANCEMENTS
-- =============================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'test_assigned', 'community_message', 'enrollment', etc.
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}', -- Additional metadata
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" 
  ON notifications FOR SELECT 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" 
  ON notifications FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" 
  ON notifications FOR UPDATE 
  USING (user_id = auth.uid());

-- Add started_at to test_invitations if not exists
ALTER TABLE test_invitations ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Add status 'in_progress' to check constraint
ALTER TABLE test_invitations DROP CONSTRAINT IF EXISTS test_invitations_status_check;
ALTER TABLE test_invitations ADD CONSTRAINT test_invitations_status_check 
  CHECK (status IN ('pending', 'accepted', 'declined', 'in_progress', 'completed'));

-- Proctoring logs table
CREATE TABLE IF NOT EXISTS proctoring_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  violation_type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB
);

CREATE INDEX IF NOT EXISTS idx_proctoring_logs_test_id ON proctoring_logs(test_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_logs_student_id ON proctoring_logs(student_id);

-- RLS for proctoring logs
ALTER TABLE proctoring_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view proctoring logs" ON proctoring_logs;
CREATE POLICY "Authenticated users can view proctoring logs"
  ON proctoring_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert own proctoring logs" ON proctoring_logs;
CREATE POLICY "Users can insert own proctoring logs"
  ON proctoring_logs FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Add reactions column to community_messages if not exists
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';

-- Add attachments column to community_messages if not exists  
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Add is_pinned column to community_messages if not exists
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Add thread_id and thread_count for threading
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES community_messages(id);
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS thread_count INTEGER DEFAULT 0;

-- Add edited_at for message editing
ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
