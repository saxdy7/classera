-- =============================================
-- COMPREHENSIVE DATABASE HEALTH CHECK & FIXES
-- =============================================
-- Run this in Supabase SQL Editor to identify and optionally fix issues

-- =============================================
-- 1. CHECK: Duplicate/Conflicting RLS Policies
-- =============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    ELSE cmd
  END as operation,
  COUNT(*) OVER (PARTITION BY tablename, cmd) as policy_count_for_operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- =============================================
-- 2. CHECK: Tables with RLS Enabled but No Policies
-- =============================================

SELECT 
  t.schemaname,
  t.tablename,
  t.rowsecurity as rls_enabled,
  COALESCE(p.policy_count, 0) as policies_count
FROM pg_tables t
LEFT JOIN (
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE 'sql_%'
ORDER BY t.tablename;

-- =============================================
-- 3. CHECK: Foreign Key Constraints Status
-- =============================================

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- =============================================
-- 4. CHECK: Missing Indexes on Foreign Keys
-- =============================================

SELECT
  t.relname AS table_name,
  a.attname AS column_name,
  'Missing index on FK' AS issue
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f' -- Foreign key constraints
  AND NOT EXISTS (
    SELECT 1
    FROM pg_index i
    WHERE i.indrelid = t.oid
      AND a.attnum = ANY(i.indkey)
  )
ORDER BY t.relname, a.attname;

-- =============================================
-- 5. CHECK: Tables with Data but No Rows Visible
-- =============================================
-- This checks if RLS is blocking all access

DO $$
DECLARE
  tbl RECORD;
  total_count BIGINT;
  visible_count BIGINT;
BEGIN
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN ('messages', 'users', 'tests', 'communities', 'tasks', 'notifications')
  LOOP
    -- Get total count (as admin)
    EXECUTE format('SELECT COUNT(*) FROM %I', tbl.tablename) INTO total_count;
    
    -- Get visible count (with RLS)
    BEGIN
      EXECUTE format('SELECT COUNT(*) FROM %I WHERE TRUE', tbl.tablename) INTO visible_count;
    EXCEPTION WHEN OTHERS THEN
      visible_count := -1; -- Error occurred
    END;
    
    RAISE NOTICE 'Table: %, Total Rows: %, Visible Rows: %', 
      tbl.tablename, total_count, visible_count;
  END LOOP;
END $$;

-- =============================================
-- 6. CHECK: Verify Critical Columns Exist
-- =============================================

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'messages' AND column_name IN ('id', 'sender_id', 'receiver_id', 'content', 'read_at', 'created_at'))
    OR (table_name = 'users' AND column_name IN ('id', 'email', 'full_name', 'role', 'university_id'))
    OR (table_name = 'connection_requests' AND column_name IN ('student_id', 'mentor_id', 'status'))
    OR (table_name = 'tasks' AND column_name IN ('student_id', 'title', 'status'))
    OR (table_name = 'courses' AND column_name IN ('id', 'title', 'recommended_by_mentor_id'))
  )
ORDER BY table_name, column_name;

-- =============================================
-- 7. CHECK: User Presence and Roles
-- =============================================

SELECT 
  role,
  COUNT(*) as user_count,
  COUNT(DISTINCT university_id) as universities,
  COUNT(CASE WHEN avatar_url IS NOT NULL THEN 1 END) as with_avatar,
  COUNT(CASE WHEN profile_verified THEN 1 END) as verified
FROM users
GROUP BY role;

-- =============================================
-- 8. CHECK: Messages Table Issues
-- =============================================

SELECT 
  'Total Messages' as metric,
  COUNT(*)::text as value
FROM messages
UNION ALL
SELECT 
  'Messages with sender',
  COUNT(*)::text
FROM messages
WHERE sender_id IS NOT NULL
UNION ALL
SELECT 
  'Messages with receiver',
  COUNT(*)::text
FROM messages
WHERE receiver_id IS NOT NULL
UNION ALL
SELECT 
  'Read Messages',
  COUNT(*)::text
FROM messages
WHERE read_at IS NOT NULL
UNION ALL
SELECT 
  'Unread Messages',
  COUNT(*)::text
FROM messages
WHERE read_at IS NULL;

-- =============================================
-- 9. CHECK: RLS Policy Definitions for Messages
-- =============================================

SELECT 
  policyname,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY cmd, policyname;

-- =============================================
-- SUCCESS
-- =============================================

SELECT '✅ Health check complete! Review the results above.' as status;
