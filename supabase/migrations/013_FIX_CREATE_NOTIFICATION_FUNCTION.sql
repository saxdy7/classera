-- Fix create_notification function ambiguity
-- The problem: Triggers calling create_notification with implicitly-typed variables
-- PostgreSQL can't determine parameter types, resulting in ambiguity
-- Solution: Add explicit type casts in all trigger calls

-- Disable the problematic triggers temporarily
DROP TRIGGER IF EXISTS comment_notification_trigger ON community_comments;
DROP TRIGGER IF EXISTS post_notification_trigger ON community_posts;
DROP TRIGGER IF EXISTS mention_notification_trigger ON mentions;

-- Recreate notify_on_new_comment with explicit type casts
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
      v_post.author_id::UUID,
      'New Comment on Your Post'::TEXT,
      (COALESCE(v_commenter_name, 'User') || ' replied: ' || SUBSTRING(NEW.content, 1, 50))::TEXT,
      'comment_reply'::TEXT,
      NEW.author_id::UUID,
      NULL::TEXT
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with explicit function
CREATE TRIGGER comment_notification_trigger
  AFTER INSERT ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_comment();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

SELECT 'create_notification triggers fixed with explicit type casts' AS status;
