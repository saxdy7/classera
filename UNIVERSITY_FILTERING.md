# University-Based Profile Filtering

## Overview
This application implements university-based filtering to ensure users can only see profiles from their own university. This is enforced at the database level using Row Level Security (RLS) policies in Supabase.

## How It Works

### 1. Database-Level Filtering (RLS Policies)
The RLS policies automatically filter all profile queries based on the user's university. When a user queries the `profiles` table, they will only see profiles from users at the same university.

### 2. Applying the RLS Policies

To enable university-based filtering, run the SQL script in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `src/lib/supabase/rls-policies.sql`
4. Execute the SQL script

The script will:
- Drop the existing "view all profiles" policy
- Create a new policy that filters profiles by university
- Maintain existing policies for insert/update operations

### 3. RLS Policy Details

```sql
-- Users can only view profiles from their own university
CREATE POLICY "Users can view profiles from same university"
ON profiles FOR SELECT
USING (
  university = (
    SELECT university 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);
```

This policy:
- Applies to all SELECT queries on the `profiles` table
- Compares the university field of queried profiles with the current user's university
- Automatically filters results without any code changes needed

### 4. Implementation in Code

No code changes are needed in your application queries! The filtering happens automatically at the database level.

Example query (from Find Mentors page):
```typescript
// This query automatically filters by university thanks to RLS
const { data: mentors } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'mentor')
  .order('full_name');
```

The RLS policy ensures that only mentors from the same university as the current user are returned.

### 5. Example Pages

Two example pages demonstrate this functionality:

#### Student: Find Mentors
**Path:** `/dashboard/student/find-mentors`
- Shows only mentors from the student's university
- Displays mentor profiles with expertise and university information
- Includes a "Connect" button for each mentor

#### Mentor: Students
**Path:** `/dashboard/mentor/students`
- Shows only students from the mentor's university
- Displays student profiles with field of study
- Includes a "View Profile" button for each student

### 6. Benefits

✅ **Security:** Filtering happens at the database level, cannot be bypassed
✅ **Automatic:** No need to manually filter in every query
✅ **Performance:** Database-level filtering is efficient
✅ **Consistency:** All queries are automatically filtered the same way

### 7. Testing

To test the university filtering:

1. Create two users with different universities:
   - User A: Harvard University
   - User B: MIT

2. Sign in as User A (Harvard) and navigate to Find Mentors
   - You should only see mentors from Harvard

3. Sign in as User B (MIT) and navigate to Find Mentors
   - You should only see mentors from MIT

4. Users from Harvard will never see profiles from MIT and vice versa

## Important Notes

⚠️ **Remember to run the RLS policy update** in your Supabase database for the filtering to work!

⚠️ Users can still UPDATE their own profile (including changing university), but they can only VIEW profiles from their current university.

⚠️ If a user changes their university, they will immediately start seeing profiles from the new university instead.
