-- =============================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =============================================
-- Run this in Supabase SQL Editor to add missing indexes for better performance
-- These indexes will significantly improve query performance for high-traffic operations

-- Messages table indexes (for OLD schema with sender_id/receiver_id)
-- Note: If you're using migration 020 (conversation-based), these will fail - that's OK, skip this section
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
  ON messages(sender_id, receiver_id);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender 
  ON messages(receiver_id, sender_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at_desc 
  ON messages(created_at DESC);

-- Community members lookups
CREATE INDEX IF NOT EXISTS idx_community_members_student_approved 
  ON community_members(student_id) 
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_community_members_community_status 
  ON community_members(community_id, status);

-- Test submissions for mentor dashboard
CREATE INDEX IF NOT EXISTS idx_test_submissions_test_student 
  ON test_submissions(test_id, student_id);

CREATE INDEX IF NOT EXISTS idx_test_submissions_student_submitted 
  ON test_submissions(student_id, submitted_at DESC NULLS LAST);

-- Notifications for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON notifications(user_id, read_at) 
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

-- Leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_university_month_rank 
  ON leaderboard(university_id, year, month, rank);

-- Tests by university and mentor
CREATE INDEX IF NOT EXISTS idx_tests_university_mentor 
  ON tests(university_id, mentor_id);

CREATE INDEX IF NOT EXISTS idx_tests_scheduled 
  ON tests(scheduled_at DESC) 
  WHERE scheduled_at IS NOT NULL;

-- Community posts for feed
CREATE INDEX IF NOT EXISTS idx_community_posts_community_created 
  ON community_posts(community_id, created_at DESC) 
  WHERE is_deleted = false;

-- Tasks by status
CREATE INDEX IF NOT EXISTS idx_tasks_student_status 
  ON tasks(student_id, status);

-- Courses by specialization (using schema from migration 107b)
CREATE INDEX IF NOT EXISTS idx_courses_difficulty_published 
  ON courses(difficulty) 
  WHERE is_published = true;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Performance indexes created successfully!';
  RAISE NOTICE '✅ Query performance should be significantly improved';
END $$;
