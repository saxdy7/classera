# Classera - Quick Start Checklist

## ✅ Phase 1: Database Setup (15 minutes)

### 1️⃣ Create Supabase Project
```
📍 https://supabase.com → Start your project
   ├─ Project name: classera
   ├─ Region: Mumbai (or closest)
   └─ Plan: Free ($0/month)
```

### 2️⃣ Get Credentials
```
Project Settings → API
   ├─ Copy: Project URL
   └─ Copy: anon public key
```

### 3️⃣ Create `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
```

### 4️⃣ Run Migration
```
Supabase Dashboard → SQL Editor → New Query
   ├─ Copy from: supabase/migrations/001_initial_schema.sql
   ├─ Paste & Run
   └─ Verify: 10 tables created ✅
```

### 5️⃣ Test Locally
```powershell
pnpm dev
# Open: http://localhost:3000/auth/sign-up
```

---

## 🔑 Phase 2: Get API Keys (Optional - 20 minutes)

### Gemini AI (Test Evaluation)
```
https://makersuite.google.com/app/apikey
→ Create API Key
→ Add to .env.local: GEMINI_API_KEY=xxx
```

### Daily.co (Video Calls)
```
https://dashboard.daily.co/signup
→ Developers → API Keys
→ Add to .env.local: NEXT_PUBLIC_DAILY_API_KEY=xxx
```

### Resend (Email Notifications)
```
https://resend.com/signup
→ API Keys → Create
→ Add to .env.local: RESEND_API_KEY=xxx
```

---

## 🎯 Current Status

| Feature | Status |
|---------|--------|
| Landing Page | ✅ Complete |
| University Search | ✅ Complete |
| Database Schema | ✅ Complete |
| Auth Pages (Sign In/Up) | ✅ Complete |
| TypeScript Types | ✅ Complete |
| Onboarding | ⏳ Next |
| Student Dashboard | ⏳ Next |
| Mentor Dashboard | ⏳ Next |
| Test System | ⏳ Next |
| Messaging | ⏳ Next |
| Leaderboard | ⏳ Next |

---

## 🚀 Next 3 Steps

1. **Create Supabase project** → Run migration
2. **Test authentication** → Sign up with test@lpu.co.in
3. **Build onboarding flow** → Let's code!

---

## 📂 Important Files

```
📁 Database Schema
   └─ supabase/migrations/001_initial_schema.sql

📁 Auth Pages
   ├─ src/app/auth/sign-in/page.tsx
   └─ src/app/auth/sign-up/page.tsx

📁 Supabase Clients
   ├─ src/lib/supabase/client.ts (browser)
   └─ src/lib/supabase/server.ts (server)

📁 Types
   └─ src/types/database.types.ts

📁 Environment
   ├─ .env.local.example (template)
   └─ .env.local (your keys - CREATE THIS!)
```

---

## 💡 Pro Tips

- ✅ Use university email for authentic testing (e.g., `test@lpu.co.in`)
- ✅ Start with Supabase only - add other APIs later
- ✅ Keep Supabase dashboard open to verify data
- ✅ Check browser console for errors during testing

---

**Ready? Let's create your Supabase project!** 🎉
