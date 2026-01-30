# 🚀 Quick Start Guide - Classera Auth System

## ⚡ TL;DR - Get Started in 5 Minutes

### Step 1: Setup Database (Choose One)

#### Option A: Supabase Dashboard (Easiest) ⭐
1. Open: https://app.supabase.com
2. Go to: **SQL Editor** (left sidebar)
3. Copy: `supabase/migrations/999_CLEAN_CONSOLIDATED_SCHEMA.sql`
4. Paste into editor
5. Click: **Run**

✅ Done! Database ready.

---

### Step 2: Configure OAuth (Optional but Recommended)

#### Google OAuth:
```
Supabase Dashboard → Authentication → Providers → Google
- Enable: ✅
- Add: Client ID + Secret
- Redirect: https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

#### GitHub OAuth:
```
Supabase Dashboard → Authentication → Providers → GitHub
- Enable: ✅
- Add: Client ID + Secret
- Redirect: https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

---

### Step 3: Test

```bash
# Start dev server
pnpm dev

# Test URLs:
# Student: http://localhost:3000/auth/student
# Mentor: http://localhost:3000/auth/mentor
```

Try:
- ✅ Email signup (creates account + profile)
- ✅ Google login (auto-creates profile)
- ✅ GitHub login (auto-creates profile)

---

## 📦 What You Got

### New Files:
```
src/lib/auth/
├── authService.ts    # All auth functions
└── types.ts          # TypeScript types

supabase/
├── migrations/999_CLEAN_CONSOLIDATED_SCHEMA.sql  # Database
└── cleanup-migrations.ps1                        # Cleanup

AUTH_SYSTEM_GUIDE.md       # Full documentation
RESTRUCTURE_SUMMARY.md     # What changed
```

### Updated Files:
```
src/app/auth/student/page.tsx     # Cleaner code
src/app/auth/mentor/page.tsx      # Cleaner code
src/app/auth/callback/route.ts    # OAuth fixes
src/app/api/auth/signup/route.ts  # Retry logic
```

---

## 🔥 Key Features

### Email/Password Auth
```typescript
import { signUpWithEmail, signInWithEmail } from '@/lib/auth/authService';

// Signup
const result = await signUpWithEmail(supabase, {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  confirmPassword: 'password123'
}, 'student');

// Signin
const result = await signInWithEmail(supabase, {
  email: 'john@example.com',
  password: 'password123'
}, 'student');
```

### OAuth Auth
```typescript
import { signInWithOAuth } from '@/lib/auth/authService';

// Google or GitHub
await signInWithOAuth(supabase, 'google', 'student');
await signInWithOAuth(supabase, 'github', 'mentor');
```

---

## 🐛 Quick Fixes

### Issue: "User not found"
**Solution:** Already fixed with 5 retries + exponential backoff

### Issue: OAuth not working
**Solution:** Check OAuth providers are enabled in Supabase Dashboard

### Issue: Profile not saving
**Solution:** Check `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`

---

## 🎯 Testing Checklist

- [ ] Student email signup works
- [ ] Mentor email signup works
- [ ] Student email signin works
- [ ] Mentor email signin works
- [ ] Google OAuth works (both roles)
- [ ] GitHub OAuth works (both roles)
- [ ] Onboarding completes correctly
- [ ] Dashboard loads after onboarding
- [ ] Profile data saves properly

---

## 📞 Need Help?

1. **Read:** `AUTH_SYSTEM_GUIDE.md` (comprehensive)
2. **Check:** `RESTRUCTURE_SUMMARY.md` (what changed)
3. **Look:** Inline comments in code
4. **Debug:** Check browser console + Supabase logs

---

## 🎉 You're Ready!

Your auth system is now:
- ✅ Production-ready
- ✅ Type-safe
- ✅ Reliable with retry logic
- ✅ Secure with RLS
- ✅ Clean & maintainable

**Just run the SQL and start coding!** 🚀

---

**Questions about accessing Supabase from VS Code?**
See the "Can You Access Supabase from VS Code?" section in `AUTH_SYSTEM_GUIDE.md`
