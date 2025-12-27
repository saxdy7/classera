# Classera - Deployment Checklist ✅

## Phase 1 Complete! 🎉

This checklist ensures your Classera platform is ready for production deployment.

---

## ✅ Pre-Deployment Checklist

### 1. Supabase Setup
- [ ] Create Supabase project (free tier)
- [ ] Run `supabase/migrations/001_initial_schema.sql` in SQL Editor
- [ ] Verify 10 tables created successfully
- [ ] Create `avatars` storage bucket:
  ```sql
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true);
  ```
- [ ] Enable RLS policies (should be automatic from migration)
- [ ] Test university data: Check `universities` table has 5 rows

### 2. Environment Configuration
- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] **Never commit `.env.local` to git!**

### 3. Local Testing
- [ ] Run `pnpm install`
- [ ] Run `pnpm dev`
- [ ] Open http://localhost:3000
- [ ] Test sign-up flow with `test@lpu.co.in`
- [ ] Complete student onboarding
- [ ] Verify dashboard loads with stats
- [ ] Test mentor flow separately
- [ ] Check avatar upload works
- [ ] Verify university search works

### 4. Code Quality
- [ ] Run `pnpm lint` - should have 0 errors
- [ ] Run TypeScript check: `pnpm tsc --noEmit`
- [ ] Check all imports are correct
- [ ] Remove console.logs from production code
- [ ] Verify no hardcoded credentials

### 5. Security Audit
- [ ] RLS policies active on all tables
- [ ] `avatars` bucket has proper permissions
- [ ] No API keys in client-side code
- [ ] Auth redirects work correctly
- [ ] Session timeout configured
- [ ] CORS settings reviewed in Supabase

---

## 🚀 Vercel Deployment Steps

### Step 1: Connect Repository
1. Push code to GitHub:
   ```powershell
   git add .
   git commit -m "Phase 1 complete - Ready for deployment"
   git push origin main
   ```

2. Go to https://vercel.com
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Select framework: **Next.js**

### Step 2: Configure Build Settings
```
Framework Preset: Next.js
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install
```

### Step 3: Add Environment Variables
In Vercel dashboard → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Use production Supabase credentials, not development!

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. Click on deployment URL
4. Test production site

---

## 🧪 Post-Deployment Testing

### Test Suite
- [ ] **Homepage loads** - Check animations work
- [ ] **Sign-up works** - Create account with test email
- [ ] **Email validation** - Try non-university email (should fail)
- [ ] **Onboarding completes** - All 3 steps for student
- [ ] **Dashboard loads** - Verify stats display
- [ ] **Avatar upload** - Test image upload to storage
- [ ] **University search** - Search for "Lovely" finds LPU
- [ ] **Logout works** - Sign out and back in
- [ ] **Responsive design** - Test on mobile/tablet
- [ ] **Performance** - Check Lighthouse scores (target: 90+)

### Production URLs to Test
```
https://your-app.vercel.app/
https://your-app.vercel.app/auth/sign-up
https://your-app.vercel.app/auth/sign-in
https://your-app.vercel.app/onboarding/student
https://your-app.vercel.app/dashboard/student
```

---

## 📊 Monitoring Setup

### Vercel Analytics (Free)
1. Go to project dashboard
2. Enable **Analytics** tab
3. Monitor:
   - Page views
   - User sessions
   - Core Web Vitals
   - Error rates

### Supabase Dashboard
Monitor daily:
- Database size (500MB limit)
- Active connections
- Storage usage (1GB limit)
- API requests
- Auth users

---

## 🔒 Security Hardening (Production)

### Supabase Security
1. **Auth Settings** → **URL Configuration**
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`
   - Remove localhost URLs

2. **Database** → **Policies**
   - Verify all RLS policies active
   - Test with different users

3. **Storage** → **Policies**
   - Ensure avatars bucket has proper read/write rules

### Vercel Security Headers
Add to `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ]
}
```

---

## 📈 Performance Optimization

### Image Optimization
- [ ] All images use `next/image` component
- [ ] Gravatar configured in `next.config.ts`
- [ ] Avatar images compressed (max 500KB)

### Code Splitting
- [ ] Dynamic imports for heavy components
- [ ] Lazy loading for non-critical features
- [ ] Route-based code splitting (automatic in Next.js)

### Database Optimization
- [ ] Indexes created (from migration)
- [ ] Query limits set (`.limit()`)
- [ ] Only fetch needed columns (`.select('id, name')`)

---

## 🐛 Common Deployment Issues

### Issue: "Module not found" Error
**Solution:**
```powershell
# Clear cache and rebuild
rm -rf .next
pnpm install
pnpm build
```

### Issue: "Invalid environment variables"
**Solution:**
- Check Vercel dashboard → Settings → Environment Variables
- Ensure no trailing spaces
- Redeploy after adding variables

### Issue: "Supabase connection failed"
**Solution:**
- Verify Supabase project is not paused
- Check URL and key are correct
- Test with curl:
  ```powershell
  curl https://xxxxx.supabase.co/rest/v1/users \
    -H "apikey: your-key" \
    -H "Authorization: Bearer your-key"
  ```

### Issue: "404 on dynamic routes"
**Solution:**
- Ensure `app/` directory structure is correct
- Check file names match route patterns
- Verify no missing `page.tsx` files

---

## 📱 Mobile Responsiveness Check

Test on:
- [ ] iPhone 12/13/14 (390px)
- [ ] iPhone SE (375px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)
- [ ] Desktop (1920px)

### Breakpoints to Verify
```
sm: 640px   - Phone landscape
md: 768px   - Tablet portrait
lg: 1024px  - Tablet landscape / Small laptop
xl: 1280px  - Desktop
2xl: 1536px - Large desktop
```

---

## 🎨 UI/UX Final Polish

- [ ] All fonts load correctly (Geist Sans/Mono)
- [ ] Gradient backgrounds render smoothly
- [ ] Hover states work on all buttons
- [ ] Loading spinners show during async operations
- [ ] Error messages are user-friendly
- [ ] Success toasts for actions
- [ ] Empty states have helpful messages
- [ ] Forms have proper validation

---

## 📋 Documentation Updated

- [ ] README.md has production URL
- [ ] SETUP_GUIDE.md reflects final steps
- [ ] .env.local.example is up-to-date
- [ ] Comments in code are clear
- [ ] API routes documented
- [ ] Database schema documented

---

## 🎯 Phase 1 Success Criteria

### Must Have ✅
- [x] Users can sign up with university email
- [x] Role selection (student/mentor) works
- [x] Onboarding completes successfully
- [x] Dashboard displays real data from Supabase
- [x] University search returns results
- [x] Avatar upload to storage works
- [x] RLS policies enforce university isolation
- [x] Responsive design on all devices

### Phase 1 Complete! 🎉

**You have successfully deployed:**
- Authentication system
- Onboarding flows (student + mentor)
- Interactive dashboards with live data
- Database with 10 tables and RLS
- Beautiful gradient UI
- Full TypeScript support

---

## 🚀 What's Next?

### Phase 2: Test System
Start building the test creation and evaluation system:
1. Read `SETUP_GUIDE.md` Phase 2 section
2. Get Daily.co API key
3. Get Gemini AI API key
4. Begin test creation interface

### Share Your Success!
- Tweet your deployed app
- Add to portfolio
- Share with friends
- Invite beta testers

---

## 📞 Need Help?

**Deployment Issues:**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

**GitHub Issues:**
- Open issue with deployment error
- Include error logs
- Mention environment (Node version, etc.)

---

<div align="center">

**🎉 Congratulations on Completing Phase 1!**

**Your platform is now LIVE and ready for users!**

---

Next: **Phase 2 - Test System** 📝

</div>
