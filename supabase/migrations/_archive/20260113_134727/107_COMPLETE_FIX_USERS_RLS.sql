-- =====================================================
-- COMPLETE FIX: USERS TABLE RLS POLICIES FOR SIGN UP
-- =====================================================
-- This migration fixes the "new row violates row-level security policy" error
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
-- STEP 2: Create CORRECT policies
-- =====================================================

-- 1. Allow users to INSERT their own profile during sign-up
-- This is CRITICAL for sign-up to work
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. Allow users to view their own profile (always, even without university_id)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- 3. Allow users to update their own profile (for onboarding)
-- IMPORTANT: No university_id check here to allow onboarding
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Allow users to view others from same university (after onboarding)
-- This uses a subquery to avoid circular dependency
CREATE POLICY "Users can view users from same university"
  ON users FOR SELECT
  USING (
    university_id IS NOT NULL 
    AND university_id = (SELECT university_id FROM users WHERE id = auth.uid())
  );

-- =====================================================
-- STEP 3: Verify RLS is enabled
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Users table RLS policies fixed successfully!';
  RAISE NOTICE '✅ Sign-up should now work correctly';
  RAISE NOTICE '✅ Users can insert, view, and update their own profiles';
  RAISE NOTICE '✅ University isolation is maintained';
END $$;
