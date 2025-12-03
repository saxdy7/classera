-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles from same university" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Drop function if exists
DROP FUNCTION IF EXISTS get_user_university(uuid);
DROP FUNCTION IF EXISTS auth.user_university();

-- Simple policies without recursion
CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);
