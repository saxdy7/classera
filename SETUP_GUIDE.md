# Classera - Complete Setup Guide

## 🚀 Phase 1: Supabase Setup (CURRENT)

### Step 1: Create Supabase Project

1. **Sign up at Supabase**
   - Go to https://supabase.com
   - Click "Start your project" (free tier)
   - Sign in with GitHub

2. **Create New Project**
   - Organization: Create or select one
   - Project name: `classera`
   - Database password: Generate strong password (save it!)
   - Region: Choose closest to your users (e.g., Mumbai for India)
   - Pricing plan: **Free** (500MB database, 1GB file storage, 2GB bandwidth)

3. **Get Project Credentials**
   - Go to Project Settings → API
   - Copy:
     - Project URL (e.g., `https://xxxxx.supabase.co`)
     - `anon` public key (safe for client-side)

### Step 2: Configure Environment Variables

Create `.env.local` in project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# AI Evaluation (Google Gemini - FREE 1M requests/month)
GEMINI_API_KEY=your-gemini-api-key

# Video Calling (Daily.co - FREE 10,000 minutes/month)
NEXT_PUBLIC_DAILY_API_KEY=your-daily-api-key

# Email Notifications (Resend - FREE 3,000 emails/month)
RESEND_API_KEY=your-resend-api-key
```

### Step 3: Run Database Migration

Option A: **Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project
2. Click "SQL Editor" in left sidebar
3. Click "New query"
4. Copy entire content from `supabase/migrations/001_initial_schema.sql`
5. Paste and click "Run"
6. Verify success (should see "Success. No rows returned")

Option B: **Using Supabase CLI**

```powershell
# Install Supabase CLI
scoop install supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Push migration
supabase db push
```

### Step 4: Verify Database Setup

1. Go to "Table Editor" in Supabase dashboard
2. You should see 10 tables:
   - ✅ universities (5 seeded rows)
   - ✅ users
   - ✅ communities
   - ✅ community_members
   - ✅ tests
   - ✅ test_submissions
   - ✅ messages
   - ✅ tasks
   - ✅ leaderboard
   - ✅ courses
   - ✅ course_progress

3. Check "Database" → "Policies" - Should see Row Level Security policies active

### Step 5: Configure Authentication

1. Go to "Authentication" → "Providers"
2. Enable "Email" provider (already enabled by default)
3. Go to "Authentication" → "URL Configuration"
4. Set Site URL: `http://localhost:3000` (dev) or your production URL
5. Add Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (production)

### Step 6: Test the Application

```powershell
# Start development server
pnpm dev

# Open browser
# http://localhost:3000
```

**Test Authentication Flow:**
1. Go to http://localhost:3000/auth/sign-up
2. Create account with university email (e.g., `test@lpu.co.in`)
3. Choose role (Student/Mentor)
4. Should redirect to `/onboarding`

---

## 📋 Phase 2: Get Free API Keys

### 1. Google Gemini AI (FREE 1M requests/month)

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy key → Add to `.env.local` as `GEMINI_API_KEY`

**What it does:**
- Evaluates MCQ and coding test submissions
- Provides detailed analysis and feedback
- Generates personalized improvement suggestions

### 2. Daily.co Video API (FREE 10,000 minutes/month)

1. Go to https://dashboard.daily.co/signup
2. Sign up (email/Google)
3. Go to "Developers" → "API Keys"
4. Copy API key → Add to `.env.local` as `NEXT_PUBLIC_DAILY_API_KEY`

**What it does:**
- Live video calling for tests and mentorship sessions
- Screen sharing for collaborative debugging
- Recording for test proctoring

### 3. Resend Email API (FREE 3,000 emails/month)

1. Go to https://resend.com/signup
2. Sign up with GitHub
3. Go to "API Keys"
4. Create new key → Copy → Add to `.env.local` as `RESEND_API_KEY`

**What it does:**
- Welcome emails after sign-up
- Test invitation notifications
- Community join request alerts
- Daily digest emails

### 4. YouTube Data API v3 (FREE 10,000 requests/day)

1. Go to https://console.cloud.google.com/
2. Create new project: "Classera"
3. Enable "YouTube Data API v3"
4. Create credentials → API Key
5. Add to `.env.local` as `YOUTUBE_API_KEY`

**What it does:**
- Fetch course videos from playlists
- Display video metadata (title, duration, thumbnail)
- Track course progress

---

## 🏗️ Phase 3: Build Core Features (Next Steps)

### 3.1 Onboarding Flow
- [ ] Create `/onboarding/student` page (university selection, profile completion)
- [ ] Create `/onboarding/mentor` page (expertise, experience, verification)
- [ ] University search integration (already working in home page)
- [ ] Profile picture upload to Supabase Storage

### 3.2 Student Dashboard
- [ ] Today's schedule (upcoming tests, tasks)
- [ ] Quick stats (tests completed, average score, rank)
- [ ] Recent test results with AI feedback
- [ ] Community list (joined/pending requests)
- [ ] Task board (Kanban: To-Do, In Progress, Done)
- [ ] Mentor chat preview

### 3.3 Mentor Dashboard
- [ ] Community management (approve/reject requests)
- [ ] Create test interface (MCQ/Coding questions)
- [ ] Schedule live test (Daily.co room creation)
- [ ] Student submissions review
- [ ] Leaderboard analytics by university
- [ ] Bulk messaging to community

### 3.4 Test System
- [ ] Live test room (Daily.co integration)
- [ ] Screen recording (RecordRTC)
- [ ] Face monitoring (face-api.js)
- [ ] Real-time timer
- [ ] Auto-submit on time end
- [ ] AI evaluation (Gemini API)

### 3.5 Messaging & Communities
- [ ] 1-on-1 messaging (student ↔ mentor)
- [ ] Community chat (group messaging)
- [ ] Real-time updates (Supabase Realtime)
- [ ] File sharing
- [ ] Message read receipts

### 3.6 Course Portal
- [ ] Browse courses by specialization
- [ ] YouTube playlist integration
- [ ] Video progress tracking
- [ ] Mentor recommendations

### 3.7 Leaderboard
- [ ] Monthly rankings by university
- [ ] Filter by specialization
- [ ] Top performers highlight
- [ ] Personal rank badge

---

## 🛠️ Current Project Structure

```
d:\classera\
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page ✅
│   │   ├── auth/
│   │   │   ├── sign-in/page.tsx       # Sign in page ✅
│   │   │   ├── sign-up/page.tsx       # Sign up page ✅
│   │   │   └── callback/route.ts      # Auth callback ✅
│   │   ├── api/
│   │   │   └── search-universities/   # University search ✅
│   │   ├── dashboard/
│   │   │   ├── student/               # TODO: Build student dashboard
│   │   │   └── mentor/                # TODO: Build mentor dashboard
│   │   └── onboarding/                # TODO: Build onboarding flow
│   ├── components/
│   │   └── ui/
│   │       └── UniversitySearch.tsx   # ✅
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts              # Browser client ✅
│   │       ├── server.ts              # Server client ✅
│   │       └── middleware.ts          # Auth middleware ✅
│   └── types/
│       └── database.types.ts          # TypeScript types ✅
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     # Database schema ✅
├── .env.local.example                 # Template ✅
└── .env.local                         # TODO: Add your keys
```

---

## ✅ Completed Tasks (Phase 1)

- ✅ Next.js 16 project with TypeScript
- ✅ Tailwind CSS 4 configured
- ✅ Supabase packages installed
- ✅ Database schema designed (10 tables)
- ✅ Row Level Security policies
- ✅ TypeScript types generated
- ✅ Authentication pages (Sign In/Sign Up)
- ✅ University search (OpenDataSoft + Hipolabs)
- ✅ Landing page with animations
- ✅ Environment variables template

---

## 🎯 Immediate Next Steps

1. **Create Supabase project** (5 minutes)
2. **Run database migration** (2 minutes)
3. **Get API keys** (15 minutes)
4. **Test sign-up flow** (5 minutes)
5. **Build onboarding flow** (1-2 hours)
6. **Build student dashboard** (3-4 hours)

---

## 📊 Free Tier Limits Summary

| Service | Free Tier | Limit |
|---------|-----------|-------|
| **Supabase** | Database | 500MB storage |
| **Supabase** | Auth | Unlimited users |
| **Supabase** | Storage | 1GB files |
| **Supabase** | Bandwidth | 2GB/month |
| **Daily.co** | Video | 10,000 minutes/month |
| **Gemini AI** | API Requests | 1M requests/month |
| **Resend** | Emails | 3,000 emails/month |
| **YouTube API** | Requests | 10,000 requests/day |
| **Vercel** | Hosting | 100GB bandwidth |

**Total Monthly Cost: $0** 🎉

---

## 🆘 Troubleshooting

### Issue: "Invalid API credentials"
- **Solution**: Double-check `.env.local` values
- Restart dev server: `pnpm dev`

### Issue: "Database connection failed"
- **Solution**: Verify Supabase URL and key
- Check project status in Supabase dashboard

### Issue: "Migration failed"
- **Solution**: Drop all tables and re-run migration
- Or create fresh Supabase project

### Issue: "Cannot find module '@/lib/supabase/client'"
- **Solution**: Check `tsconfig.json` has `"@/*": ["./src/*"]`
- Restart TypeScript server in VS Code

---

## 📞 Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Daily.co Docs**: https://docs.daily.co
- **Gemini API Docs**: https://ai.google.dev/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**Ready to proceed? Let's create your Supabase project and run the migration!** 🚀
