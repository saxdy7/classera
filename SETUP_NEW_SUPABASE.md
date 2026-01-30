# 🚀 Setup New Supabase Project for Classera

## ❌ Current Issue
Your Supabase project `jxcnyqipkfwxclvnumuj` doesn't exist or was deleted.
The ping test failed: `Ping request could not find host jxcnyqipkfwxclvnumuj.supabase.co`

---

## ✅ Step-by-Step Solution

### **Step 1: Create New Supabase Project** (5 minutes)

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Sign in with your account

2. **Create New Organization** (if needed)
   - Click "New organization"
   - Name it: "Classera" or your preferred name

3. **Create New Project**
   - Click "New project"
   - **Project name:** `classera-dev`
   - **Database password:** Generate a strong password (SAVE THIS!)
   - **Region:** Choose closest to you (e.g., Mumbai, Singapore)
   - **Pricing plan:** Free
   - Click "Create new project"
   - ⏳ Wait 2-3 minutes for project to initialize

---

### **Step 2: Get Your New Credentials** (2 minutes)

1. **Go to Project Settings**
   - Click on your project
   - Go to: **Settings** → **API**

2. **Copy These Values:**
   ```
   Project URL: https://[YOUR-NEW-PROJECT-ID].supabase.co
   anon public key: eyJhbGc... (long string)
   service_role key: eyJhbGc... (long string - keep secret!)
   ```

---

### **Step 3: Update .env.local** (1 minute)

Open `.env.local` and replace the Supabase section:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-NEW-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key-here
```

**IMPORTANT:** Replace `[YOUR-NEW-PROJECT-ID]`, `your-new-anon-key-here`, and `your-new-service-role-key-here` with the actual values from Step 2.

---

### **Step 4: Run Database Schema** (3 minutes)

1. **Go to SQL Editor**
   - In Supabase Dashboard: **SQL Editor** (left sidebar)
   - Click "New query"

2. **Run the Consolidated Schema**
   - Open file: `d:\classera_workspace\classera\supabase\migrations\999_CLEAN_CONSOLIDATED_SCHEMA.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click **"Run"** button
   - ✅ Wait for success message

3. **Run the RLS Fix** (CRITICAL)
   - Click "New query" again
   - Open file: `d:\classera_workspace\classera\supabase\migrations\FIX_AUTH_POLICIES.sql`
   - Copy ALL contents
   - Paste into SQL Editor
   - Click **"Run"** button
   - ✅ Wait for success message

---

### **Step 5: Verify Database** (1 minute)

In Supabase Dashboard:
- Go to **Table Editor** (left sidebar)
- You should see these tables:
  - ✅ universities
  - ✅ users
  - ✅ messages
  - ✅ notifications
  - ✅ communities
  - ✅ tasks
  - ✅ courses
  - ✅ live_sessions
  - And more...

---

### **Step 6: Restart Your Dev Server** (1 minute)

```powershell
# Stop the current server (Ctrl+C if running)
# Then restart:
pnpm dev
```

---

### **Step 7: Test the Application** (2 minutes)

1. **Open Browser**
   - Go to: http://localhost:3000

2. **Test Sign Up**
   - Go to: http://localhost:3000/auth/student
   - Sign up with a test email
   - Should work without errors!

---

## 🎯 Quick Checklist

- [ ] Created new Supabase project
- [ ] Copied Project URL
- [ ] Copied anon key
- [ ] Copied service_role key
- [ ] Updated `.env.local` with new credentials
- [ ] Ran `999_CLEAN_CONSOLIDATED_SCHEMA.sql`
- [ ] Ran `FIX_AUTH_POLICIES.sql`
- [ ] Verified tables exist in Table Editor
- [ ] Restarted dev server (`pnpm dev`)
- [ ] Tested signup at http://localhost:3000/auth/student

---

## 🐛 Troubleshooting

### Issue: "Project is still initializing"
**Solution:** Wait 2-3 minutes and refresh the page

### Issue: "SQL error when running schema"
**Solution:** Make sure you're running the ENTIRE file, not just part of it

### Issue: "Still getting fetch failed errors"
**Solution:** 
1. Double-check the URL in `.env.local` matches your new project URL
2. Make sure you restarted the dev server
3. Clear browser cache and cookies

---

## 📞 Need Help?

If you encounter issues:
1. Check Supabase Dashboard → **Logs** → **Postgres Logs**
2. Check browser console (F12) for errors
3. Verify `.env.local` has correct values (no typos)

---

**Total Time: ~15 minutes**

After completing these steps, your Classera app will be fully functional with a fresh Supabase database! 🎉
