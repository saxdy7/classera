-- Add Mention and Notification System Features

-- ========================================
-- 1. Add mention tracking table
-- ========================================
CREATE TABLE IF NOT EXISTS community_mentions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  message_id UUID REFERENCES community_messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentioned_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT at_least_one_target CHECK (
    (post_id IS NOT NULL)::int + 
    (comment_id IS NOT NULL)::int + 
    (message_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX IF NOT EXISTS idx_community_mentions_user ON community_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_community_mentions_post ON community_mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_community_mentions_comment ON community_mentions(comment_id);
CREATE INDEX IF NOT EXISTS idx_community_mentions_message ON community_mentions(message_id);

-- Enable realtime for community_mentions (if not already enabled)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE community_mentions;
  EXCEPTION WHEN duplicate_object THEN
    -- Table already in publication, skip
  END;
END $$;

-- ========================================
-- 2. Add notification_type column if missing
-- ========================================
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'info',
ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS actor_name TEXT,
ADD COLUMN IF NOT EXISTS action_object_id UUID,
ADD COLUMN IF NOT EXISTS action_object_type TEXT;

-- ========================================
-- 3. Create automatic notification triggers
-- ========================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_related_link TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, notification_type, actor_id, related_link, is_read, created_at)
  VALUES (p_user_id, p_title, p_message, p_notification_type, p_actor_id, p_related_link, false, NOW());
END;
$$ LANGUAGE plpgsql;

-- Trigger for new posts (notify community members)
CREATE OR REPLACE FUNCTION notify_on_new_post()
RETURNS TRIGGER AS $$
DECLARE
  v_community_id UUID;
  v_mentor_id UUID;
  v_author_name TEXT;
  v_member RECORD;
  v_post_type TEXT;
BEGIN
  v_community_id := NEW.community_id;
  v_post_type := NEW.type;
  
  -- Get author name
  SELECT full_name INTO v_author_name FROM users WHERE id = NEW.author_id;
  
  -- Get community mentor
  SELECT mentor_id INTO v_mentor_id FROM communities WHERE id = v_community_id;
  
  -- Notify announcements to all members, questions only if they opt in
  IF v_post_type = 'announcement' THEN
    FOR v_member IN
      SELECT DISTINCT cm.student_id
      FROM community_members cm
      WHERE cm.community_id = v_community_id 
        AND cm.status = 'approved'
        AND cm.student_id != NEW.author_id
    LOOP
      PERFORM create_notification(
        v_member.student_id,
        'New Announcement in ' || (SELECT name FROM communities WHERE id = v_community_id),
        COALESCE(v_author_name, 'User') || ' posted: ' || SUBSTRING(NEW.content, 1, 50),
        'post_announcement',
        NEW.author_id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_notification_trigger ON community_posts;
CREATE TRIGGER post_notification_trigger
  AFTER INSERT ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_post();

-- Trigger for comments on posts (notify post author)
CREATE OR REPLACE FUNCTION notify_on_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post RECORD;
  v_commenter_name TEXT;
BEGIN
  -- Get post and commenter name
  SELECT * INTO v_post FROM community_posts WHERE id = NEW.post_id;
  SELECT full_name INTO v_commenter_name FROM users WHERE id = NEW.author_id;
  
  -- Don't notify if commenter is the post author
  IF v_post.author_id != NEW.author_id THEN
    PERFORM create_notification(
      v_post.author_id,
      'New Comment on Your Post',
      COALESCE(v_commenter_name, 'User') || ' replied: ' || SUBSTRING(NEW.content, 1, 50),
      'comment_reply',
      NEW.author_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comment_notification_trigger ON community_comments;
CREATE TRIGGER comment_notification_trigger
  AFTER INSERT ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_comment();

-- Trigger for mentions (notify mentioned user)
CREATE OR REPLACE FUNCTION notify_on_mention()
RETURNS TRIGGER AS $$
DECLARE
  v_mentioner_name TEXT;
  v_community_name TEXT;
  v_target_title TEXT;
BEGIN
  SELECT full_name INTO v_mentioner_name FROM users WHERE id = NEW.mentioned_by;
  SELECT name INTO v_community_name FROM communities WHERE id = (
    SELECT community_id FROM community_posts WHERE id = NEW.post_id
    UNION ALL
    SELECT community_id FROM community_channels cc 
      INNER JOIN community_messages cm ON cc.id = cm.channel_id 
      WHERE cm.id = NEW.message_id
    UNION ALL
    SELECT community_id FROM community_posts WHERE id = (
      SELECT post_id FROM community_comments WHERE id = NEW.comment_id
    )
  );
  
  IF NEW.post_id IS NOT NULL THEN
    v_target_title := 'a post';
  ELSIF NEW.comment_id IS NOT NULL THEN
    v_target_title := 'a comment';
  ELSE
    v_target_title := 'a message';
  END IF;
  
  PERFORM create_notification(
    NEW.mentioned_user_id,
    'You were mentioned in ' || COALESCE(v_community_name, 'Community'),
    COALESCE(v_mentioner_name, 'User') || ' mentioned you in ' || v_target_title,
    'mention',
    NEW.mentioned_by
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mention_notification_trigger ON community_mentions;
CREATE TRIGGER mention_notification_trigger
  AFTER INSERT ON community_mentions
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_mention();

-- Trigger for replies to your comments
CREATE OR REPLACE FUNCTION notify_on_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_author_id UUID;
  v_replier_name TEXT;
BEGIN
  -- Get parent comment author if this is a reply
  IF NEW.parent_comment_id IS NOT NULL THEN
    SELECT author_id INTO v_parent_author_id FROM community_comments WHERE id = NEW.parent_comment_id;
    SELECT full_name INTO v_replier_name FROM users WHERE id = NEW.author_id;
    
    IF v_parent_author_id IS NOT NULL AND v_parent_author_id != NEW.author_id THEN
      PERFORM create_notification(
        v_parent_author_id,
        'New Reply to Your Comment',
        COALESCE(v_replier_name, 'User') || ' replied: ' || SUBSTRING(NEW.content, 1, 50),
        'comment_reply',
        NEW.author_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comment_reply_notification_trigger ON community_comments;
CREATE TRIGGER comment_reply_notification_trigger
  AFTER INSERT ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment_reply();

-- ========================================
-- 4. RLS policies for mentions table
-- ========================================
ALTER TABLE community_mentions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view mentions in their communities" ON community_mentions;
DROP POLICY IF EXISTS "Users can create mentions" ON community_mentions;

-- Create new policies
CREATE POLICY "Users can view mentions in their communities"
  ON community_mentions FOR SELECT
  USING (
    mentioned_user_id = auth.uid() OR
    mentioned_by = auth.uid() OR
    post_id IN (
      SELECT id FROM community_posts cp
      WHERE cp.community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
    )
  );

CREATE POLICY "Users can create mentions"
  ON community_mentions FOR INSERT
  WITH CHECK (mentioned_by = auth.uid());

-- ========================================
-- 5. Add helper function to extract mentions from text
-- ========================================
CREATE OR REPLACE FUNCTION extract_mentions(p_text TEXT)
RETURNS TEXT[] AS $$
BEGIN
  -- Extract @mentions from text (format: @username or @first_last_name)
  RETURN (regexp_matches(p_text, '@[\w\.]+', 'g'));
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 6. Add helper function to process mentions and create notifications
-- ========================================
CREATE OR REPLACE FUNCTION process_mentions(
  p_content TEXT,
  p_post_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL,
  p_message_id UUID DEFAULT NULL,
  p_mentioned_by UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_mentions TEXT[];
  v_mention TEXT;
  v_username TEXT;
  v_user_id UUID;
  v_community_id UUID;
BEGIN
  IF p_mentioned_by IS NULL THEN
    RETURN;
  END IF;

  -- Extract mentions from content
  v_mentions := extract_mentions(p_content);
  
  -- Process each mention
  FOREACH v_mention IN ARRAY v_mentions
  LOOP
    -- Remove @ symbol
    v_username := SUBSTRING(v_mention FROM 2);
    
    -- Find user by username or name
    WITH user_search AS (
      SELECT id FROM users 
      WHERE LOWER(full_name) LIKE LOWER('%' || v_username || '%')
        OR LOWER(email) LIKE LOWER(v_username || '%')
      LIMIT 1
    )
    SELECT id INTO v_user_id FROM user_search;
    
    IF v_user_id IS NOT NULL AND v_user_id != p_mentioned_by THEN
      -- Get community_id based on which target was mentioned
      IF p_post_id IS NOT NULL THEN
        SELECT community_id INTO v_community_id FROM community_posts WHERE id = p_post_id;
      ELSIF p_comment_id IS NOT NULL THEN
        SELECT community_id INTO v_community_id FROM community_posts cp
          INNER JOIN community_comments cc ON cp.id = cc.post_id
          WHERE cc.id = p_comment_id;
      ELSIF p_message_id IS NOT NULL THEN
        SELECT community_id INTO v_community_id FROM community_channels cc
          INNER JOIN community_messages cm ON cc.id = cm.channel_id
          WHERE cm.id = p_message_id;
      END IF;
      
      -- Create mention record
      INSERT INTO community_mentions (post_id, comment_id, message_id, mentioned_user_id, mentioned_by)
      VALUES (p_post_id, p_comment_id, p_message_id, v_user_id, p_mentioned_by)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Commit: Notification and mention system added
-- ========================================
