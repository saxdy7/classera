# ⚠️ CRITICAL: SECURITY WARNING

## EXPOSED API KEY IN YOUR .env.local

Your `.env.local` file contains the **OLD EXPOSED API KEY** that was hardcoded in the codebase:

```
OPENROUTER_API_KEY=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
```

**This key is compromised** because it was committed to git history and is publicly visible.

### IMMEDIATE ACTION REQUIRED:

1. **Go to OpenRouter Dashboard**: https://openrouter.ai/settings/keys
2. **Revoke this key**: `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`
3. **Generate a NEW key**
4. **Update your .env.local**:
   ```env
   OPENROUTER_API_KEY=your-new-secure-key-here
   ```
5. **Restart your dev server**: `pnpm dev`

---

## FIXED SCHEMA MISMATCHES

### Issue 1: `field_of_study` Column Not Found ✅ FIXED
**Problem**: Code was trying to use `field_of_study` but the actual database column is `specialization_board`

**Fixed Files**:
- ✅ `src/app/api/auth/profile/route.ts`
- ✅ `src/app/onboarding/student/page.tsx`
- ✅ `src/app/dashboard/mentor/students/page.tsx`
- ✅ `src/app/dashboard/mentor/student/[id]/page.tsx`
- ✅ Deleted conflicting `src/lib/types/database.types.ts`

**Result**: Profile updates now work correctly

### Issue 2: `conversation_id` Column Not Found ✅ FIXED
**Problem**: Performance indexes were written for the NEW messages schema (migration 020) but your database is using the OLD schema (migration 003)

**Fixed Files**:
- ✅ `supabase/migrations/200_performance_indexes.sql`

**Changes**: Updated indexes to use `sender_id` and `receiver_id` instead of `conversation_id`

**Your Current Messages Schema**:
```sql
-- OLD Schema (migration 003) - Currently Active
messages (
  id,
  sender_id,
  receiver_id,
  content,
  read,
  created_at,
  updated_at
)
```

**Note**: If you want to upgrade to the conversation-based schema, run migration 020. Otherwise, the old schema works fine.

### Issue 3: `recipient_id` Column Not Found ✅ FIXED
**Problem**: The `community-notifications` API was trying to use a non-existent `community_notifications` table with `recipient_id` column

**Fixed Files**:
- ✅ `src/app/api/community-notifications/route.ts` (POST, GET, PATCH methods)
- ✅ `supabase/migrations/200_performance_indexes.sql`

**Changes**: 
- Updated API to use the actual `notifications` table with `user_id` column
- Fixed performance indexes to use `user_id` instead of `recipient_id`

**Actual Notifications Schema**:
```sql
-- From migration 006_notifications_system.sql
notifications (
  id,
  user_id,  -- Not recipient_id!
  type,
  title,
  message,
  related_id,
  related_type,
  action_url,
  metadata,
  read,
  read_at,
  created_at,
  updated_at
)
```

### Issue 4: `year_of_study` Column Not Found ✅ FIXED
**Problem**: The profile API and onboarding page were trying to use `year_of_study` but the actual column is `current_semester`

**Fixed Files**:
- ✅ `src/app/api/auth/profile/route.ts`
- ✅ `src/app/onboarding/student/page.tsx`

**Changes**: 
- Updated API parameter destructuring from `year_of_study` to `current_semester`
- Updated API updateData assignment to use `current_semester`
- Updated onboarding form submission to send `current_semester` instead of `year_of_study`

**Actual Users Schema**:
```sql
users (
  id,
  email,
  full_name,
  role,
  university_id,
  current_semester,  -- Not year_of_study!
  specialization_board,
  ...
)
```

---

## VERIFICATION STEPS

1. **Test profile update**:
   ```bash
   # Go to onboarding page and complete profile
   # Should work without "field_of_study" error
   ```

2. **Test messages**:
   ```bash
   # Send a message
   # Should work without "conversation_id" error
   ```

3. **Run performance indexes** (Optional):
   ```sql
   -- In Supabase SQL Editor
   -- Copy contents of: supabase/migrations/200_performance_indexes.sql
   -- Paste and Run
   ```

---

## SUMMARY OF FIXES

| Issue | Status | Fix |
|-------|--------|-----|
| Exposed API Key | ⚠️ **ACTION REQUIRED** | Rotate key on OpenRouter |
| field_of_study error | ✅ Fixed | Changed to specialization_board |
| conversation_id error | ✅ Fixed | Updated indexes for old schema |
| recipient_id error | ✅ Fixed | Changed to user_id in notifications |
| community_notifications table | ✅ Fixed | Use notifications table instead |
| year_of_study error | ✅ Fixed | Changed to current_semester |
| position column error | ✅ Fixed | Removed from tasks index |
| is_mentor_recommended error | ✅ Fixed | Changed to is_published for courses |
| Conflicting types file | ✅ Fixed | Deleted duplicate |

---

## NEXT STEPS

1. ⚠️ **ROTATE API KEY** (see above)
2. ✅ Restart dev server: `pnpm dev`
3. ✅ Test profile creation/update
4. ✅ Test messaging
5. ✅ Run performance indexes in Supabase (optional)

Your application should now work correctly! 🎉
