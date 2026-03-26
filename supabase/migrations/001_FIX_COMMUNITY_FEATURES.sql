-- Fix Community Features Issues

-- ========================================
-- 1. Add missing is_muted column to community_members
-- ========================================
ALTER TABLE community_members 
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;

-- Index for faster mute lookups
CREATE INDEX IF NOT EXISTS idx_community_members_is_muted 
ON community_members(community_id, student_id) 
WHERE is_muted = true;

-- ========================================
-- 2. Fix RLS policies for community_messages
-- ========================================
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Allow all authenticated users to select messages" ON community_messages;
DROP POLICY IF EXISTS "Allow all authenticated users to insert messages" ON community_messages;
DROP POLICY IF EXISTS "Allow all authenticated users to update messages" ON community_messages;

-- Create proper RLS policies
CREATE POLICY "Users can select messages from their communities"
  ON community_messages FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM community_channels
      WHERE community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
    )
  );

CREATE POLICY "Users can insert messages to channels in their communities"
  ON community_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    channel_id IN (
      SELECT id FROM community_channels
      WHERE community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
    )
  );

CREATE POLICY "Users can update their own messages"
  ON community_messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON community_messages FOR DELETE
  USING (sender_id = auth.uid());

-- ========================================
-- 3. Enable realtime for important tables (if not already enabled)
-- ========================================
-- Only add if not already in publication
DO $$
BEGIN
  -- Try to add community_members if not already there
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE community_members;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, skip
  END;
  
  -- Try to add community_muted_users if not already there
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE community_muted_users;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, skip
  END;
  
  -- Try to add pinned_messages if not already there
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE pinned_messages;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, skip
  END;
END $$;

-- ========================================
-- 4. Add missing indexes for performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_community_posts_community_id 
ON community_posts(community_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_messages_channel_id 
ON community_messages(channel_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_comments_post_id 
ON community_comments(post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_id 
ON community_post_likes(post_id);

CREATE INDEX IF NOT EXISTS idx_community_comment_likes_comment_id
ON community_comment_likes(comment_id);

-- ========================================
-- 5. Ensure proper constraints on community tables
-- ========================================
-- Add check constraints to ensure clean data
ALTER TABLE community_posts 
ADD CONSTRAINT check_post_type 
CHECK (type IN ('normal', 'question', 'announcement', 'poll'))
NOT VALID;

ALTER TABLE community_channels 
ADD CONSTRAINT check_channel_type 
CHECK (type IN ('announcement', 'discussion', 'text', 'voice', 'video'))
NOT VALID;

-- ========================================
-- 6. Add automatic timestamps for tracking
-- ========================================
-- Ensure all tables have proper audit columns
ALTER TABLE community_members 
ADD COLUMN IF NOT EXISTS muted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE community_channels 
ADD COLUMN IF NOT EXISTS updated_by UUID DEFAULT NULL;

-- ========================================
-- 7. Fix community_moderation_logs to include more context
-- ========================================
-- Add missing action_type column if it doesn't exist
ALTER TABLE community_moderation_logs 
ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'action',
ADD COLUMN IF NOT EXISTS related_object_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS related_object_type TEXT DEFAULT NULL;

-- Index for quick lookup of moderation actions
CREATE INDEX IF NOT EXISTS idx_moderation_logs_action_type 
ON community_moderation_logs(action_type, created_at DESC);

-- ========================================
-- 8. Ensure message_edit_history is properly used
-- ========================================
-- Create an automatic trigger to populate edit history
CREATE OR REPLACE FUNCTION track_message_edits()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.edited_at IS NOT NULL AND OLD.edited_at IS DISTINCT FROM NEW.edited_at THEN
    INSERT INTO message_edit_history (message_id, old_content, edited_at)
    VALUES (OLD.id, OLD.content, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_edit_trigger ON community_messages;
CREATE TRIGGER message_edit_trigger
  AFTER UPDATE ON community_messages
  FOR EACH ROW
  EXECUTE FUNCTION track_message_edits();

-- ========================================
-- 9. Add helper function for soft deletes
-- ========================================
CREATE OR REPLACE FUNCTION soft_delete_post(post_id UUID, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE community_posts
  SET is_deleted = true, deleted_at = NOW(), deleted_reason = reason
  WHERE id = post_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION soft_delete_comment(comment_id UUID, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE community_comments
  SET is_deleted = true, deleted_at = NOW()
  WHERE id = comment_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION soft_delete_message(message_id UUID, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE community_messages
  SET is_deleted = true, deleted_at = NOW()
  WHERE id = message_id;
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Commit: All community feature fixes applied
-- ========================================
