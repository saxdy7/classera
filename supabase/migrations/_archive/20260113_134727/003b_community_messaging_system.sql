-- =============================================
-- PHASE 4: WHATSAPP-STYLE COMMUNITY MESSAGING SYSTEM
-- =============================================
-- This migration adds complete messaging functionality to communities
-- Including announcement channels, discussion channels, and moderation

-- =============================================
-- 1. COMMUNITY CHANNELS TABLE
-- =============================================
-- WhatsApp-style channels: Announcement (mentor-only) + Discussion (all members)
CREATE TABLE IF NOT EXISTS community_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'discussion')),
  is_locked BOOLEAN DEFAULT false, -- Can be locked during tests
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, type) -- Each community has exactly one of each type
);

-- =============================================
-- 2. COMMUNITY MESSAGES TABLE
-- =============================================
-- All messages in both announcement and discussion channels
CREATE TABLE IF NOT EXISTS community_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES community_channels(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. MESSAGE REACTIONS TABLE
-- =============================================
-- Students can react to announcements (optional feature)
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES community_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reaction TEXT NOT NULL, -- emoji like '👍', '❤️', '🔥'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction)
);

-- =============================================
-- 4. COMMUNITY MODERATION LOGS TABLE
-- =============================================
-- Track all mentor moderation actions
CREATE TABLE IF NOT EXISTS community_moderation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL, -- 'MUTE_USER', 'DELETE_MESSAGE', 'LOCK_CHANNEL', 'REMOVE_MEMBER', etc.
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_message_id UUID REFERENCES community_messages(id) ON DELETE SET NULL,
  reason TEXT,
  metadata JSONB, -- Additional context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. USER MUTE STATUS TABLE
-- =============================================
-- Track which users are muted in which communities
CREATE TABLE IF NOT EXISTS community_muted_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  muted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  muted_until TIMESTAMP WITH TIME ZONE, -- NULL means permanent
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- =============================================
-- 6. AI MODERATION FLAGS TABLE (Optional)
-- =============================================
-- AI flags messages for mentor review (never auto-bans)
CREATE TABLE IF NOT EXISTS ai_moderation_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES community_messages(id) ON DELETE CASCADE NOT NULL,
  flag_type TEXT NOT NULL, -- 'SPAM', 'ABUSE', 'OFF_TOPIC', etc.
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- Add specialization to communities (optional)
ALTER TABLE communities 
ADD COLUMN IF NOT EXISTS specialization TEXT;

-- Add reason field to community_members for join requests
ALTER TABLE community_members 
ADD COLUMN IF NOT EXISTS join_reason TEXT;

-- Add is_muted flag to community_members
ALTER TABLE community_members 
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;

-- =============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Community channels
CREATE INDEX IF NOT EXISTS idx_community_channels_community_id ON community_channels(community_id);
CREATE INDEX IF NOT EXISTS idx_community_channels_type ON community_channels(type);

-- Messages
CREATE INDEX IF NOT EXISTS idx_community_messages_channel_id ON community_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_sender_id ON community_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_created_at ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_not_deleted ON community_messages(is_deleted) WHERE is_deleted = false;

-- Reactions
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);

-- Moderation logs
CREATE INDEX IF NOT EXISTS idx_moderation_logs_community_id ON community_moderation_logs(community_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON community_moderation_logs(created_at DESC);

-- Muted users
CREATE INDEX IF NOT EXISTS idx_muted_users_community_id ON community_muted_users(community_id);
CREATE INDEX IF NOT EXISTS idx_muted_users_user_id ON community_muted_users(user_id);

-- =============================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE community_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_moderation_flags ENABLE ROW LEVEL SECURITY;

-- CHANNELS: Community members can view channels
CREATE POLICY "Community members can view channels"
  ON community_channels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_channels.community_id
      AND community_members.student_id = auth.uid()
      AND community_members.status = 'approved'
    )
    OR
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_channels.community_id
      AND communities.mentor_id = auth.uid()
    )
  );

-- MESSAGES: Community members can view messages
CREATE POLICY "Community members can view messages"
  ON community_messages FOR SELECT
  USING (
    NOT is_deleted AND
    EXISTS (
      SELECT 1 FROM community_channels cc
      JOIN community_members cm ON cm.community_id = cc.community_id
      WHERE cc.id = community_messages.channel_id
      AND cm.student_id = auth.uid()
      AND cm.status = 'approved'
    )
    OR
    EXISTS (
      SELECT 1 FROM community_channels cc
      JOIN communities c ON c.id = cc.community_id
      WHERE cc.id = community_messages.channel_id
      AND c.mentor_id = auth.uid()
    )
  );

-- MESSAGES INSERT: Different rules for announcement vs discussion
CREATE POLICY "Users can send messages"
  ON community_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    (
      -- Announcement channel: Only mentors
      (
        EXISTS (
          SELECT 1 FROM community_channels cc
          JOIN communities c ON c.id = cc.community_id
          WHERE cc.id = community_messages.channel_id
          AND cc.type = 'announcement'
          AND c.mentor_id = auth.uid()
        )
      )
      OR
      -- Discussion channel: Approved members who are not muted
      (
        EXISTS (
          SELECT 1 FROM community_channels cc
          JOIN community_members cm ON cm.community_id = cc.community_id
          WHERE cc.id = community_messages.channel_id
          AND cc.type = 'discussion'
          AND cc.is_locked = false
          AND cm.student_id = auth.uid()
          AND cm.status = 'approved'
          AND cm.is_muted = false
        )
        OR
        EXISTS (
          SELECT 1 FROM community_channels cc
          JOIN communities c ON c.id = cc.community_id
          WHERE cc.id = community_messages.channel_id
          AND cc.type = 'discussion'
          AND cc.is_locked = false
          AND c.mentor_id = auth.uid()
        )
      )
    )
  );

-- MESSAGES UPDATE: Only mentors can mark as deleted
CREATE POLICY "Mentors can delete messages"
  ON community_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM community_channels cc
      JOIN communities c ON c.id = cc.community_id
      WHERE cc.id = community_messages.channel_id
      AND c.mentor_id = auth.uid()
    )
  );

-- REACTIONS: Approved members can react
CREATE POLICY "Members can react to messages"
  ON message_reactions FOR ALL
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM community_messages cm
      JOIN community_channels cc ON cc.id = cm.channel_id
      JOIN community_members cmem ON cmem.community_id = cc.community_id
      WHERE cm.id = message_reactions.message_id
      AND cmem.student_id = auth.uid()
      AND cmem.status = 'approved'
    )
  );

-- MODERATION LOGS: Only mentors can view and create
CREATE POLICY "Mentors can manage moderation logs"
  ON community_moderation_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_moderation_logs.community_id
      AND communities.mentor_id = auth.uid()
    )
  );

-- MUTED USERS: Mentors can manage
CREATE POLICY "Mentors can manage muted users"
  ON community_muted_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_muted_users.community_id
      AND communities.mentor_id = auth.uid()
    )
  );

-- AI FLAGS: Mentors can view
CREATE POLICY "Mentors can view AI flags"
  ON ai_moderation_flags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_messages cm
      JOIN community_channels cc ON cc.id = cm.channel_id
      JOIN communities c ON c.id = cc.community_id
      WHERE cm.id = ai_moderation_flags.message_id
      AND c.mentor_id = auth.uid()
    )
  );

-- =============================================
-- 10. FUNCTIONS & TRIGGERS
-- =============================================

-- Function to auto-create channels when community is created
CREATE OR REPLACE FUNCTION create_default_community_channels()
RETURNS TRIGGER AS $$
BEGIN
  -- Create announcement channel
  INSERT INTO community_channels (community_id, name, type)
  VALUES (NEW.id, 'Announcements', 'announcement');
  
  -- Create discussion channel
  INSERT INTO community_channels (community_id, name, type)
  VALUES (NEW.id, 'Discussion', 'discussion');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create channels on community creation
DROP TRIGGER IF EXISTS trigger_create_community_channels ON communities;
CREATE TRIGGER trigger_create_community_channels
  AFTER INSERT ON communities
  FOR EACH ROW
  EXECUTE FUNCTION create_default_community_channels();

-- Function to prevent message editing (messages are immutable except for deletion)
CREATE OR REPLACE FUNCTION prevent_message_content_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow changing is_deleted, deleted_by, deleted_at
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    RAISE EXCEPTION 'Message content cannot be edited';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent message editing
DROP TRIGGER IF EXISTS trigger_prevent_message_edit ON community_messages;
CREATE TRIGGER trigger_prevent_message_edit
  BEFORE UPDATE ON community_messages
  FOR EACH ROW
  EXECUTE FUNCTION prevent_message_content_edit();

-- =============================================
-- 11. GRANT PERMISSIONS
-- =============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON community_channels TO authenticated;
GRANT SELECT, INSERT, UPDATE ON community_messages TO authenticated;
GRANT SELECT, INSERT, DELETE ON message_reactions TO authenticated;
GRANT SELECT, INSERT ON community_moderation_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON community_muted_users TO authenticated;
GRANT SELECT ON ai_moderation_flags TO authenticated;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- This migration adds:
-- ✅ WhatsApp-style announcement & discussion channels
-- ✅ Complete messaging system
-- ✅ Message reactions
-- ✅ Mentor moderation tools
-- ✅ User muting system
-- ✅ AI moderation flags (optional)
-- ✅ Proper RLS policies
-- ✅ Auto-channel creation
-- ✅ Message immutability
