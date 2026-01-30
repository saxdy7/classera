-- =============================================
-- FIX NOTIFICATION SCHEMA IN LIVE SESSIONS TRIGGER
-- =============================================
-- This migration updates the notify_session_start trigger to use the correct
-- notification schema (related_id, related_type, metadata, action_url)
-- instead of the old 'data' column which doesn't exist.

-- Update the function to use correct notification schema
CREATE OR REPLACE FUNCTION notify_session_start()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'live' AND OLD.status = 'scheduled' THEN
    INSERT INTO notifications (user_id, type, title, message, related_id, related_type, action_url, metadata)
    SELECT 
      sp.user_id,
      'system',
      'Session Started: ' || NEW.title,
      'The session "' || NEW.title || '" has started. Click to join!',
      NEW.id,
      'session',
      '/dashboard/student/sessions',
      jsonb_build_object('session_id', NEW.id, 'room_url', NEW.daily_room_url, 'action', 'started')
    FROM session_participants sp
    WHERE sp.session_id = NEW.id AND sp.user_id != NEW.host_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger remains the same
-- DROP TRIGGER IF EXISTS notify_session_start_trigger ON live_sessions;
-- CREATE TRIGGER notify_session_start_trigger
--   AFTER UPDATE ON live_sessions
--   FOR EACH ROW
--   EXECUTE FUNCTION notify_session_start();
