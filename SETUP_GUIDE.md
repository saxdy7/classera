# 🚀 Quick Start Guide - Community Feed System

## Step 1: Apply Database Migration

### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/025_community_posts_system.sql`
5. Paste and click **Run**

### Option B: Using Supabase CLI
```bash
# Make sure you're in the project directory
cd d:/classera_workspace/classera

# Push migrations to Supabase
npx supabase db push
```

## Step 2: Verify Installation

### Check Tables Were Created
Run this query in SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'community_%';
```

You should see:
- community_posts
- community_comments
- community_post_likes
- community_comment_likes
- community_saved_posts
- community_post_reports
- community_post_views

### Check Triggers and Functions
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%post%';
```

You should see:
- update_post_likes_count
- update_post_comments_count
- update_comment_likes_count
- notify_post_comment
- notify_post_like
- get_post_details

## Step 3: Test the System

### 1. Navigate to Communities
- Go to `/dashboard/student/communities` or `/dashboard/mentor/communities`
- Join or create a community

### 2. Access Community Feed
- Click on a community
- You should see the **Feed** tab as the default view
- The feed should display three columns:
  - Left: Filters sidebar
  - Center: Main feed
  - Right: Online members and stats

### 3. Create Your First Post
- Click the "What's on your mind?" button
- Select post type:
  - **Normal** - For general posts
  - **Question** - For asking help
  - **Announcement** - Mentors only
- Add title (optional for normal posts)
- Add content
- Click "Create Post"

### 4. Test Interactions
- ❤️ **Like** a post
- 💬 **Add a comment**
- 🔖 **Save** a post
- 📌 **Pin** a post (mentors only)
- 🔒 **Lock comments** (mentors only)

### 5. Verify Real-Time Updates
- Open the same community in two different browsers
- Create a post in one browser
- It should appear instantly in the other browser

## Step 4: Configure (Optional)

### Enable Real-Time Subscriptions
Supabase real-time should be enabled by default. To verify:
1. Go to **Database > Replication**
2. Ensure `community_posts` table is enabled for real-time
3. Ensure `community_comments` table is enabled for real-time

### Customize Notification Settings
Edit notification templates in:
- `supabase/migrations/025_community_posts_system.sql`
- Search for `notify_post_comment` and `notify_post_like` functions
- Modify the notification messages as needed

## Common Issues & Solutions

### Issue: "Unauthorized" errors
**Solution**: 
- Check RLS policies are enabled
- Ensure user is logged in
- Verify user is a community member

### Issue: Posts not appearing
**Solution**:
- Check `is_deleted` flag is false
- Verify community_id is correct
- Check user has membership with status='approved'

### Issue: Cannot create announcement
**Solution**:
- Only mentors can create announcements
- Verify user role is 'mentor'
- Check user is the community mentor_id

### Issue: Real-time not working
**Solution**:
- Enable real-time in Supabase dashboard
- Check browser console for subscription errors
- Verify SUPABASE_URL and SUPABASE_ANON_KEY are set correctly

### Issue: Like/comment counts not updating
**Solution**:
- Triggers should handle this automatically
- Check if triggers were created successfully
- Run `SELECT * FROM pg_trigger WHERE tgname LIKE '%post%';`

## Performance Tips

### For Large Communities (1000+ members):
1. Enable pagination (implement in future)
2. Use query caching
3. Consider Redis for real-time presence
4. Optimize images with CDN

### Database Optimization:
```sql
-- Check index usage
SELECT * FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
AND relname LIKE 'community_%';

-- Analyze query performance
EXPLAIN ANALYZE 
SELECT * FROM community_posts 
WHERE community_id = 'YOUR_COMMUNITY_ID' 
AND is_deleted = false;
```

## Testing Checklist

- [ ] Migration applied successfully
- [ ] All tables created
- [ ] RLS policies working
- [ ] Can create normal post
- [ ] Can create question post
- [ ] Can create announcement (mentor)
- [ ] Can like posts
- [ ] Can comment on posts
- [ ] Can save posts
- [ ] Can pin posts (mentor)
- [ ] Can lock posts (mentor)
- [ ] Can delete posts (author/mentor)
- [ ] Real-time updates working
- [ ] Notifications sent
- [ ] Online members showing
- [ ] Top contributors displaying
- [ ] Filters working
- [ ] Mobile responsive
- [ ] Error handling works

## Support & Resources

### Documentation:
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Community:
- [Supabase Discord](https://discord.supabase.com)
- [Next.js Discord](https://nextjs.org/discord)

## What's Next?

After successful setup, you can:

1. **Customize the UI**:
   - Edit components in `src/components/communities/`
   - Modify styles in respective component files
   - Add your branding colors

2. **Add Features**:
   - Image upload for posts
   - Hashtag system
   - Advanced search
   - Mention system (@username)

3. **Integrate AI**:
   - Auto-summarize long posts
   - Smart question answering
   - Content moderation
   - Sentiment analysis

4. **Analytics**:
   - Track engagement metrics
   - Generate community reports
   - Leaderboards with points
   - Weekly digest emails

## Need Help?

If you encounter any issues:

1. Check the browser console for errors
2. Check Supabase logs for database errors
3. Verify all environment variables are set
4. Review the RLS policies
5. Check the migration was applied completely

---

**You're all set! Enjoy your new community feed system! 🎉**
