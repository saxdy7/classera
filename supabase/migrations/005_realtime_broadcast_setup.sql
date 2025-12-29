-- =============================================
-- REALTIME BROADCAST SETUP FOR CLASSERA
-- =============================================
-- This migration sets up Supabase Realtime with proper authorization
-- for both 1-on-1 messages and community messages

-- =============================================
-- 1. ENABLE RLS ON REALTIME.MESSAGES
-- =============================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. RLS POLICIES FOR REALTIME.MESSAGES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "realtime_1on1_messages_select" ON realtime.messages;
DROP POLICY IF EXISTS "realtime_1on1_messages_insert" ON realtime.messages;
DROP POLICY IF EXISTS "realtime_community_messages_select" ON realtime.messages;
DROP POLICY IF EXISTS "realtime_community_messages_insert" ON realtime.messages;

-- Policy: Allow users to receive 1-on-1 messages (SELECT)
-- Topic format: "dm:USER_ID_1:USER_ID_2:messages"
CREATE POLICY "realtime_1on1_messages_select"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    extension = 'broadcast'
    AND (
      -- User is part of the DM conversation
      realtime.topic() LIKE 'dm:%' || auth.uid()::text || '%:messages'
      OR realtime.topic() LIKE 'dm:%:' || auth.uid()::text || '%:messages'
    )
  );

-- Policy: Allow users to send 1-on-1 messages (INSERT)
CREATE POLICY "realtime_1on1_messages_insert"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    extension = 'broadcast'
    AND (
      -- User is part of the DM conversation
      realtime.topic() LIKE 'dm:%' || auth.uid()::text || '%:messages'
      OR realtime.topic() LIKE 'dm:%:' || auth.uid()::text || '%:messages'
    )
  );

-- Policy: Allow community members to receive messages (SELECT)
-- Topic format: "community:COMMUNITY_ID:messages"
CREATE POLICY "realtime_community_messages_select"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    extension = 'broadcast'
    AND realtime.topic() LIKE 'community:%:messages'
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.student_id = auth.uid()
        AND cm.status = 'approved'
        AND realtime.topic() = 'community:' || cm.community_id::text || ':messages'
    )
  );

-- Policy: Allow community members to send messages (INSERT)
CREATE POLICY "realtime_community_messages_insert"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    extension = 'broadcast'
    AND realtime.topic() LIKE 'community:%:messages'
    AND EXISTS (
      SELECT 1 FROM public.community_members cm
      WHERE cm.student_id = auth.uid()
        AND cm.status = 'approved'
        AND realtime.topic() = 'community:' || cm.community_id::text || ':messages'
    )
  );

-- =============================================
-- 3. BROADCAST TRIGGER FUNCTION
-- =============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.messages_broadcast_trigger() CASCADE;

-- Create trigger function to broadcast message changes
CREATE OR REPLACE FUNCTION public.messages_broadcast_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  topic_name text;
  sender_id_val uuid;
  receiver_id_val uuid;
BEGIN
  -- Determine the topic based on message type
  IF NEW.community_id IS NOT NULL THEN
    -- Community message
    topic_name := 'community:' || NEW.community_id::text || ':messages';
  ELSIF NEW.receiver_id IS NOT NULL THEN
    -- 1-on-1 message - create consistent topic regardless of sender/receiver order
    sender_id_val := LEAST(NEW.sender_id, NEW.receiver_id);
    receiver_id_val := GREATEST(NEW.sender_id, NEW.receiver_id);
    topic_name := 'dm:' || sender_id_val::text || ':' || receiver_id_val::text || ':messages';
  ELSE
    -- Fallback (shouldn't happen with proper constraints)
    topic_name := 'messages:global';
  END IF;

  -- Broadcast the change
  PERFORM realtime.broadcast_changes(
    topic_name,
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

-- =============================================
-- 4. ATTACH TRIGGER TO MESSAGES TABLE
-- =============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS messages_broadcast_trigger ON public.messages;

-- Create trigger on messages table
CREATE TRIGGER messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.messages_broadcast_trigger();

-- =============================================
-- 5. PRESENCE BROADCAST SETUP
-- =============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.user_presence_broadcast_trigger() CASCADE;

-- Create trigger function for presence updates
CREATE OR REPLACE FUNCTION public.user_presence_broadcast_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Broadcast presence changes to user-specific topic
  PERFORM realtime.broadcast_changes(
    'presence:' || COALESCE(NEW.user_id, OLD.user_id)::text,
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS user_presence_broadcast_trigger ON public.user_presence;

-- Create trigger on user_presence table
CREATE TRIGGER user_presence_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION public.user_presence_broadcast_trigger();

-- =============================================
-- 6. TYPING INDICATORS BROADCAST SETUP
-- =============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.typing_indicators_broadcast_trigger() CASCADE;

-- Create trigger function for typing indicators
CREATE OR REPLACE FUNCTION public.typing_indicators_broadcast_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  topic_name text;
  user1_id uuid;
  user2_id uuid;
BEGIN
  -- Create consistent topic for typing indicators
  user1_id := LEAST(NEW.user_id, NEW.conversation_with);
  user2_id := GREATEST(NEW.user_id, NEW.conversation_with);
  topic_name := 'typing:' || user1_id::text || ':' || user2_id::text;

  -- Broadcast typing status
  PERFORM realtime.broadcast_changes(
    topic_name,
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS typing_indicators_broadcast_trigger ON public.typing_indicators;

-- Create trigger on typing_indicators table
CREATE TRIGGER typing_indicators_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.typing_indicators
  FOR EACH ROW
  EXECUTE FUNCTION public.typing_indicators_broadcast_trigger();

-- =============================================
-- 7. INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for faster RLS policy checks
CREATE INDEX IF NOT EXISTS idx_community_members_student_status 
  ON public.community_members(student_id, status);

CREATE INDEX IF NOT EXISTS idx_community_members_community_student 
  ON public.community_members(community_id, student_id);

-- =============================================
-- 8. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION public.messages_broadcast_trigger() IS 
  'Broadcasts message changes to appropriate realtime topics (DM or community)';

COMMENT ON FUNCTION public.user_presence_broadcast_trigger() IS 
  'Broadcasts user presence changes to user-specific topics';

COMMENT ON FUNCTION public.typing_indicators_broadcast_trigger() IS 
  'Broadcasts typing indicator changes to conversation topics';

-- =============================================
-- SETUP COMPLETE
-- =============================================
-- Next steps:
-- 1. Enable Realtime in Supabase Dashboard (Database → Replication)
-- 2. Toggle ON for: messages, user_presence, typing_indicators
-- 3. Update your client code to use the new topic formats
-- 4. Test with two users in different browsers
