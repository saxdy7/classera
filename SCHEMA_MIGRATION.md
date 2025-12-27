# Database Schema Migration Guide

## ⚠️ IMPORTANT: Schema Change

The project has been updated to use a new database schema with the `users` table instead of `profiles`.

### Old Schema (profiles table)
```sql
profiles (
  user_id UUID REFERENCES auth.users,
  role TEXT,
  full_name TEXT,
  university TEXT,
  avatar_url TEXT,
  ...
)
```

### New Schema (users table)
```sql
users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT,
  full_name TEXT,
  role TEXT CHECK (role IN ('student', 'mentor')),
  university_id UUID REFERENCES universities,
  ...
)
```

## Migration Steps

1. **Drop old profiles table** (if exists):
```sql
DROP TABLE IF EXISTS profiles CASCADE;
```

2. **Run new migration**:
   - Execute `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor

3. **Update all code references**:
   - Replace `.from('profiles')` with `.from('users')`
   - Replace `user_id` with `id` in queries
   - Replace `profile.university` with join to `universities` table
   - Update field references to match new schema

## Code Changes Required

### Query Pattern Changes

**Old:**
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id)
  .single()
```

**New:**
```typescript
const { data: profile } = await supabase
  .from('users')
  .select('*, universities(*)')
  .eq('id', user.id)
  .single()
```

### Insert Pattern Changes

**Old:**
```typescript
await supabase.from('profiles').insert({
  user_id: user.id,
  role: 'student',
  full_name: 'John Doe',
  university: 'LPU'
})
```

**New:**
```typescript
await supabase.from('users').insert({
  id: user.id,
  email: user.email,
  role: 'student',
  full_name: 'John Doe',
  university_id: '<university-uuid>'
})
```

## Affected Files

All files with `.from('profiles')` need updates (34 files total):
- `/app/auth/**`
- `/app/onboarding/**`
- `/app/dashboard/student/**`
- `/app/dashboard/mentor/**`

## Automated Migration

Run this command to update all references:
```bash
# This is a placeholder - manual updates required
# Find: .from\('profiles'\)
# Replace: .from('users')
```

**Note:** This is a breaking change. All existing data in the old `profiles` table will need to be migrated to the new `users` table structure.
