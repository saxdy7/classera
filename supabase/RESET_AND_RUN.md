# Database Setup Instructions

## The Problem
Your database has old migration artifacts that conflict with the consolidated schema. The `is_read` column error indicates the old `messages` table structure is interfering.

## Solution: Two-Step Process

### Step 1: Complete Reset
Run this SQL **FIRST** in Supabase Dashboard → SQL Editor:

```sql
-- STEP 1: COMPLETE DATABASE RESET
-- This will delete ALL data and tables

-- Drop all tables in the correct order to avoid dependency issues
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

-- Drop function if exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

### Step 2: Run the Consolidated Schema
After Step 1 completes successfully, run the entire contents of:
`supabase/migrations/999_CLEAN_CONSOLIDATED_SCHEMA.sql`

## Why This Works
1. **Step 1** completely removes all tables and their dependencies
2. **Step 2** creates fresh tables with the correct schema including the `is_read` column
3. No conflicts between old and new schemas

## Verify Success
After both steps complete, you should see:
- ✅ Success message in Supabase SQL Editor
- ✅ All tables visible in Supabase Dashboard → Table Editor
- ✅ Sample University in the `universities` table

## Next: Configure Auth
1. In Supabase Dashboard → Authentication → Providers:
   - Enable **Google** OAuth (optional)
   - Enable **GitHub** OAuth (optional)
2. Copy the redirect URLs shown and add them to your Google/GitHub OAuth apps

## Then Test
```bash
cd D:\classera_workspace\classera
pnpm dev
```

Visit http://localhost:3000 and try signing up as a student or mentor!
