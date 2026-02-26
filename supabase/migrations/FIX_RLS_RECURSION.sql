-- ============================================================================
-- CLASSERA — FIX INFINITE RLS RECURSION ON users TABLE
-- ============================================================================
-- Error: code 42P17 "infinite recursion detected in policy for relation users"
-- Cause: The SELECT policy on `users` does a subquery back to `users` to check
--        university_id, which triggers itself → infinite loop.
--
-- Solution: Use a SECURITY DEFINER helper function that reads university_id
--           WITHOUT going through RLS, breaking the recursion.
--
-- HOW TO RUN: Paste this entire file into Supabase SQL Editor → Run
-- ============================================================================

-- Step 1: Drop ALL existing policies on users to start clean
DROP POLICY IF EXISTS "Users can view users in their university" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can insert any profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;

-- Step 2: Create a SECURITY DEFINER helper function.
-- This function runs as the DB owner (bypasses RLS), so it can safely
-- check the university of the current user without causing recursion.
CREATE OR REPLACE FUNCTION public.get_my_university_id()
RETURNS uuid AS $$
  SELECT university_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 3: Create correct, non-recursive SELECT policy
-- Checks own profile (simple, no subquery) OR same university (via DEFINER function)
CREATE POLICY "users_can_view_university_members" ON public.users
    FOR SELECT USING (
        -- Own profile: simple equality, no subquery → no recursion
        id = auth.uid()
        OR
        -- Same university: uses SECURITY DEFINER fn, completely outside RLS
        university_id = public.get_my_university_id()
    );

-- Step 4: INSERT policy — allow own insert or service role (for API routes)
CREATE POLICY "users_can_insert_own_profile" ON public.users
    FOR INSERT WITH CHECK (
        id = auth.uid()
        OR
        auth.jwt()->>'role' = 'service_role'
    );

-- Step 5: UPDATE policy — allow own update or service role
CREATE POLICY "users_can_update_own_profile" ON public.users
    FOR UPDATE USING (
        id = auth.uid()
        OR
        auth.jwt()->>'role' = 'service_role'
    );

-- Step 6: Ensure universities are readable by anyone (needed for onboarding dropdowns)
DROP POLICY IF EXISTS "Anyone can view universities" ON public.universities;
CREATE POLICY "Anyone can view universities" ON public.universities
    FOR SELECT USING (true);

-- ============================================================================
-- VERIFICATION — Run this after to confirm policies are in place
-- ============================================================================
SELECT
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
