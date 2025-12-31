-- Pinned Messages
CREATE TABLE IF NOT EXISTS pinned_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES community_messages(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  pinned_by UUID REFERENCES users(id),
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Attachments
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES community_messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Threading
ALTER TABLE community_messages 
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES community_messages(id),
ADD COLUMN IF NOT EXISTS thread_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Read Receipts
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES community_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- User Presence
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('online', 'away', 'offline')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  typing_in_channel UUID REFERENCES community_channels(id)
);

-- Message Edit History
CREATE TABLE IF NOT EXISTS message_edit_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES community_messages(id) ON DELETE CASCADE,
  old_content TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  mute_notifications BOOLEAN DEFAULT false,
  notification_type TEXT CHECK (notification_type IN ('all', 'mentions', 'none')),
  UNIQUE(user_id, community_id)
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_messages_content_search ON community_messages 
USING gin(to_tsvector('english', content));

-- Call this function to increment thread count
CREATE OR REPLACE FUNCTION increment_thread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_message_id IS NOT NULL THEN
    UPDATE community_messages
    SET thread_count = thread_count + 1
    WHERE id = NEW.parent_message_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for thread count
DROP TRIGGER IF EXISTS increment_thread_count_trigger ON community_messages;
CREATE TRIGGER increment_thread_count_trigger
AFTER INSERT ON community_messages
FOR EACH ROW
EXECUTE FUNCTION increment_thread_count();

-- RLS Policies

-- Pinned Messages: Viewable by everyone, Insert/Delete by mentors only
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pinned messages viewable by everyone" ON pinned_messages FOR SELECT USING (true);
CREATE POLICY "Mentors can pin messages" ON pinned_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM communities 
    WHERE id = pinned_messages.community_id 
    AND mentor_id = auth.uid()
  )
);
CREATE POLICY "Mentors can unpin messages" ON pinned_messages FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM communities 
    WHERE id = pinned_messages.community_id 
    AND mentor_id = auth.uid()
  )
);

-- Attachments: Viewable by everyone, Insert by message sender
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attachments viewable by everyone" ON message_attachments FOR SELECT USING (true);
CREATE POLICY "Users can upload attachments" ON message_attachments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM community_messages
    WHERE id = message_attachments.message_id
    AND sender_id = auth.uid()
  )
);

-- Presence: Viewable by everyone, Update by own user
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Presence viewable by everyone" ON user_presence FOR SELECT USING (true);
CREATE POLICY "Users can update own presence" ON user_presence FOR ALL USING (auth.uid() = user_id);

-- Read Receipts: Viewable by everyone, Insert by own user
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Receipts viewable by everyone" ON message_read_receipts FOR SELECT USING (true);
CREATE POLICY "Users can mark read" ON message_read_receipts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notification Preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON notification_preferences FOR ALL USING (auth.uid() = user_id);
