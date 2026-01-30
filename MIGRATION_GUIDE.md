# MIGRATION EXECUTION GUIDE

## CRITICAL: Must Run These Manually in Supabase SQL Editor

### Step 1: Fix RLS Infinite Recursion (HIGHEST PRIORITY)
**File**: `108_FIX_INFINITE_RECURSION_RLS.sql`
**Why**: Prevents "infinite recursion detected" errors during sign-up
**When**: Before any users sign up
**How**:
1. Open Supabase Dashboard → SQL Editor
2. Copy entire content of `108_FIX_INFINITE_RECURSION_RLS.sql`
3. Paste and click "Run"
4. Verify success message appears

### Step 2: Add Performance Indexes (RECOMMENDED)
**File**: `200_performance_indexes.sql`
**Why**: Significantly improves query performance
**When**: After all other migrations complete
**How**:
1. Open Supabase Dashboard → SQL Editor
2. Copy entire content of `200_performance_indexes.sql`
3. Paste and click "Run"
4. Verify success message appears

---

## Migration File Naming Convention (FIXED)

### Duplicate Numbers Resolved
The following migrations were renamed to ensure correct execution order:

| Old Name | New Name | Purpose |
|----------|----------|---------|
| 002_fix_community_rls.sql | **002b_fix_community_rls.sql** | Community RLS fixes |
| 003_community_messaging_system.sql | **003b_community_messaging_system.sql** | Community messaging |
| 004_realtime_enhancements.sql | **004b_realtime_enhancements.sql** | Realtime features |
| 005_test_system_enhancements.sql | **005b_test_system_enhancements.sql** | Test enhancements |
| 106_roadmap_seed_data.sql | **106b_roadmap_seed_data.sql** | Roadmap seed data |
| 107_courses_system.sql | **107b_courses_system.sql** | Courses system |

### Deleted Files
- **999_fix_messages_rls.sql** - ❌ Removed (outdated, references old schema)

---

## Schema Conflicts Resolved

### Messages Table
**Current Active Schema**: Migration `020_complete_messages_system.sql`
- Uses conversation-based architecture
- Primary key: `conversation_id` (not `receiver_id`)
- Supports WhatsApp-style features

**Deprecated Schema**: Migration `003_messages.sql`
- Simple sender/receiver model
- Should be ignored (020 drops and recreates)

**Action Required**: None - 020 handles the migration correctly

---

## Recommended Migration Order

1. ✅ `001_initial_schema.sql` - Core tables
2. ✅ `002_connection_requests.sql` - Connection requests
3. ✅ `002b_fix_community_rls.sql` - Community RLS
4. ✅ `003_messages.sql` - Initial messages (will be replaced)
5. ✅ `003b_community_messaging_system.sql` - Community messaging
6. ✅ `004_advanced_chat_features.sql` - Chat features
7. ✅ `004b_realtime_enhancements.sql` - Realtime
8. ✅ `005_realtime_broadcast_setup.sql` - Broadcast
9. ✅ `005b_test_system_enhancements.sql` - Tests
10. ✅ `006_notifications_system.sql` - Notifications
11. ✅ `007_community_polls.sql` - Polls
12. ✅ `008_question_bank.sql` - Question bank
13. ✅ `010_courses_portal.sql` - Courses
14. ✅ `015_notifications_and_enhancements.sql` - Enhanced notifications
15. ✅ `020_complete_messages_system.sql` - **REPLACES messages table**
16. ✅ `025_community_posts_system.sql` - Community posts
17. ✅ `026_fix_community_channels_rls.sql` - Channel RLS
18. ✅ `030_enable_realtime_messages.sql` - Enable realtime
19. ✅ `100_university_isolation_rls.sql` - University isolation
20. ✅ `101_email_domain_verification.sql` - Email validation
21. ✅ `102_test_proctoring_system.sql` - Proctoring
22. ✅ `103_live_sessions_system.sql` - Live sessions
23. ✅ `104_fix_session_notifications.sql` - Session notifications
24. ✅ `105_fix_email_validation_trigger.sql` - Email trigger fix
25. ✅ `106_fix_users_rls_signup.sql` - Users RLS
26. ✅ `106b_roadmap_seed_data.sql` - Roadmap data
27. ✅ `107_COMPLETE_FIX_USERS_RLS.sql` - Complete users RLS
28. ✅ `107b_courses_system.sql` - Courses system
29. ⚠️ **MANUAL**: `108_FIX_INFINITE_RECURSION_RLS.sql` - **RUN IN SQL EDITOR**
30. ✅ `998_database_health_check.sql` - Health check
31. ✅ `200_performance_indexes.sql` - **RUN IN SQL EDITOR** (optional but recommended)

---

## Environment Variables Required

Create `.env.local` with these values:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional (features degrade gracefully)
OPENROUTER_API_KEY=your-key
GROQ_API_KEY=your-key
DEEPSEEK_API_KEY=your-key
GEMINI_API_KEY=your-key
DAILY_API_KEY=your-key
```

See `.env.local.example` for complete list.

---

## Verification Checklist

After running migrations:

- [ ] Sign up works without RLS errors
- [ ] Messages use conversation_id (not receiver_id)
- [ ] University isolation enforced
- [ ] Performance indexes created
- [ ] All tests pass
- [ ] No console errors in browser

---

## Troubleshooting

### "infinite recursion detected in policy"
**Fix**: Run `108_FIX_INFINITE_RECURSION_RLS.sql` manually in SQL Editor

### "column receiver_id does not exist"
**Fix**: Ensure migration 020 ran successfully and TypeScript types are regenerated:
```bash
npx supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
```

### Migration order issues
**Fix**: Migrations run alphabetically. Ensure renamed files (002b, 003b, etc.) are used.

---

## Need Help?

1. Check Supabase logs: Dashboard → Logs → Postgres Logs
2. Verify RLS policies: Dashboard → Table Editor → [table] → RLS tab
3. Test queries: Dashboard → SQL Editor → write test queries
4. Check this guide: `MIGRATION_GUIDE.md`
