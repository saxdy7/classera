-- Drop existing policies (updated to use 'users' table instead of 'profiles')
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can view profiles from same university" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Drop function if exists
DROP FUNCTION IF EXISTS get_user_university(uuid);
DROP FUNCTION IF EXISTS auth.user_university();

-- Note: This file is for reference only. 
-- The actual RLS policies are managed in the migration files.
-- See: supabase/migrations/RUN_THIS_SQL_IN_SUPABASE.sql for the current policies.
