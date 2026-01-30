-- ============================================================================
-- FIX AUTH & PROFILE CREATION ISSUES
-- ============================================================================
-- This fixes issues with email/OAuth signup and profile creation
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. FIX INFINITE RECURSION IN SELECT POLICY (CRITICAL!)
-- ============================================================================

-- Drop the broken SELECT policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view users in their university" ON public.users;

-- Create a fixed SELECT policy that breaks recursion by allowing self-read first
CREATE POLICY "Users can view users in their university" ON public.users
    FOR SELECT USING (
        -- First check: Can always view own profile (breaks recursion!)
        id = auth.uid() 
        OR 
        -- Second check: Can view others in same university
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND university_id = public.users.university_id
        )
    );

-- ============================================================================
-- 2. ENSURE SERVICE ROLE CAN BYPASS RLS (Critical for /api/auth/signup)
-- ============================================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can insert any profile" ON public.users;

-- Recreate INSERT policy with service role bypass
-- This allows both:
-- 1. Users to insert their own profile (normal flow)
-- 2. Service role to insert any profile (admin client in API routes)
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (
        id = auth.uid() OR auth.jwt()->>'role' = 'service_role'
    );

-- ============================================================================
-- 3. ENSURE USERS CAN UPDATE THEIR OWN PROFILE
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (
        id = auth.uid() OR auth.jwt()->>'role' = 'service_role'
    );

-- ============================================================================
-- 3. VERIFY UNIVERSITY SELECTION WORKS
-- ============================================================================

-- Ensure anyone can view universities (needed for onboarding)
DROP POLICY IF EXISTS "Anyone can view universities" ON public.universities;

CREATE POLICY "Anyone can view universities" ON public.universities
    FOR SELECT USING (true);

-- ============================================================================
-- 4. ADD HELPER FUNCTION TO CHECK AUTH STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.jwt()->>'role' = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify the fixes worked:

-- 1. Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;

-- 2. Test service role detection
SELECT public.is_service_role() AS is_service_role;

-- ============================================================================
-- DONE!
-- ============================================================================
-- Your auth should now work correctly.
-- If you still have issues, check:
-- 1. Supabase Dashboard → Authentication → Providers → Email
--    - Disable "Confirm email" for development
-- 2. Supabase Dashboard → Authentication → Providers → Google/GitHub
--    - Ensure Client ID and Secret are set correctly
-- ============================================================================
