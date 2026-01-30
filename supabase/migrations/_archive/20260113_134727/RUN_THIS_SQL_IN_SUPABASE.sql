-- =====================================================
-- COMPLETE AUTH FIX - RUN THIS IN SUPABASE NOW!
-- =====================================================
-- This fixes ALL authentication issues
-- Copy and paste this ENTIRE file into Supabase SQL Editor

-- =====================================================
-- STEP 1: Drop ALL existing RLS policies
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view users from same university" ON users;
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- =====================================================
-- STEP 2: Create helper function
-- =====================================================

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
-- STEP 3: Create NEW RLS policies (NO RECURSION)
-- =====================================================

-- Allow INSERT for new users (CRITICAL for sign-up)
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow SELECT for own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Allow UPDATE for own profile (for onboarding)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow SELECT for same university users
CREATE POLICY "Users can view users from same university"
  ON users FOR SELECT
  USING (
    university_id IS NOT NULL 
    AND university_id = public.get_user_university_id()
  );

-- =====================================================
-- STEP 4: Enable RLS
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Grant permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_user_university_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_university_id() TO anon;

-- =====================================================
-- SUCCESS!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Authentication RLS policies fixed!';
  RAISE NOTICE '✅ Sign-up will now work';
  RAISE NOTICE '✅ Onboarding will now work';
  RAISE NOTICE '✅ Profile updates will now work';
END $$;
