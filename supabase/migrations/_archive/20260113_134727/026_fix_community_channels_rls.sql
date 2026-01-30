-- =============================================
-- FIX COMMUNITY CHANNELS RLS POLICIES
-- =============================================
-- Adds missing INSERT, UPDATE, DELETE policies for community_channels
-- The original migration only had SELECT policy, causing RLS violations

-- =============================================
-- ADD MISSING RLS POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Mentors can create channels" ON community_channels;
DROP POLICY IF EXISTS "Mentors can update channels" ON community_channels;
DROP POLICY IF EXISTS "Mentors can delete channels" ON community_channels;

-- Mentors can create channels in their communities
CREATE POLICY "Mentors can create channels"
  ON community_channels FOR INSERT
  WITH CHECK (
    community_id IN (
      SELECT id FROM communities
      WHERE mentor_id = auth.uid()
    )
  );

-- Mentors can update channels in their communities
CREATE POLICY "Mentors can update channels"
  ON community_channels FOR UPDATE
  USING (
    community_id IN (
      SELECT id FROM communities
      WHERE mentor_id = auth.uid()
    )
  );

-- Mentors can delete channels in their communities
CREATE POLICY "Mentors can delete channels"
  ON community_channels FOR DELETE
  USING (
    community_id IN (
      SELECT id FROM communities
      WHERE mentor_id = auth.uid()
    )
  );

-- =============================================
-- UPDATE TRIGGER FUNCTION SECURITY
-- =============================================
-- Change the trigger function to run with SECURITY DEFINER
-- This allows it to bypass RLS when creating default channels

DROP FUNCTION IF EXISTS create_default_community_channels() CASCADE;

CREATE OR REPLACE FUNCTION create_default_community_channels()
RETURNS TRIGGER 
SECURITY DEFINER -- Run with function owner's privileges, bypassing RLS
SET search_path = public
AS $$
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_create_community_channels ON communities;
CREATE TRIGGER trigger_create_community_channels
  AFTER INSERT ON communities
  FOR EACH ROW
  EXECUTE FUNCTION create_default_community_channels();

-- =============================================
-- FIX COMMUNITIES RLS FOR STUDENTS
-- =============================================
-- Students should be able to see communities they are members of

-- Create helper function if it doesn't exist
CREATE OR REPLACE FUNCTION get_user_university_id()
RETURNS UUID AS $$
  SELECT university_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

DROP POLICY IF EXISTS "Users can view communities from same university" ON communities;

CREATE POLICY "Users can view communities from same university"
  ON communities FOR SELECT
  USING (
    -- Mentors can see their own communities
    mentor_id = auth.uid()
    OR
    -- Users can see communities from their university
    university_id = get_user_university_id()
    OR
    -- Students can see communities they are approved members of
    id IN (
      SELECT community_id 
      FROM community_members
      WHERE student_id = auth.uid() 
      AND status = 'approved'
    )
  );

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- This migration fixes:
-- ✅ Missing INSERT policy for community_channels
-- ✅ Missing UPDATE policy for community_channels
-- ✅ Missing DELETE policy for community_channels
-- ✅ Trigger function now runs with SECURITY DEFINER to bypass RLS for default channels
-- ✅ Students can now see communities they are approved members of
