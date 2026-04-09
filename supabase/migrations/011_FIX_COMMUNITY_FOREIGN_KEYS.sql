-- Fix missing foreign keys for community posts and comments

-- 1. Community Posts
ALTER TABLE community_posts
  DROP CONSTRAINT IF EXISTS fk_community_posts_author;

ALTER TABLE community_posts 
  ADD CONSTRAINT fk_community_posts_author 
  FOREIGN KEY (author_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

ALTER TABLE community_posts
  DROP CONSTRAINT IF EXISTS fk_community_posts_community;

ALTER TABLE community_posts 
  ADD CONSTRAINT fk_community_posts_community 
  FOREIGN KEY (community_id) 
  REFERENCES communities(id) 
  ON DELETE CASCADE;

-- 2. Community Comments
ALTER TABLE community_comments
  DROP CONSTRAINT IF EXISTS fk_community_comments_author;

ALTER TABLE community_comments 
  ADD CONSTRAINT fk_community_comments_author 
  FOREIGN KEY (author_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

ALTER TABLE community_comments
  DROP CONSTRAINT IF EXISTS fk_community_comments_post;

ALTER TABLE community_comments 
  ADD CONSTRAINT fk_community_comments_post 
  FOREIGN KEY (post_id) 
  REFERENCES community_posts(id) 
  ON DELETE CASCADE;

-- 3. Community Post Likes
ALTER TABLE community_post_likes
  DROP CONSTRAINT IF EXISTS fk_post_likes_user;

ALTER TABLE community_post_likes 
  ADD CONSTRAINT fk_post_likes_user 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

ALTER TABLE community_post_likes
  DROP CONSTRAINT IF EXISTS fk_post_likes_post;

ALTER TABLE community_post_likes 
  ADD CONSTRAINT fk_post_likes_post 
  FOREIGN KEY (post_id) 
  REFERENCES community_posts(id) 
  ON DELETE CASCADE;

-- Also reload the schema cache for PostgREST to pick this up immediately
NOTIFY pgrst, 'reload schema';
