-- ============================================================
-- COMPREHENSIVE COMMUNITY FIXES
-- ============================================================
-- This migration fixes all remaining issues with:
-- 1. Foreign key relationships for PostgREST schema cache
-- 2. RLS policies for community tables
-- 3. Missing columns and constraints
-- 4. Schema cache reload notification
-- ============================================================

-- ============================================================
-- 1. ENSURE COMMUNITY_POSTS HAS PROPER FK FOR AUTHOR
-- ============================================================
-- Check if FK exists, if not add it
DO $$ BEGIN
  -- Drop existing constraint if it has wrong name
  ALTER TABLE community_posts DROP CONSTRAINT IF EXISTS community_posts_author_id_fkey;
  
  -- Add proper FK with correct naming
  ALTER TABLE community_posts
    ADD CONSTRAINT community_posts_author_id_fkey
    FOREIGN KEY (author_id)
    REFERENCES users(id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  -- FK already exists, that's fine
  NULL;
END $$;

-- Same for community_id
DO $$ BEGIN
  ALTER TABLE community_posts DROP CONSTRAINT IF EXISTS community_posts_community_id_fkey;
  
  ALTER TABLE community_posts
    ADD CONSTRAINT community_posts_community_id_fkey
    FOREIGN KEY (community_id)
    REFERENCES communities(id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================================
-- 2. ENSURE COMMUNITY_COMMENTS HAS PROPER FKs
-- ============================================================
DO $$ BEGIN
  ALTER TABLE community_comments DROP CONSTRAINT IF EXISTS community_comments_author_id_fkey;
  
  ALTER TABLE community_comments
    ADD CONSTRAINT community_comments_author_id_fkey
    FOREIGN KEY (author_id)
    REFERENCES users(id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE community_comments DROP CONSTRAINT IF EXISTS community_comments_post_id_fkey;
  
  ALTER TABLE community_comments
    ADD CONSTRAINT community_comments_post_id_fkey
    FOREIGN KEY (post_id)
    REFERENCES community_posts(id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================================
-- 3. ENSURE COMMUNITY_MESSAGES HAS PROPER FK FOR USER
-- ============================================================
DO $$ BEGIN
  -- Ensure user_id column exists
  ALTER TABLE community_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
  
  -- Drop constraint if it exists with wrong name
  ALTER TABLE community_messages DROP CONSTRAINT IF EXISTS community_messages_user_id_fkey;
  
  -- Add proper FK
  ALTER TABLE community_messages
    ADD CONSTRAINT community_messages_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- If sender_id exists and is different from user_id, sync them
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'community_messages' 
             AND column_name = 'sender_id') THEN
    UPDATE community_messages SET user_id = sender_id WHERE user_id IS NULL AND sender_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================
-- 4. ENSURE COMMUNITY_CHANNELS HAS PROPER FK
-- ============================================================
DO $$ BEGIN
  ALTER TABLE community_channels DROP CONSTRAINT IF EXISTS community_channels_community_id_fkey;
  
  ALTER TABLE community_channels
    ADD CONSTRAINT community_channels_community_id_fkey
    FOREIGN KEY (community_id)
    REFERENCES communities(id)
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================================
-- 5. FIX RLS POLICIES FOR COMMUNITY_POSTS
-- ============================================================
ALTER TABLE community_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cp_select" ON community_posts;
DROP POLICY IF EXISTS "cp_insert" ON community_posts;
DROP POLICY IF EXISTS "cp_update" ON community_posts;
DROP POLICY IF EXISTS "cp_delete" ON community_posts;

-- Anyone can view posts
CREATE POLICY "cp_select" ON community_posts 
  FOR SELECT USING (true);

-- Authenticated users can create posts
CREATE POLICY "cp_insert" ON community_posts 
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    author_id = auth.uid()
  );

-- Authors and admins can update
CREATE POLICY "cp_update" ON community_posts 
  FOR UPDATE USING (
    author_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM communities WHERE id = community_posts.community_id AND mentor_id = auth.uid())
  );

-- Authors and admins can delete
CREATE POLICY "cp_delete" ON community_posts 
  FOR DELETE USING (
    author_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM communities WHERE id = community_posts.community_id AND mentor_id = auth.uid())
  );

-- ============================================================
-- 6. FIX RLS POLICIES FOR COMMUNITY_COMMENTS
-- ============================================================
ALTER TABLE community_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cc_select" ON community_comments;
DROP POLICY IF EXISTS "cc_insert" ON community_comments;
DROP POLICY IF EXISTS "cc_update" ON community_comments;
DROP POLICY IF EXISTS "cc_delete" ON community_comments;

CREATE POLICY "cc_select" ON community_comments 
  FOR SELECT USING (true);

CREATE POLICY "cc_insert" ON community_comments 
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    author_id = auth.uid()
  );

CREATE POLICY "cc_update" ON community_comments 
  FOR UPDATE USING (
    author_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM community_posts cp 
      WHERE cp.id = community_comments.post_id 
      AND EXISTS (SELECT 1 FROM communities c WHERE c.id = cp.community_id AND c.mentor_id = auth.uid())
    )
  );

CREATE POLICY "cc_delete" ON community_comments 
  FOR DELETE USING (
    author_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM community_posts cp 
      WHERE cp.id = community_comments.post_id 
      AND EXISTS (SELECT 1 FROM communities c WHERE c.id = cp.community_id AND c.mentor_id = auth.uid())
    )
  );

-- ============================================================
-- 7. FIX RLS POLICIES FOR COMMUNITY_MESSAGES
-- ============================================================
ALTER TABLE community_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cm_select" ON community_messages;
DROP POLICY IF EXISTS "cm_insert" ON community_messages;
DROP POLICY IF EXISTS "cm_update" ON community_messages;
DROP POLICY IF EXISTS "cm_delete" ON community_messages;

CREATE POLICY "cm_select" ON community_messages 
  FOR SELECT USING (true);

CREATE POLICY "cm_insert" ON community_messages 
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  );

CREATE POLICY "cm_update" ON community_messages 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "cm_delete" ON community_messages 
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- 8. FIX RLS POLICIES FOR COMMUNITY_CHANNELS
-- ============================================================
ALTER TABLE community_channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ch_select" ON community_channels;
DROP POLICY IF EXISTS "ch_insert" ON community_channels;
DROP POLICY IF EXISTS "ch_update" ON community_channels;

CREATE POLICY "ch_select" ON community_channels 
  FOR SELECT USING (true);

CREATE POLICY "ch_insert" ON community_channels 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "ch_update" ON community_channels 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM communities WHERE id = community_channels.community_id AND mentor_id = auth.uid())
  );

-- ============================================================
-- 9. RELOAD POSTGREST SCHEMA CACHE
-- ============================================================
-- This notifies PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- 10. VERIFY TABLES EXIST
-- ============================================================
-- Log table status for debugging
DO $$ 
DECLARE
  _count INT;
BEGIN
  SELECT COUNT(*) INTO _count FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('community_posts', 'community_comments', 'community_messages', 'community_channels');
  
  RAISE NOTICE 'Community tables found: %', _count;
END $$;

-- ============================================================
-- Done! All community tables fixed
-- ============================================================
