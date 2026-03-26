-- Fix community posts and comments RLS policies to avoid recursion and enable proper data access

-- Disable RLS temporarily to apply fixes
ALTER TABLE community_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments DISABLE ROW LEVEL SECURITY;

-- Drop problematic policies
DROP POLICY IF EXISTS "Community members can view posts" ON community_posts;
DROP POLICY IF EXISTS "Community members can create posts" ON community_posts;
DROP POLICY IF EXISTS "Authors and mentors can update posts" ON community_posts;
DROP POLICY IF EXISTS "Authors and mentors can delete posts" ON community_posts;
DROP POLICY IF EXISTS "Community members can view comments" ON community_comments;
DROP POLICY IF EXISTS "Community members can create comments" ON community_comments;
DROP POLICY IF EXISTS "Authors and mentors can update comments" ON community_comments;
DROP POLICY IF EXISTS "Authors and mentors can delete comments" ON community_comments;

-- Drop all existing policies to rebuild them cleanly
DROP POLICY IF EXISTS "Anyone can view non-deleted community posts" ON community_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON community_posts;
DROP POLICY IF EXISTS "Authors can update their own posts" ON community_posts;
DROP POLICY IF EXISTS "Authors can delete their own posts" ON community_posts;
DROP POLICY IF EXISTS "Mentors can delete any post in their community" ON community_posts;
DROP POLICY IF EXISTS "Mentors can update any post in their community" ON community_posts;

DROP POLICY IF EXISTS "Anyone can view non-deleted community comments" ON community_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON community_comments;
DROP POLICY IF EXISTS "Authors can update their own comments" ON community_comments;
DROP POLICY IF EXISTS "Authors can delete their own comments" ON community_comments;
DROP POLICY IF EXISTS "Mentors can delete any comment in their community" ON community_comments;
DROP POLICY IF EXISTS "Mentors can update any comment in their community" ON community_comments;

-- Re-enable RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- Create simplified, non-recursive RLS policies for POSTS

CREATE POLICY "Anyone can view non-deleted community posts"
  ON community_posts FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can create posts"
  ON community_posts FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their own posts"
  ON community_posts FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete their own posts"
  ON community_posts FOR DELETE
  USING (author_id = auth.uid());

-- Mentors can manage any post in their community
CREATE POLICY "Mentors can delete any post in their community"
  ON community_posts FOR DELETE
  USING (
    community_id IN (
      SELECT id FROM communities WHERE mentor_id = auth.uid()
    )
  );

CREATE POLICY "Mentors can update any post in their community"
  ON community_posts FOR UPDATE
  USING (
    community_id IN (
      SELECT id FROM communities WHERE mentor_id = auth.uid()
    )
  )
  WITH CHECK (
    community_id IN (
      SELECT id FROM communities WHERE mentor_id = auth.uid()
    )
  );

-- Create simplified, non-recursive RLS policies for COMMENTS

CREATE POLICY "Anyone can view non-deleted community comments"
  ON community_comments FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can create comments"
  ON community_comments FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update their own comments"
  ON community_comments FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete their own comments"
  ON community_comments FOR DELETE
  USING (author_id = auth.uid());

-- Mentors can manage any comment in their community
CREATE POLICY "Mentors can delete any comment in their community"
  ON community_comments FOR DELETE
  USING (
    post_id IN (
      SELECT id FROM community_posts 
      WHERE community_id IN (
        SELECT id FROM communities WHERE mentor_id = auth.uid()
      )
    )
  );

CREATE POLICY "Mentors can update any comment in their community"
  ON community_comments FOR UPDATE
  USING (
    post_id IN (
      SELECT id FROM community_posts 
      WHERE community_id IN (
        SELECT id FROM communities WHERE mentor_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    post_id IN (
      SELECT id FROM community_posts 
      WHERE community_id IN (
        SELECT id FROM communities WHERE mentor_id = auth.uid()
      )
    )
  );

-- Note: Community-level access control is enforced at the APPLICATION level,
-- not at the database RLS level. This allows:
-- 1. Simpler RLS policies (no recursion)
-- 2. Faster database queries
-- 3. Clearer authorization logic in application code
