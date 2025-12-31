# 🔧 FIX: Community RLS Policy Error

## ❌ Error
```
new row violates row-level security policy for table "community_members"
```

## ✅ Solution

The issue is **missing RLS policies** for INSERT/UPDATE/DELETE on `community_members` table.

---

## 📝 How to Fix

### Option 1: Run Migration in Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire content from: `supabase/migrations/002_fix_community_rls.sql`
5. Paste and click **Run**
6. ✅ Done!

### Option 2: Quick Fix (Copy-Paste This)

Go to Supabase SQL Editor and run this:

```sql
-- Fix RLS policies for community_members

-- SELECT: Anyone authenticated can view
CREATE POLICY "Community members visible to authenticated users"
  ON community_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- INSERT: Students join (pending) OR Mentors add (approved)
CREATE POLICY "Students can join communities"
  ON community_members FOR INSERT
  WITH CHECK (
    (student_id = auth.uid() AND status = 'pending')
    OR
    (
      EXISTS (
        SELECT 1 FROM communities
        WHERE id = community_members.community_id
        AND mentor_id = auth.uid()
      )
      AND status = 'approved'
    )
  );

-- UPDATE: Mentors can approve/reject
CREATE POLICY "Mentors can manage community members"
  ON community_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE id = community_members.community_id
      AND mentor_id = auth.uid()
    )
  );

-- DELETE: Students leave OR Mentors remove
CREATE POLICY "Students can leave communities"
  ON community_members FOR DELETE
  USING (
    student_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM communities
      WHERE id = community_members.community_id
      AND mentor_id = auth.uid()
    )
  );
```

---

## 🧪 Test After Fix

1. **As Mentor**:
   - Create a community ✅
   - View community ✅
   - Add student directly ✅
   - Approve join request ✅

2. **As Student**:
   - View all communities ✅
   - Join community (pending) ✅
   - Leave community ✅

---

## 🎯 What This Fixes

### Before (Broken):
- ❌ Community created but can't view
- ❌ Can't add members
- ❌ Can't approve requests
- ❌ RLS policy violation error

### After (Working):
- ✅ Create and view communities
- ✅ Add members directly
- ✅ Approve/reject requests
- ✅ Students can join/leave
- ✅ Full WhatsApp-style community functionality

---

## 📋 Verification Checklist

After running the migration, verify:

- [ ] Mentor can create community
- [ ] Mentor can view created community
- [ ] Mentor can click "Add Students" button
- [ ] Mentor can add students directly
- [ ] Student can see all communities
- [ ] Student can join community
- [ ] Mentor can approve join request
- [ ] Student can leave community
- [ ] Mentor can remove member

---

## 🚨 If Still Not Working

1. **Check Supabase Logs**:
   - Dashboard → Logs → Check for errors

2. **Verify User Role**:
   ```sql
   SELECT id, email, role FROM users WHERE id = auth.uid();
   ```

3. **Check Community Ownership**:
   ```sql
   SELECT * FROM communities WHERE mentor_id = auth.uid();
   ```

4. **Test RLS Policies**:
   ```sql
   -- This should work for mentors
   INSERT INTO community_members (community_id, student_id, status)
   VALUES ('your-community-id', 'student-id', 'approved');
   ```

---

## 💡 Why This Happened

The original migration (`001_initial_schema.sql`) only had:
- ✅ SELECT policy for community_members
- ❌ Missing INSERT policy
- ❌ Missing UPDATE policy  
- ❌ Missing DELETE policy

Without these policies, **no one could add members**, even though the API code was correct.

---

## 🎉 Result

After this fix, your communities will work **exactly like WhatsApp Communities**:
- Mentor creates ✅
- Students join ✅
- Approval system ✅
- Member management ✅
- University isolation ✅

---

Made with 💜 by Classera Team
