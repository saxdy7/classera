-- ============================================================================
-- RESET DATABASE - Run this FIRST to clean up old migrations
-- ============================================================================
-- This script drops all existing tables and policies to ensure a clean state
-- Run this BEFORE running 999_CLEAN_CONSOLIDATED_SCHEMA.sql
-- ============================================================================

-- Drop all policies first (to avoid dependency issues)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Anyone can view universities" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view users in their university" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own profile" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view their messages" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can send messages" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update received messages" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own notifications" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own notifications" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can delete own notifications" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Service can insert notifications" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Students can view their requests" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Students can create requests" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Mentors can update requests" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Students can view own tasks" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Students can create tasks" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Task owners can update tasks" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view communities in their university" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can create communities" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Members can view community members" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can join communities" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Members can view channels" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Members can view messages" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Members can send messages" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view published courses" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Instructors can manage own courses" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view sessions in their university" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Mentors can create sessions" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Mentors can manage own sessions" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can view session participants" ON public.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "Users can join sessions" ON public.' || r.tablename;
    END LOOP;
END $$;

-- Drop all tables (cascade to remove dependencies)
DROP TABLE IF EXISTS public.session_participants CASCADE;
DROP TABLE IF EXISTS public.live_sessions CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.community_messages CASCADE;
DROP TABLE IF EXISTS public.community_channels CASCADE;
DROP TABLE IF EXISTS public.community_members CASCADE;
DROP TABLE IF EXISTS public.communities CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.connection_requests CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.universities CASCADE;

-- Drop any old triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
DROP TRIGGER IF EXISTS update_connection_requests_updated_at ON public.connection_requests;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
DROP TRIGGER IF EXISTS update_communities_updated_at ON public.communities;
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.live_sessions;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- ============================================================================
-- DATABASE RESET COMPLETE
-- ============================================================================
-- Now run 999_CLEAN_CONSOLIDATED_SCHEMA.sql to create fresh tables
-- ============================================================================
