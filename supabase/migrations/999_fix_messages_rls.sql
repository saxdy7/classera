-- =============================================
-- FIX MESSAGES TABLE RLS POLICIES  
-- =============================================
-- This migration fixes conflicting RLS policies on the messages table
-- and ensures simple direct messaging works correctly.
-- 
-- PROBLEM: Multiple migrations created conflicting policies that block message access
-- SOLUTION: Remove all policies and create simple, permissive ones

-- =============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users read their messages" ON messages;
DROP POLICY IF EXISTS "Users write messages" ON messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update received messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages from same university" ON messages;
DROP POLICY IF EXISTS "Users can send messages to same university" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON messages;
DROP POLICY IF EXISTS "Senders can edit/delete their own messages" ON messages;
DROP POLICY IF EXISTS "realtime_1on1_messages_select" ON messages;
DROP POLICY IF EXISTS "realtime_1on1_messages_insert" ON messages;

-- =============================================
-- STEP 2: CREATE SIMPLE, WORKING POLICIES
-- =============================================

-- Policy 1: Users can view messages where they are sender OR receiver
-- This allows both participants to see the conversation
CREATE POLICY "messages_select_policy"
  ON messages FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Policy 2: Users can send messages (they must be the sender)
CREATE POLICY "messages_insert_policy"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Policy 3: Users can update messages where they are involved
-- Allows marking messages as read, editing, etc.
CREATE POLICY "messages_update_policy"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Policy 4: Senders can delete their own messages
CREATE POLICY "messages_delete_policy"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id);

-- =============================================
-- STEP 3: ENSURE RLS IS ENABLED
-- =============================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- =============================================
-- SUCCESS
-- =============================================

COMMENT ON TABLE messages IS 'Fixed: Messages table now has simple, working RLS policies that allow sender/receiver to view their messages';

-- Verify policies were created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'messages';
  
  RAISE NOTICE 'Successfully created % RLS policies on messages table', policy_count;
END $$;
