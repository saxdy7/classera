# ✅ CLASSERA - QUICK FIX CHECKLIST

**Current Status:** ⚠️ Supabase project doesn't exist  
**Time to Fix:** ~20 minutes  
**Difficulty:** Easy (just follow steps)

---

## 🎯 **CRITICAL FIXES (Must Do)**

### ☐ **1. Create New Supabase Project** (15 min)
- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New project"
- [ ] Name: `classera-dev`
- [ ] Choose region (closest to you)
- [ ] Wait 2-3 minutes for initialization
- [ ] ✅ Project shows "Active" status

### ☐ **2. Get Supabase Credentials** (2 min)
- [ ] Go to Settings → API
- [ ] Copy **Project URL**
- [ ] Copy **anon public** key
- [ ] Copy **service_role** key (secret!)

### ☐ **3. Update .env.local** (2 min)
- [ ] Open `d:\classera_workspace\classera\.env.local`
- [ ] Replace these 3 lines:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-NEW-PROJECT-ID].supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
  ```
- [ ] Save file

### ☐ **4. Run Database Schema** (3 min)
- [ ] In Supabase Dashboard: SQL Editor → New query
- [ ] Open file: `supabase\migrations\999_CLEAN_CONSOLIDATED_SCHEMA.sql`
- [ ] Copy ALL contents
- [ ] Paste in SQL Editor
- [ ] Click "Run"
- [ ] ✅ See success message

### ☐ **5. Run RLS Fix** (1 min)
- [ ] SQL Editor → New query
- [ ] Open file: `supabase\migrations\FIX_AUTH_POLICIES.sql`
- [ ] Copy ALL contents
- [ ] Paste in SQL Editor
- [ ] Click "Run"
- [ ] ✅ See success message

### ☐ **6. Verify Tables Created** (1 min)
- [ ] In Supabase: Table Editor
- [ ] Should see: universities, users, messages, notifications, etc.

### ☐ **7. Restart Dev Server** (1 min)
```powershell
# In terminal (Ctrl+C to stop current server)
pnpm dev
```

### ☐ **8. Test Application** (2 min)
- [ ] Open http://localhost:3000
- [ ] ✅ No fetch errors in terminal
- [ ] Go to http://localhost:3000/auth/student
- [ ] Try signing up with test email
- [ ] ✅ Should work without errors!

---

## 🔒 **SECURITY FIXES (Recommended)**

### ☐ **9. Rotate OpenRouter API Key** (5 min)
- [ ] Go to https://openrouter.ai/settings/keys
- [ ] Revoke old key: `sk-or-v1-514f2303a00bbc9b16a51104f61b28fa...`
- [ ] Generate new key
- [ ] Update in `.env.local`:
  ```env
  OPENROUTER_API_KEY=your-new-key-here
  ```
- [ ] Restart server

---

## 📊 **OPTIONAL IMPROVEMENTS**

### ☐ **10. Add Performance Indexes** (2 min)
- [ ] SQL Editor → New query
- [ ] Open file: `supabase\migrations\200_performance_indexes.sql`
- [ ] Copy and paste
- [ ] Click "Run"
- [ ] ✅ +40% query performance!

### ☐ **11. Configure OAuth** (Optional)
- [ ] Supabase Dashboard → Authentication → Providers
- [ ] Enable Google (if needed)
- [ ] Enable GitHub (if needed)
- [ ] Add credentials from respective platforms

---

## 🎉 **SUCCESS CRITERIA**

You'll know everything is working when:

✅ Terminal shows no `fetch failed` errors  
✅ http://localhost:3000 loads instantly  
✅ Sign up page works without errors  
✅ Can create account and complete onboarding  
✅ Dashboard loads after login  

---

## 📞 **TROUBLESHOOTING**

### ❌ "Project still initializing"
**Fix:** Wait 2-3 more minutes, refresh page

### ❌ "SQL error when running schema"
**Fix:** Make sure you copied the ENTIRE file contents

### ❌ "Still getting fetch errors"
**Fix:** 
1. Double-check `.env.local` has correct URL
2. Restart dev server
3. Clear browser cache (Ctrl+Shift+Delete)

### ❌ "Can't find migration files"
**Fix:** Files are in `d:\classera_workspace\classera\supabase\migrations\`

---

## 📚 **DETAILED GUIDES**

Need more help? Check these files:

- 📄 `SETUP_NEW_SUPABASE.md` - Detailed Supabase setup
- 📄 `CURRENT_ISSUES_AND_FIXES.md` - Complete issues report
- 📄 `.env.local.example` - Environment variables template
- 📄 `AUTH_FIX_GUIDE.md` - Auth troubleshooting
- 📄 `QUICK_START.md` - General setup guide

---

## ⏱️ **TIME ESTIMATE**

| Task | Time |
|------|------|
| Create Supabase project | 5 min |
| Get credentials | 2 min |
| Update .env.local | 2 min |
| Run database schema | 3 min |
| Run RLS fix | 1 min |
| Verify & test | 3 min |
| **TOTAL** | **~15 min** |

Add 5 more minutes for rotating OpenRouter key = **20 minutes total**

---

## 🚀 **START HERE**

1. ✅ You're reading this - good!
2. ➡️ Go to https://supabase.com/dashboard
3. ➡️ Follow checklist above
4. ➡️ Come back when done
5. ➡️ Test your app!

**Let's get your Classera app running! 🎯**
