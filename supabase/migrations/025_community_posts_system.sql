-- =============================================
-- COMMUNITY POSTS & FEED SYSTEM
-- =============================================
-- Complete Reddit/Twitter-style post system for communities
-- Supports: Normal posts, Questions, Announcements, Polls integration

-- =============================================
-- 1. COMMUNITY POSTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Post content
  title TEXT,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('normal', 'question', 'announcement', 'poll')),
  
  -- Media attachments
  images TEXT[], -- Array of image URLs
  files JSONB, -- [{name, url, size, type}]
  
  -- Question-specific fields
  is_answered BOOLEAN DEFAULT false,
  best_answer_id UUID, -- References community_comments(id)
  
  -- Engagement metrics
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_pinned BOOLEAN DEFAULT false,
  pinned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  pinned_at TIMESTAMP WITH TIME ZONE,
  
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_reason TEXT,
  
  is_locked BOOLEAN DEFAULT false, -- Prevent new comments
  locked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  tags TEXT[], -- Optional tags for categorization
  metadata JSONB -- Flexible field for future features
);

-- =============================================
-- 2. COMMUNITY COMMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE, -- For nested comments
  
  content TEXT NOT NULL,
  images TEXT[], -- Array of image URLs
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  
  -- Question answer marking
  is_best_answer BOOLEAN DEFAULT false,
  marked_as_best_by UUID REFERENCES users(id) ON DELETE SET NULL,
  marked_as_best_at TIMESTAMP WITH TIME ZONE,
  
  -- Moderation
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. POST LIKES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS community_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- =============================================
-- 4. COMMENT LIKES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS community_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- =============================================
-- 5. SAVED POSTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS community_saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- =============================================
-- 6. POST REPORTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS community_post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Either post_id or comment_id must be set, but not both
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- =============================================
-- 7. POST VIEWS TRACKING
-- =============================================
CREATE TABLE IF NOT EXISTS community_post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for anonymous
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- =============================================
-- 8. INDEXES FOR PERFORMANCE
-- =============================================

-- Posts indexes
CREATE INDEX idx_community_posts_community ON community_posts(community_id) WHERE is_deleted = false;
CREATE INDEX idx_community_posts_author ON community_posts(author_id);
CREATE INDEX idx_community_posts_type ON community_posts(type);
CREATE INDEX idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_pinned ON community_posts(is_pinned, created_at DESC) WHERE is_pinned = true;
CREATE INDEX idx_community_posts_questions ON community_posts(type, is_answered) WHERE type = 'question';

-- Comments indexes
CREATE INDEX idx_community_comments_post ON community_comments(post_id) WHERE is_deleted = false;
CREATE INDEX idx_community_comments_parent ON community_comments(parent_comment_id);
CREATE INDEX idx_community_comments_author ON community_comments(author_id);
CREATE INDEX idx_community_comments_created ON community_comments(created_at);

-- Likes indexes
CREATE INDEX idx_post_likes_post ON community_post_likes(post_id);
CREATE INDEX idx_post_likes_user ON community_post_likes(user_id);
CREATE INDEX idx_comment_likes_comment ON community_comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user ON community_comment_likes(user_id);

-- Saved posts indexes
CREATE INDEX idx_saved_posts_user ON community_saved_posts(user_id);
CREATE INDEX idx_saved_posts_created ON community_saved_posts(created_at DESC);

-- Reports indexes
CREATE INDEX idx_post_reports_status ON community_post_reports(status) WHERE status = 'pending';
CREATE INDEX idx_post_reports_post ON community_post_reports(post_id);

-- Views indexes
CREATE INDEX idx_post_views_post ON community_post_views(post_id);

-- =============================================
-- 9. TRIGGERS FOR AUTOMATIC COUNTS
-- =============================================

-- Update likes count on posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON community_post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Update comments count on posts
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_deleted = false THEN
      UPDATE community_posts 
      SET comments_count = comments_count + 1 
      WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      UPDATE community_posts 
      SET comments_count = GREATEST(0, comments_count - 1) 
      WHERE id = NEW.post_id;
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      UPDATE community_posts 
      SET comments_count = comments_count + 1 
      WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_deleted = false THEN
      UPDATE community_posts 
      SET comments_count = GREATEST(0, comments_count - 1) 
      WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR UPDATE OR DELETE ON community_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Update likes count on comments
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_comments 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_likes_count
AFTER INSERT OR DELETE ON community_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_updated_at
BEFORE UPDATE ON community_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_comment_updated_at
BEFORE UPDATE ON community_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 10. ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_views ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POSTS POLICIES
-- =============================================

-- Community members can view non-deleted posts
CREATE POLICY "Community members can view posts"
  ON community_posts FOR SELECT
  USING (
    is_deleted = false AND
    (
      -- Member of the community
      community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
      OR
      -- Mentor who owns the community
      community_id IN (
        SELECT id FROM communities
        WHERE mentor_id = auth.uid()
      )
    )
  );

-- Community members can create posts (students can create normal & question posts)
CREATE POLICY "Community members can create posts"
  ON community_posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    (
      -- Students can create normal posts and questions
      (
        type IN ('normal', 'question') AND
        community_id IN (
          SELECT community_id FROM community_members
          WHERE student_id = auth.uid() AND status = 'approved'
        )
      )
      OR
      -- Mentors can create any type including announcements
      (
        community_id IN (
          SELECT id FROM communities
          WHERE mentor_id = auth.uid()
        )
      )
    )
  );

-- Authors and mentors can update posts
CREATE POLICY "Authors and mentors can update posts"
  ON community_posts FOR UPDATE
  USING (
    author_id = auth.uid() OR
    community_id IN (
      SELECT id FROM communities
      WHERE mentor_id = auth.uid()
    )
  );

-- Authors and mentors can delete posts
CREATE POLICY "Authors and mentors can delete posts"
  ON community_posts FOR DELETE
  USING (
    author_id = auth.uid() OR
    community_id IN (
      SELECT id FROM communities
      WHERE mentor_id = auth.uid()
    )
  );

-- =============================================
-- COMMENTS POLICIES
-- =============================================

-- Community members can view non-deleted comments
CREATE POLICY "Community members can view comments"
  ON community_comments FOR SELECT
  USING (
    is_deleted = false AND
    post_id IN (
      SELECT id FROM community_posts
      WHERE is_deleted = false AND
      (
        community_id IN (
          SELECT community_id FROM community_members
          WHERE student_id = auth.uid() AND status = 'approved'
        )
        OR
        community_id IN (
          SELECT id FROM communities
          WHERE mentor_id = auth.uid()
        )
      )
    )
  );

-- Community members can create comments (if not muted and post not locked)
CREATE POLICY "Community members can create comments"
  ON community_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    post_id IN (
      SELECT cp.id FROM community_posts cp
      WHERE cp.is_locked = false AND
      cp.is_deleted = false AND
      (
        cp.community_id IN (
          SELECT community_id FROM community_members
          WHERE student_id = auth.uid() AND status = 'approved'
          -- Check not muted
          AND community_id NOT IN (
            SELECT community_id FROM community_muted_users
            WHERE user_id = auth.uid() 
            AND (muted_until IS NULL OR muted_until > NOW())
          )
        )
        OR
        cp.community_id IN (
          SELECT id FROM communities
          WHERE mentor_id = auth.uid()
        )
      )
    )
  );

-- Authors and mentors can update comments
CREATE POLICY "Authors and mentors can update comments"
  ON community_comments FOR UPDATE
  USING (
    author_id = auth.uid() OR
    post_id IN (
      SELECT id FROM community_posts
      WHERE community_id IN (
        SELECT id FROM communities
        WHERE mentor_id = auth.uid()
      )
    )
  );

-- Authors and mentors can delete comments
CREATE POLICY "Authors and mentors can delete comments"
  ON community_comments FOR DELETE
  USING (
    author_id = auth.uid() OR
    post_id IN (
      SELECT id FROM community_posts
      WHERE community_id IN (
        SELECT id FROM communities
        WHERE mentor_id = auth.uid()
      )
    )
  );

-- =============================================
-- LIKES POLICIES
-- =============================================

-- Anyone can view likes
CREATE POLICY "Community members can view post likes"
  ON community_post_likes FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM community_posts
      WHERE community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
      OR community_id IN (
        SELECT id FROM communities WHERE mentor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Community members can view comment likes"
  ON community_comment_likes FOR SELECT
  USING (
    comment_id IN (
      SELECT cc.id FROM community_comments cc
      JOIN community_posts cp ON cc.post_id = cp.id
      WHERE cp.community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
      OR cp.community_id IN (
        SELECT id FROM communities WHERE mentor_id = auth.uid()
      )
    )
  );

-- Community members can like posts
CREATE POLICY "Community members can like posts"
  ON community_post_likes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    post_id IN (
      SELECT id FROM community_posts
      WHERE community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
      OR community_id IN (
        SELECT id FROM communities WHERE mentor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Community members can like comments"
  ON community_comment_likes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    comment_id IN (
      SELECT cc.id FROM community_comments cc
      JOIN community_posts cp ON cc.post_id = cp.id
      WHERE cp.community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
      OR cp.community_id IN (
        SELECT id FROM communities WHERE mentor_id = auth.uid()
      )
    )
  );

-- Users can unlike their own likes
CREATE POLICY "Users can unlike posts"
  ON community_post_likes FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can unlike comments"
  ON community_comment_likes FOR DELETE
  USING (user_id = auth.uid());

-- =============================================
-- SAVED POSTS POLICIES
-- =============================================

CREATE POLICY "Users can view their saved posts"
  ON community_saved_posts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can save posts"
  ON community_saved_posts FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    post_id IN (
      SELECT id FROM community_posts
      WHERE is_deleted = false
    )
  );

CREATE POLICY "Users can unsave posts"
  ON community_saved_posts FOR DELETE
  USING (user_id = auth.uid());

-- =============================================
-- REPORTS POLICIES
-- =============================================

CREATE POLICY "Users can create reports"
  ON community_post_reports FOR INSERT
  WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Mentors can view reports for their communities"
  ON community_post_reports FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM community_posts
      WHERE community_id IN (
        SELECT id FROM communities WHERE mentor_id = auth.uid()
      )
    )
    OR comment_id IN (
      SELECT cc.id FROM community_comments cc
      JOIN community_posts cp ON cc.post_id = cp.id
      WHERE cp.community_id IN (
        SELECT id FROM communities WHERE mentor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Mentors can update reports"
  ON community_post_reports FOR UPDATE
  USING (
    post_id IN (
      SELECT id FROM community_posts
      WHERE community_id IN (
        SELECT id FROM communities WHERE mentor_id = auth.uid()
      )
    )
    OR comment_id IN (
      SELECT cc.id FROM community_comments cc
      JOIN community_posts cp ON cc.post_id = cp.id
      WHERE cp.community_id IN (
        SELECT id FROM communities WHERE mentor_id = auth.uid()
      )
    )
  );

-- =============================================
-- POST VIEWS POLICIES
-- =============================================

CREATE POLICY "Anyone can record views"
  ON community_post_views FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );

CREATE POLICY "Users can view post views"
  ON community_post_views FOR SELECT
  USING (true);

-- =============================================
-- NOTIFICATIONS INTEGRATION
-- =============================================

-- Create notification when someone comments on your post
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  post_title TEXT;
  commenter_name TEXT;
BEGIN
  -- Get post author and title
  SELECT author_id, COALESCE(title, LEFT(content, 50)) INTO post_author_id, post_title
  FROM community_posts WHERE id = NEW.post_id;
  
  -- Get commenter name
  SELECT full_name INTO commenter_name FROM users WHERE id = NEW.author_id;
  
  -- Don't notify if commenting on own post
  IF post_author_id != NEW.author_id THEN
    INSERT INTO notifications (
      user_id, type, title, message, link, metadata
    ) VALUES (
      post_author_id,
      'community_comment',
      'New Comment',
      commenter_name || ' commented on your post',
      '/dashboard/student/communities/' || (SELECT community_id FROM community_posts WHERE id = NEW.post_id),
      jsonb_build_object(
        'post_id', NEW.post_id,
        'comment_id', NEW.id,
        'commenter_id', NEW.author_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_post_comment
AFTER INSERT ON community_comments
FOR EACH ROW EXECUTE FUNCTION notify_post_comment();

-- Create notification when someone likes your post
CREATE OR REPLACE FUNCTION notify_post_like()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  liker_name TEXT;
BEGIN
  SELECT author_id INTO post_author_id FROM community_posts WHERE id = NEW.post_id;
  SELECT full_name INTO liker_name FROM users WHERE id = NEW.user_id;
  
  -- Don't notify if liking own post
  IF post_author_id != NEW.user_id THEN
    INSERT INTO notifications (
      user_id, type, title, message, link, metadata
    ) VALUES (
      post_author_id,
      'community_like',
      'New Like',
      liker_name || ' liked your post',
      '/dashboard/student/communities/' || (SELECT community_id FROM community_posts WHERE id = NEW.post_id),
      jsonb_build_object('post_id', NEW.post_id, 'liker_id', NEW.user_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_post_like
AFTER INSERT ON community_post_likes
FOR EACH ROW EXECUTE FUNCTION notify_post_like();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get post with all details
CREATE OR REPLACE FUNCTION get_post_details(post_uuid UUID, user_uuid UUID)
RETURNS TABLE (
  post_data JSONB,
  author_data JSONB,
  is_liked BOOLEAN,
  is_saved BOOLEAN,
  user_can_moderate BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(cp.*) as post_data,
    to_jsonb(u.*) as author_data,
    EXISTS(SELECT 1 FROM community_post_likes WHERE post_id = post_uuid AND user_id = user_uuid) as is_liked,
    EXISTS(SELECT 1 FROM community_saved_posts WHERE post_id = post_uuid AND user_id = user_uuid) as is_saved,
    EXISTS(
      SELECT 1 FROM communities c
      JOIN community_posts cp2 ON c.id = cp2.community_id
      WHERE cp2.id = post_uuid AND c.mentor_id = user_uuid
    ) as user_can_moderate
  FROM community_posts cp
  JOIN users u ON cp.author_id = u.id
  WHERE cp.id = post_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMPLETE! 
-- =============================================
-- This migration provides:
-- ✅ Posts (normal, question, announcement, poll types)
-- ✅ Comments with nested replies
-- ✅ Likes on posts and comments
-- ✅ Save posts for later
-- ✅ Report system for moderation
-- ✅ View tracking
-- ✅ Automatic notifications
-- ✅ Comprehensive RLS policies
-- ✅ Performance indexes
-- ✅ Real-time ready (Supabase subscriptions work out of the box)
