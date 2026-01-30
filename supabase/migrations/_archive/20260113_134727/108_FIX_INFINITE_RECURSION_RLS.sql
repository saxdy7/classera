-- =====================================================
-- FINAL FIX: USERS TABLE RLS - NO INFINITE RECURSION
-- =====================================================
-- This migration fixes the infinite recursion error
-- Run this in Supabase SQL Editor

-- =====================================================
-- STEP 1: Drop ALL existing policies for users table
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view users from same university" ON users;
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- =====================================================
-- STEP 2: Create helper function (SECURITY DEFINER)
-- =====================================================
-- This function bypasses RLS to get the current user's university_id
-- SECURITY DEFINER means it runs with the privileges of the function owner
-- NOTE: Created in public schema (not auth) to avoid permission errors

CREATE OR REPLACE FUNCTION public.get_user_university_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT university_id FROM public.users WHERE id = auth.uid();
$$;

-- =====================================================
-- STEP 3: Create CORRECT policies (NO RECURSION)
-- =====================================================

-- 1. Allow users to INSERT their own profile during sign-up
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Allow users to view their own profile (always)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- 3. Allow users to update their own profile (for onboarding)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Allow users to view others from same university (NO RECURSION)
-- Uses helper function instead of subquery
CREATE POLICY "Users can view users from same university"
  ON users FOR SELECT
  USING (
    university_id IS NOT NULL 
    AND university_id = public.get_user_university_id()
  );

-- =====================================================
-- STEP 4: Verify RLS is enabled
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Grant execute permission on helper function
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_user_university_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_university_id() TO anon;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Users table RLS policies fixed successfully!';
  RAISE NOTICE '✅ No infinite recursion - using SECURITY DEFINER function';
  RAISE NOTICE '✅ Sign-up should now work correctly';
  RAISE NOTICE '✅ Users can insert, view, and update their own profiles';
  RAISE NOTICE '✅ University isolation is maintained';
END $$;
