# 🚀 QUICK FIX GUIDE - Community RLS Error

## ⚡ 3-Step Fix (Takes 2 Minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com
2. Open your `classera` project
3. Click **SQL Editor** in left sidebar

### Step 2: Run This SQL
Copy and paste this **entire code** into SQL Editor:

```sql
-- Fix RLS policies for community_members
DROP POLICY IF EXISTS "Community members visible to authenticated users" ON community_members;
DROP POLICY IF EXISTS "Students can join communities" ON community_members;
DROP POLICY IF EXISTS "Mentors can manage community members" ON community_members;
DROP POLICY IF EXISTS "Students can leave communities" ON community_members;

CREATE POLICY "Community members visible to authenticated users"
  ON community_members FOR SELECT
  USING (auth.uid() IS NOT NULL);

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

CREATE POLICY "Mentors can manage community members"
  ON community_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE id = community_members.community_id
      AND mentor_id = auth.uid()
    )
  );

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

### Step 3: Click "Run" Button
- Click the **RUN** button (or press Ctrl+Enter)
- Wait for "Success" message
- ✅ Done!

---

## 🧪 Test It

1. Go to `localhost:3000/dashboard/mentor/communities`
2. Click on your community
3. You should now see the community detail page ✅
4. Click "Add Students" button ✅
5. Everything should work! 🎉

---

## 📋 What This Fixes

| Before | After |
|--------|-------|
| ❌ RLS policy error | ✅ No errors |
| ❌ Can't view community | ✅ Can view |
| ❌ Can't add members | ✅ Can add |
| ❌ Can't approve requests | ✅ Can approve |

---

## 🆘 Still Having Issues?

### Check These:

1. **Are you logged in as a mentor?**
   ```sql
   SELECT role FROM users WHERE id = auth.uid();
   ```
   Should return: `mentor`

2. **Does the community exist?**
   ```sql
   SELECT * FROM communities WHERE mentor_id = auth.uid();
   ```
   Should show your community

3. **Clear browser cache**
   - Press Ctrl+Shift+R to hard refresh

4. **Restart dev server**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

## 📚 Next Steps

After fixing:
1. ✅ Read `COMMUNITY_RULES_WHATSAPP_STYLE.md` for full rules
2. ✅ Test creating and managing communities
3. ✅ Test student join flow
4. ✅ Test adding students directly

---

Made with 💜 by Classera Team
