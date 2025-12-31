-- Fix RLS policies for community_members table
-- This migration adds missing INSERT, UPDATE, and DELETE policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Community members visible to authenticated users" ON community_members;
DROP POLICY IF EXISTS "Students can join communities" ON community_members;
DROP POLICY IF EXISTS "Mentors can manage community members" ON community_members;
DROP POLICY IF EXISTS "Students can leave communities" ON community_members;

-- SELECT: Anyone authenticated can view memberships
CREATE POLICY "Community members visible to authenticated users"
  ON community_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: Students can join (pending) OR Mentors can add directly (approved)
CREATE POLICY "Students can join communities"
  ON community_members FOR INSERT
  WITH CHECK (
    -- Student joining (pending status)
    (student_id = auth.uid() AND status = 'pending')
    OR
    -- Mentor adding student directly (approved status)
    (
      EXISTS (
        SELECT 1 FROM communities
        WHERE id = community_members.community_id
        AND mentor_id = auth.uid()
      )
      AND status = 'approved'
    )
  );

-- UPDATE: Only mentors can update member status (approve/reject)
CREATE POLICY "Mentors can manage community members"
  ON community_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE id = community_members.community_id
      AND mentor_id = auth.uid()
    )
  );

-- DELETE: Students can leave OR Mentors can remove
CREATE POLICY "Students can leave communities"
  ON community_members FOR DELETE
  USING (
    -- Student leaving their own membership
    student_id = auth.uid()
    OR
    -- Mentor removing a member
    EXISTS (
      SELECT 1 FROM communities
      WHERE id = community_members.community_id
      AND mentor_id = auth.uid()
    )
  );

-- Also add missing INSERT policy for communities (mentors only)
DROP POLICY IF EXISTS "Mentors create communities" ON communities;

CREATE POLICY "Mentors create communities"
  ON communities FOR INSERT
  WITH CHECK (
    mentor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'mentor')
  );

-- Add UPDATE policy for communities (mentors can update their own)
DROP POLICY IF EXISTS "Mentors update own communities" ON communities;

CREATE POLICY "Mentors update own communities"
  ON communities FOR UPDATE
  USING (mentor_id = auth.uid());

-- Add DELETE policy for communities (mentors can delete their own)
DROP POLICY IF EXISTS "Mentors delete own communities" ON communities;

CREATE POLICY "Mentors delete own communities"
  ON communities FOR DELETE
  USING (mentor_id = auth.uid());
