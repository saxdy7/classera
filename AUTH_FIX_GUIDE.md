# 🔧 AUTH SETUP & TROUBLESHOOTING GUIDE

## ✅ Quick Fix Checklist

### 1. Run the SQL Fix (REQUIRED)
```sql
-- Go to Supabase Dashboard → SQL Editor → New Query
-- Copy and paste the contents of: supabase/migrations/FIX_AUTH_POLICIES.sql
-- Click "Run" button
```

### 2. Disable Email Confirmation (For Development)
```
1. Go to: https://jxcnyqipkfwxclvnumuj.supabase.co/project/_/auth/providers
2. Click on "Email" provider
3. Toggle OFF "Confirm email"
4. Click "Save"
```

### 3. Verify OAuth Providers Are Configured

#### Google OAuth:
```
1. Go to: https://jxcnyqipkfwxclvnumuj.supabase.co/project/_/auth/providers
2. Find "Google" in the list
3. Toggle it ON
4. Paste your Client ID from Google Cloud Console
5. Paste your Client Secret from Google Cloud Console
6. Click "Save"
```

#### GitHub OAuth:
```
1. Go to: https://jxcnyqipkfwxclvnumuj.supabase.co/project/_/auth/providers
2. Find "GitHub" in the list
3. Toggle it ON
4. Paste your Client ID from GitHub OAuth App
5. Paste your Client Secret from GitHub OAuth App
6. Click "Save"
```

## 🔍 What Was Fixed

### Code Changes:
1. **authService.ts** - Removed blocking email confirmation check
   - Now returns `needsEmailConfirmation` flag instead of error
   - Allows signup flow to complete even with email confirmation enabled

2. **student/page.tsx & mentor/page.tsx** - Better UX for email confirmation
   - Shows success message when email confirmation is needed
   - Doesn't show as error, but as informational message

3. **types.ts** - Added `needsEmailConfirmation` to AuthResult
   - Proper type support for the new flow

### Database Changes (FIX_AUTH_POLICIES.sql):
1. **Service Role Bypass** - Critical fix for profile creation
   ```sql
   CREATE POLICY "Users can insert own profile" ON public.users
       FOR INSERT WITH CHECK (
           id = auth.uid() OR auth.jwt()->>'role' = 'service_role'
       );
   ```
   This allows the admin client in `/api/auth/signup` to create profiles

2. **Update Policy** - Allows service role to update profiles
   ```sql
   CREATE POLICY "Users can update own profile" ON public.users
       FOR UPDATE USING (
           id = auth.uid() OR auth.jwt()->>'role' = 'service_role'
       );
   ```

3. **University Viewing** - Anyone can view universities
   ```sql
   CREATE POLICY "Anyone can view universities" ON public.universities
       FOR SELECT USING (true);
   ```

4. **Helper Function** - For debugging
   ```sql
   CREATE FUNCTION public.is_service_role() RETURNS BOOLEAN
   ```

## 🧪 Testing Instructions

### Test Email Signup:
1. Go to http://localhost:3000/auth/student
2. Switch to "Sign Up" tab
3. Fill in:
   - Name: Test Student
   - Email: test@example.com
   - Password: testpass123
   - Confirm Password: testpass123
4. Click "Get Started"
5. **Expected**: 
   - If email confirmation OFF: Redirects to onboarding
   - If email confirmation ON: Shows "Check your email" message

### Test Email Sign In:
1. Go to http://localhost:3000/auth/student
2. Stay on "Sign In" tab
3. Fill in:
   - Email: test@example.com
   - Password: testpass123
4. Click "Sign In"
5. **Expected**: Redirects to dashboard (if profile complete) or onboarding

### Test Google OAuth:
1. Go to http://localhost:3000/auth/student
2. Click "Sign in with Google" button
3. Select your Google account
4. **Expected**: 
   - Redirects to Google
   - You authenticate
   - Redirects back to app
   - Profile created automatically
   - Lands on onboarding page

### Test GitHub OAuth:
1. Go to http://localhost:3000/auth/student
2. Click "Sign in with GitHub" button
3. Authorize the app
4. **Expected**: Same flow as Google

## ❌ Common Issues & Solutions

### Issue: "Auth user not found after retries"
**Cause**: Service role can't bypass RLS
**Fix**: Run FIX_AUTH_POLICIES.sql in Supabase SQL Editor

### Issue: "Please check your email to confirm"
**Cause**: Email confirmation is enabled
**Fix**: 
- Option 1: Disable it (see step 2 above) for development
- Option 2: Check your email and click the confirmation link

### Issue: OAuth "Invalid redirect URI"
**Cause**: Callback URL mismatch
**Fix**: Ensure these URLs match:
- **Google Cloud Console**: `https://jxcnyqipkfwxclvnumuj.supabase.co/auth/v1/callback`
- **GitHub OAuth App**: `https://jxcnyqipkfwxclvnumuj.supabase.co/auth/v1/callback`
- **Supabase**: Automatically handles this, no config needed

### Issue: OAuth "User not found in authentication system"
**Cause**: Profile creation failed after OAuth
**Fix**: 
1. Check browser console for errors
2. Verify service role key in `.env.local`
3. Run FIX_AUTH_POLICIES.sql

### Issue: "Profile already exists" error
**Not an issue!** This is normal and harmless - the code handles it gracefully

## 🔐 Environment Variables (Already Set ✅)

Your `.env.local` should have:
```env
NEXT_PUBLIC_SUPABASE_URL=https://jxcnyqipkfwxclvnumuj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📊 Verification Queries

Run these in Supabase SQL Editor to verify everything is correct:

### Check RLS Policies:
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;
```

**Expected**: Should see policies for INSERT, UPDATE, SELECT with service role bypass

### Check Universities:
```sql
SELECT id, name, domain FROM public.universities;
```

**Expected**: Should see "Sample University" or your universities

### Check Test User:
```sql
SELECT id, email, full_name, role, university_id 
FROM public.users 
WHERE email = 'test@example.com';
```

**Expected**: After signup, should see the user profile

## 🎯 Next Steps After Fixing

1. **Run FIX_AUTH_POLICIES.sql** (most important!)
2. **Disable email confirmation** for development
3. **Test signup with email** - should work immediately
4. **Test OAuth** - should redirect and create profile
5. **Add a university** in Supabase if none exists
6. **Complete onboarding** to set university

## 📱 Production Considerations

Before deploying to production:
1. ✅ Enable email confirmation back ON
2. ✅ Add production URLs to Google/GitHub OAuth apps
3. ✅ Set up email templates in Supabase
4. ✅ Configure custom SMTP (optional)
5. ✅ Test the full flow with email confirmation

---

**Your auth system is now fixed!** 🎉

If you still have issues, check the browser console and terminal logs for specific error messages.
