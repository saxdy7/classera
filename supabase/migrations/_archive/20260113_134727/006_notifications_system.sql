-- =============================================
-- NOTIFICATIONS SYSTEM
-- =============================================
-- This migration creates a comprehensive notification system with realtime support

-- =============================================
-- 1. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Notification content
  type TEXT NOT NULL CHECK (type IN (
    'message',           -- New message received
    'connection_request', -- New connection request
    'connection_accepted', -- Connection accepted
    'test_assigned',     -- New test assigned
    'test_graded',       -- Test graded
    'community_invite',  -- Community invitation
    'community_accepted', -- Community join accepted
    'mention',           -- Mentioned in message
    'system'             -- System notification
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities (optional)
  related_id UUID,      -- ID of related entity (message_id, test_id, etc.)
  related_type TEXT,    -- Type of related entity ('message', 'test', 'community', etc.)
  
  -- Action URL (where to go when clicked)
  action_url TEXT,
  
  -- Metadata (JSON for additional data)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- =============================================
-- 3. ENABLE RLS
-- =============================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Allow system to insert notifications (for triggers)
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================
-- 4. AUTO-UPDATE TRIGGER
-- =============================================
DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;

CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.read = TRUE AND OLD.read = FALSE THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- =============================================
-- 5. REALTIME BROADCAST TRIGGER
-- =============================================
DROP FUNCTION IF EXISTS notifications_broadcast_trigger() CASCADE;

CREATE OR REPLACE FUNCTION notifications_broadcast_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Broadcast to user-specific notification topic
  PERFORM realtime.broadcast_changes(
    'notifications:' || COALESCE(NEW.user_id, OLD.user_id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS notifications_broadcast_trigger ON public.notifications;

CREATE TRIGGER notifications_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION notifications_broadcast_trigger();

-- =============================================
-- 6. HELPER FUNCTIONS
-- =============================================

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_id UUID DEFAULT NULL,
  p_related_type TEXT DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_id,
    related_type,
    action_url,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_related_id,
    p_related_type,
    p_action_url,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET read = TRUE
  WHERE id = p_notification_id
    AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read = TRUE
  WHERE user_id = auth.uid()
    AND read = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.notifications
  WHERE user_id = auth.uid()
    AND read = FALSE;
  
  RETURN v_count;
END;
$$;

-- =============================================
-- 7. AUTOMATIC NOTIFICATION TRIGGERS
-- =============================================

-- Trigger: Notify when new message received
DROP FUNCTION IF EXISTS notify_new_message() CASCADE;

CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_name TEXT;
BEGIN
  -- Get sender's name
  SELECT full_name INTO v_sender_name
  FROM public.users
  WHERE id = NEW.sender_id;
  
  -- Create notification for receiver
  PERFORM create_notification(
    NEW.receiver_id,
    'message',
    'New Message',
    v_sender_name || ' sent you a message',
    NEW.id,
    'message',
    '/dashboard/' || (SELECT role FROM public.users WHERE id = NEW.receiver_id) || '/messages?userId=' || NEW.sender_id::text,
    jsonb_build_object('sender_id', NEW.sender_id, 'sender_name', v_sender_name)
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_new_message_trigger ON public.messages;

CREATE TRIGGER notify_new_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  WHEN (NEW.receiver_id IS NOT NULL) -- Only for 1-on-1 messages
  EXECUTE FUNCTION notify_new_message();

-- Trigger: Notify when connection request is accepted
DROP FUNCTION IF EXISTS notify_connection_accepted() CASCADE;

CREATE OR REPLACE FUNCTION notify_connection_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mentor_name TEXT;
BEGIN
  -- Only trigger when status changes to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Get mentor's name
    SELECT full_name INTO v_mentor_name
    FROM public.users
    WHERE id = NEW.mentor_id;
    
    -- Notify student
    PERFORM create_notification(
      NEW.student_id,
      'connection_accepted',
      'Connection Accepted',
      v_mentor_name || ' accepted your connection request',
      NEW.id,
      'connection',
      '/dashboard/student/find-mentors',
      jsonb_build_object('mentor_id', NEW.mentor_id, 'mentor_name', v_mentor_name)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_connection_accepted_trigger ON public.connection_requests;

-- Only create trigger if connection_requests table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'connection_requests') THEN
    CREATE TRIGGER notify_connection_accepted_trigger
      AFTER UPDATE ON public.connection_requests
      FOR EACH ROW
      EXECUTE FUNCTION notify_connection_accepted();
  END IF;
END $$;

-- =============================================
-- 8. CLEANUP FUNCTION (Optional)
-- =============================================

-- Function to delete old read notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE read = TRUE
    AND read_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- =============================================
-- 9. COMMENTS
-- =============================================
COMMENT ON TABLE public.notifications IS 'Stores user notifications with realtime support';
COMMENT ON FUNCTION create_notification IS 'Helper function to create a new notification';
COMMENT ON FUNCTION mark_notification_read IS 'Marks a single notification as read';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Marks all notifications as read for current user';
COMMENT ON FUNCTION get_unread_notifications_count IS 'Returns count of unread notifications for current user';
COMMENT ON FUNCTION cleanup_old_notifications IS 'Deletes read notifications older than 30 days';

-- =============================================
-- SETUP COMPLETE
-- =============================================
-- Next steps:
-- 1. Enable Realtime on notifications table in Supabase Dashboard
-- 2. Create API routes for notifications
-- 3. Create React components for notification UI
-- 4. Test notification creation and realtime updates
