-- Fix create_notification function ambiguity
-- The function was being called with different signatures causing PostgreSQL to be unable to determine which overload to use

-- Drop the ambiguous function and recreate with explicit signatures
DROP FUNCTION IF EXISTS create_notification(uuid, text, text, text, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS create_notification(uuid, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS create_notification(uuid, unknown, text, unknown, uuid) CASCADE;

-- Recreate the function with clear parameter names and types
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the main operation
    RAISE WARNING 'Error creating notification: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Ensure all callers use the correct signature
NOTIFY pgrst, 'reload schema';

SELECT 'create_notification function fixed' AS status;
