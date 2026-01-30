# 🔄 Authentication Flow Diagrams

## Email/Password Signup Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Visits                              │
│                  /auth/student or /auth/mentor                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Fills Signup Form                            │
│          Name, Email, Password, Confirm Password                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Validation (Client Side)                        │
│         ✓ Password match ✓ Min 8 chars ✓ Email format          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              authService.signUpWithEmail()                       │
│                                                                  │
│  1. supabase.auth.signUp() → Creates auth user                 │
│  2. Wait 2500ms for propagation                                │
│  3. Retry 3x: createProfile() → Call /api/auth/signup          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  /api/auth/signup (Server)                       │
│                                                                  │
│  1. Check if profile exists → Return if yes                    │
│  2. Retry 5x: Verify auth user exists (exponential backoff)    │
│  3. Insert into users table (with admin client, bypasses RLS)  │
│  4. Return success                                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Check Email Confirmation                        │
│         If required → Show "Check your email" message           │
│         If not required → Redirect                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                Redirect to /onboarding/[role]                    │
│            Complete profile (university, etc.)                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Redirect to /dashboard/[role]                    │
│                      ✅ SUCCESS                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Email/Password Signin Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Visits                              │
│                  /auth/student or /auth/mentor                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Fills Signin Form                             │
│                   Email + Password                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              authService.signInWithEmail()                       │
│                                                                  │
│  1. supabase.auth.signInWithPassword()                         │
│  2. Check profile completeness                                 │
│  3. Determine redirect path                                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Is Profile Complete?                            │
│         (Has full_name AND university_id)                        │
└─────────────┬───────────────────────┬───────────────────────────┘
              │ YES                   │ NO
              ▼                       ▼
┌───────────────────────┐  ┌──────────────────────────────────────┐
│  /dashboard/[role]    │  │      /onboarding/[role]              │
│     ✅ SUCCESS        │  │  Complete missing info               │
└───────────────────────┘  └──────────────────────────────────────┘
```

---

## OAuth Flow (Google / GitHub)

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Clicks OAuth Button                      │
│              "Continue with Google/GitHub"                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              authService.signInWithOAuth()                       │
│                                                                  │
│  supabase.auth.signInWithOAuth({                               │
│    provider: 'google' | 'github',                              │
│    options: {                                                   │
│      redirectTo: '/auth/callback?role=student'                 │
│    }                                                            │
│  })                                                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Redirect to Provider                           │
│            (Google/GitHub login page)                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼ User Authorizes
┌─────────────────────────────────────────────────────────────────┐
│                Provider Redirects Back                           │
│       /auth/callback?code=xxxxx&role=student                     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                /auth/callback/route.ts (Server)                  │
│                                                                  │
│  1. Validate role parameter                                     │
│  2. Exchange code for session                                   │
│  3. Retry 3x: Check if profile exists                          │
│  4. If no profile → Call /api/auth/signup                      │
│  5. Extract name from OAuth metadata                            │
│  6. Create profile with admin client                            │
│  7. Check profile completeness                                  │
│  8. Determine redirect                                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Is Profile Complete?                            │
│         (Has full_name AND university_id)                        │
└─────────────┬───────────────────────┬───────────────────────────┘
              │ YES                   │ NO
              ▼                       ▼
┌───────────────────────┐  ┌──────────────────────────────────────┐
│  /dashboard/[role]    │  │      /onboarding/[role]              │
│     ✅ SUCCESS        │  │  Complete missing info               │
└───────────────────────┘  └──────────────────────────────────────┘
```

---

## Error Handling & Retry Logic

```
┌─────────────────────────────────────────────────────────────────┐
│                  Profile Creation Request                        │
│                 /api/auth/signup (POST)                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Check if profile already exists                     │
│         SELECT * FROM users WHERE id = user_id                   │
└─────────────┬───────────────────────┬───────────────────────────┘
              │ EXISTS                │ NOT EXISTS
              ▼                       ▼
┌───────────────────────┐  ┌──────────────────────────────────────┐
│  Return success       │  │   Verify Auth User Exists            │
│  (already exists)     │  │   (with exponential backoff)         │
└───────────────────────┘  └──────────┬───────────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
                ▼                                             ▼
┌─────────────────────────────────┐  ┌──────────────────────────────┐
│       Retry #1: 500ms           │  │    Auth User Found           │
│  admin.getUserById(user_id)     │  │    Continue →                │
└────────┬────────────────────────┘  └──────┬───────────────────────┘
         │ FAIL                             │
         ▼                                  ▼
┌─────────────────────────────────┐  ┌──────────────────────────────┐
│       Retry #2: 1000ms          │  │    INSERT INTO users         │
│  Wait 2x longer, try again      │  │    Create profile record     │
└────────┬────────────────────────┘  └──────┬───────────────────────┘
         │ FAIL                             │
         ▼                                  ▼
┌─────────────────────────────────┐  ┌──────────────────────────────┐
│       Retry #3: 2000ms          │  │   Return Success             │
│  Exponential backoff continues  │  │   Profile created ✅         │
└────────┬────────────────────────┘  └──────────────────────────────┘
         │ FAIL
         ▼
┌─────────────────────────────────┐
│       Retry #4: 4000ms          │
│  Still trying...                │
└────────┬────────────────────────┘
         │ FAIL
         ▼
┌─────────────────────────────────┐
│       Retry #5: 8000ms          │
│  Last attempt                   │
└────────┬────────────────────────┘
         │ FAIL
         ▼
┌─────────────────────────────────┐
│   Return 404 Error              │
│   "User not found in auth       │
│    system. Please try again."   │
└─────────────────────────────────┘
```

---

## Database RLS (Row Level Security) Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   User Makes Database Query                      │
│              (via Supabase client in browser)                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RLS Policy Check                               │
│            "Does user have permission?"                          │
└─────────────┬───────────────────────┬───────────────────────────┘
              │ YES                   │ NO
              ▼                       ▼
┌───────────────────────┐  ┌──────────────────────────────────────┐
│  Execute Query        │  │   Block Query                        │
│  Return results       │  │   Return empty / error               │
└───────────────────────┘  └──────────────────────────────────────┘

Example RLS Policies:

Users Table:
┌─────────────────────────────────────────────────────────────────┐
│  Policy: "Users can view users in their university"             │
│                                                                  │
│  SELECT: WHERE university_id IN (                               │
│    SELECT university_id FROM users WHERE id = auth.uid()        │
│  )                                                               │
│                                                                  │
│  ➡️ Students at Harvard can only see other Harvard users       │
│  ➡️ Mentors at MIT can only see other MIT users                │
└─────────────────────────────────────────────────────────────────┘

Messages Table:
┌─────────────────────────────────────────────────────────────────┐
│  Policy: "Users can view their messages"                        │
│                                                                  │
│  SELECT: WHERE sender_id = auth.uid()                           │
│               OR receiver_id = auth.uid()                        │
│                                                                  │
│  ➡️ Users only see messages they sent or received               │
└─────────────────────────────────────────────────────────────────┘

Tasks Table:
┌─────────────────────────────────────────────────────────────────┐
│  Policy: "Students can view own tasks"                          │
│                                                                  │
│  SELECT: WHERE student_id = auth.uid()                          │
│               OR mentor_id = auth.uid()                          │
│                                                                  │
│  ➡️ Students see their tasks, mentors see tasks they manage     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Admin Client Bypass (for Signup)

```
┌─────────────────────────────────────────────────────────────────┐
│              Why bypass RLS during signup?                       │
│                                                                  │
│  Problem: New users don't have a session yet, so RLS blocks     │
│           INSERT INTO users (their own profile creation)         │
│                                                                  │
│  Solution: Use admin client (service_role_key) which bypasses   │
│            RLS and can write to any table                        │
└─────────────────────────────────────────────────────────────────┘

Normal Client (Blocked):
┌─────────────────────────────────────────────────────────────────┐
│  User → supabase.from('users').insert(...)                      │
│         ↓                                                        │
│         RLS Check: "Is auth.uid() = new_user_id?"               │
│         ↓                                                        │
│         ❌ NO (no session yet)                                   │
│         ↓                                                        │
│         Query Blocked                                            │
└─────────────────────────────────────────────────────────────────┘

Admin Client (Allowed):
┌─────────────────────────────────────────────────────────────────┐
│  API → supabaseAdmin.from('users').insert(...)                  │
│        ↓                                                         │
│        RLS Bypassed (service_role_key)                          │
│        ↓                                                         │
│        ✅ Query Allowed                                          │
│        ↓                                                         │
│        Profile Created                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth Pages   │  │ Onboarding   │  │ Dashboard    │          │
│  │ (student/    │→ │ (complete    │→ │ (role-based) │          │
│  │  mentor)     │  │  profile)    │  │              │          │
│  └──────┬───────┘  └──────────────┘  └──────────────┘          │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────┐                       │
│  │   src/lib/auth/authService.ts        │                       │
│  │   • signUpWithEmail()                │                       │
│  │   • signInWithEmail()                │                       │
│  │   • signInWithOAuth()                │                       │
│  │   • createProfile() (with retries)   │                       │
│  └──────────────┬───────────────────────┘                       │
└─────────────────┼───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER (Next.js)                      │
│                                                                  │
│  /api/auth/signup (POST)         /api/auth/profile (PUT)        │
│  • Verify auth user exists       • Update user profile          │
│  • Create profile record          • Validate required fields    │
│  • Uses admin client             • Uses admin client            │
│  • 5 retries with backoff        • University validation        │
│                                                                  │
│  /auth/callback (GET)                                           │
│  • Handle OAuth redirects                                        │
│  • Create profile if needed                                     │
│  • Check completeness                                            │
│  • Redirect appropriately                                        │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                            │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │ Auth       │  │ Database   │  │ Realtime   │               │
│  │ • Email    │  │ • Users    │  │ • Messages │               │
│  │ • Google   │  │ • Messages │  │ • Notifs   │               │
│  │ • GitHub   │  │ • Tasks    │  │            │               │
│  └────────────┘  └────────────┘  └────────────┘               │
│                                                                  │
│  Row Level Security (RLS):                                      │
│  • University isolation                                         │
│  • Role-based permissions                                       │
│  • User-scoped queries                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

This visual representation shows how all the pieces fit together!
