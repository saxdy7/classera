-- =====================================================
-- FIX USERS TABLE RLS POLICY FOR SIGN UP
-- =====================================================

-- Drop ALL existing policies for users table to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view users from same university" ON users;

-- Re-create Allow users to INSERT (Sign Up) their own profile
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Re-create Allow users to view their own profile (regardless of university_id)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Re-create Allow users to update their own profile (e.g. during onboarding)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Re-create Allow users to view others from same university (Isolation)
CREATE POLICY "Users can view users from same university"
  ON users FOR SELECT
  USING (university_id = (SELECT university_id FROM users WHERE id = auth.uid()));
