-- =============================================
-- COMMUNITY POSTS, COMMENTS, LIKES & SAVED POSTS SYSTEM
-- =============================================
-- Run this migration to create all post-related tables for the community feed.
-- All statements use IF NOT EXISTS / OR REPLACE so the file is idempotent.

-- =============================================
-- 1. COMMUNITY POSTS
-- =============================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'normal' CHECK (type IN ('normal', 'question', 'announcement', 'poll')),
  images TEXT[],
  files JSONB,
  is_answered BOOLEAN DEFAULT false,
  best_answer_id UUID,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  pinned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  pinned_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_reason TEXT,
  is_locked BOOLEAN DEFAULT false,
  locked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  locked_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. COMMUNITY COMMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[],
  likes_count INTEGER DEFAULT 0,
  is_best_answer BOOLEAN DEFAULT false,
  marked_as_best_by UUID REFERENCES users(id) ON DELETE SET NULL,
  marked_as_best_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. POST LIKES
-- =============================================
CREATE TABLE IF NOT EXISTS community_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- =============================================
-- 4. COMMENT LIKES
-- =============================================
CREATE TABLE IF NOT EXISTS community_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- =============================================
-- 5. SAVED POSTS
-- =============================================
CREATE TABLE IF NOT EXISTS community_saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- =============================================
-- 6. POST REPORTS
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
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- =============================================
-- 7. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_community_posts_community ON community_posts(community_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(type);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_pinned ON community_posts(is_pinned, created_at DESC) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_community_posts_questions ON community_posts(type, is_answered) WHERE type = 'question';

CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_community_comments_parent ON community_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_author ON community_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created ON community_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON community_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON community_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON community_comment_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON community_saved_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_posts_created ON community_saved_posts(created_at DESC);

-- =============================================
-- 8. TRIGGERS FOR AUTOMATIC COUNTS
-- =============================================

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON community_post_likes;
CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON community_post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_deleted = false THEN
      UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      UPDATE community_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = NEW.post_id;
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_deleted = false THEN
      UPDATE community_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON community_comments;
CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR UPDATE OR DELETE ON community_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_likes_count ON community_comment_likes;
CREATE TRIGGER trigger_update_comment_likes_count
AFTER INSERT OR DELETE ON community_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

CREATE OR REPLACE FUNCTION update_community_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_updated_at ON community_posts;
CREATE TRIGGER trigger_update_post_updated_at
BEFORE UPDATE ON community_posts
FOR EACH ROW EXECUTE FUNCTION update_community_post_updated_at();

DROP TRIGGER IF EXISTS trigger_update_comment_updated_at ON community_comments;
CREATE TRIGGER trigger_update_comment_updated_at
BEFORE UPDATE ON community_comments
FOR EACH ROW EXECUTE FUNCTION update_community_post_updated_at();

-- =============================================
-- 9. ROW LEVEL SECURITY
-- =============================================

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_reports ENABLE ROW LEVEL SECURITY;

-- POSTS ---

DROP POLICY IF EXISTS "Community members can view posts" ON community_posts;
CREATE POLICY "Community members can view posts"
  ON community_posts FOR SELECT
  USING (
    is_deleted = false AND (
      community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
      OR community_id IN (
        SELECT id FROM communities WHERE mentor_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Community members can create posts" ON community_posts;
CREATE POLICY "Community members can create posts"
  ON community_posts FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND (
      (
        type IN ('normal', 'question') AND
        community_id IN (
          SELECT community_id FROM community_members
          WHERE student_id = auth.uid() AND status = 'approved'
        )
      )
      OR community_id IN (
        SELECT id FROM communities WHERE mentor_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Authors and mentors can update posts" ON community_posts;
CREATE POLICY "Authors and mentors can update posts"
  ON community_posts FOR UPDATE
  USING (
    author_id = auth.uid() OR
    community_id IN (SELECT id FROM communities WHERE mentor_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authors and mentors can delete posts" ON community_posts;
CREATE POLICY "Authors and mentors can delete posts"
  ON community_posts FOR DELETE
  USING (
    author_id = auth.uid() OR
    community_id IN (SELECT id FROM communities WHERE mentor_id = auth.uid())
  );

-- COMMENTS ---

DROP POLICY IF EXISTS "Community members can view comments" ON community_comments;
CREATE POLICY "Community members can view comments"
  ON community_comments FOR SELECT
  USING (
    is_deleted = false AND
    post_id IN (
      SELECT id FROM community_posts
      WHERE is_deleted = false AND (
        community_id IN (
          SELECT community_id FROM community_members
          WHERE student_id = auth.uid() AND status = 'approved'
        )
        OR community_id IN (
          SELECT id FROM communities WHERE mentor_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Community members can create comments" ON community_comments;
CREATE POLICY "Community members can create comments"
  ON community_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    post_id IN (
      SELECT cp.id FROM community_posts cp
      WHERE cp.is_locked = false AND cp.is_deleted = false AND (
        cp.community_id IN (
          SELECT community_id FROM community_members
          WHERE student_id = auth.uid() AND status = 'approved'
          AND community_id NOT IN (
            SELECT community_id FROM community_muted_users
            WHERE user_id = auth.uid()
            AND (muted_until IS NULL OR muted_until > NOW())
          )
        )
        OR cp.community_id IN (
          SELECT id FROM communities WHERE mentor_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Authors and mentors can update comments" ON community_comments;
CREATE POLICY "Authors and mentors can update comments"
  ON community_comments FOR UPDATE
  USING (
    author_id = auth.uid() OR
    post_id IN (
      SELECT id FROM community_posts
      WHERE community_id IN (SELECT id FROM communities WHERE mentor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authors and mentors can delete comments" ON community_comments;
CREATE POLICY "Authors and mentors can delete comments"
  ON community_comments FOR DELETE
  USING (
    author_id = auth.uid() OR
    post_id IN (
      SELECT id FROM community_posts
      WHERE community_id IN (SELECT id FROM communities WHERE mentor_id = auth.uid())
    )
  );

-- POST LIKES ---

DROP POLICY IF EXISTS "Community members can view post likes" ON community_post_likes;
CREATE POLICY "Community members can view post likes"
  ON community_post_likes FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM community_posts
      WHERE community_id IN (
        SELECT community_id FROM community_members
        WHERE student_id = auth.uid() AND status = 'approved'
      )
      OR community_id IN (SELECT id FROM communities WHERE mentor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Community members can like posts" ON community_post_likes;
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
      OR community_id IN (SELECT id FROM communities WHERE mentor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can unlike posts" ON community_post_likes;
CREATE POLICY "Users can unlike posts"
  ON community_post_likes FOR DELETE
  USING (user_id = auth.uid());

-- COMMENT LIKES ---

DROP POLICY IF EXISTS "Community members can view comment likes" ON community_comment_likes;
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
      OR cp.community_id IN (SELECT id FROM communities WHERE mentor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Community members can like comments" ON community_comment_likes;
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
      OR cp.community_id IN (SELECT id FROM communities WHERE mentor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can unlike comments" ON community_comment_likes;
CREATE POLICY "Users can unlike comments"
  ON community_comment_likes FOR DELETE
  USING (user_id = auth.uid());

-- SAVED POSTS ---

DROP POLICY IF EXISTS "Users can view their saved posts" ON community_saved_posts;
CREATE POLICY "Users can view their saved posts"
  ON community_saved_posts FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can save posts" ON community_saved_posts;
CREATE POLICY "Users can save posts"
  ON community_saved_posts FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    post_id IN (SELECT id FROM community_posts WHERE is_deleted = false)
  );

DROP POLICY IF EXISTS "Users can unsave posts" ON community_saved_posts;
CREATE POLICY "Users can unsave posts"
  ON community_saved_posts FOR DELETE
  USING (user_id = auth.uid());

-- POST REPORTS ---

DROP POLICY IF EXISTS "Users can create reports" ON community_post_reports;
CREATE POLICY "Users can create reports"
  ON community_post_reports FOR INSERT
  WITH CHECK (reported_by = auth.uid());

DROP POLICY IF EXISTS "Mentors can view reports for their communities" ON community_post_reports;
CREATE POLICY "Mentors can view reports for their communities"
  ON community_post_reports FOR SELECT
  USING (
    post_id IN (
      SELECT id FROM community_posts
      WHERE community_id IN (SELECT id FROM communities WHERE mentor_id = auth.uid())
    )
    OR comment_id IN (
      SELECT cc.id FROM community_comments cc
      JOIN community_posts cp ON cc.post_id = cp.id
      WHERE cp.community_id IN (SELECT id FROM communities WHERE mentor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Mentors can update reports" ON community_post_reports;
CREATE POLICY "Mentors can update reports"
  ON community_post_reports FOR UPDATE
  USING (
    post_id IN (
      SELECT id FROM community_posts
      WHERE community_id IN (SELECT id FROM communities WHERE mentor_id = auth.uid())
    )
    OR comment_id IN (
      SELECT cc.id FROM community_comments cc
      JOIN community_posts cp ON cc.post_id = cp.id
      WHERE cp.community_id IN (SELECT id FROM communities WHERE mentor_id = auth.uid())
    )
  );

-- =============================================
-- 10. REALTIME
-- =============================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE community_comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
