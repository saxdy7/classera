-- Fix community_messages column naming - standardize on user_id

-- Drop and recreate RLS policies if they reference sender_id
ALTER TABLE community_messages DISABLE ROW LEVEL SECURITY;

-- Change sender_id column to NOT NULL instead of nullable
-- First, copy any data from sender_id to user_id if sender_id has data
UPDATE community_messages SET user_id = sender_id WHERE user_id IS NULL AND sender_id IS NOT NULL;

-- Drop the sender_id column if it exists
ALTER TABLE community_messages 
  DROP COLUMN IF EXISTS sender_id CASCADE;

-- Re-enable RLS with correct column reference
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using the correct user_id column
DROP POLICY IF EXISTS "Users can view messages in their communities" ON community_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON community_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON community_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON community_messages;

CREATE POLICY "Users can view messages in their communities"
  ON community_messages FOR SELECT
  USING (
    channel_id IN (
      SELECT id FROM community_channels cc
      WHERE cc.community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
    )
  );

CREATE POLICY "Users can insert messages"
  ON community_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    channel_id IN (
      SELECT id FROM community_channels cc
      WHERE cc.community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
    )
  );

CREATE POLICY "Users can update own messages"
  ON community_messages FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON community_messages FOR DELETE
  USING (user_id = auth.uid());

-- Add comment documenting the column
COMMENT ON COLUMN community_messages.user_id IS 'The user who sent this message (previously called sender_id in some code)';
