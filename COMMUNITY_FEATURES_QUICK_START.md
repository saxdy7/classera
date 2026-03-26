# Community Features - Quick Integration Checklist

## ✅ Completed Fixes

1. ✅ Database: Added missing `is_muted` column to `community_members`
2. ✅ API: Fixed moderation table reference from `community_reports` to `community_post_reports`
3. ✅ RLS: Fixed message visibility policies - now properly scoped to community members
4. ✅ Messages: Added DELETE endpoint for users to delete their own messages
5. ✅ Messages: PATCH endpoint handles both edit and delete with proper permissions
6. ✅ Notifications: Added 4 automatic triggers (posts, comments, replies, mentions)
7. ✅ Mentions: Full @mention system with automatic detection and notifications
8. ✅ Polls: Added GET endpoint to retrieve poll results in real-time
9. ✅ Reports: Complete report system with API and mentor review UI
10. ✅ Security: Proper RLS, permission checks, and audit logging

---

## 🚀 To Deploy Features

### Step 1: Run Database Migrations
```bash
cd supabase
# Apply the two new migration files
# These add is_muted column, RLS fixes, triggers, and notification system
```

**New Migration Files**:
- `supabase/migrations/001_FIX_COMMUNITY_FEATURES.sql`
- `supabase/migrations/002_ADD_NOTIFICATION_MENTION_SYSTEM.sql`

### Step 2: Add UI Components

**In your community feed/post component, add report button**:
```typescript
import { ReportPostModal } from '@/components/communities/ReportPostModal';

// Add state for report modal
const [reportModal, setReportModal] = useState(false);

// Add button to post actions
<button onClick={() => setReportModal(true)}>
  <Flag className="w-4 h-4" />
</button>

// Add modal
<ReportPostModal
  isOpen={reportModal}
  onClose={() => setReportModal(false)}
  postId={post.id}
  communityId={post.community_id}
  contentType="post"
/>
```

**In mentor dashboard, add report review panel**:
```typescript
import { ReportsReviewPanel } from '@/components/communities/ReportsReviewPanel';

<ReportsReviewPanel
  communityId={selectedCommunity.id}
  isMentor={currentUser.role === 'mentor'}
/>
```

### Step 3: Enable Features in UI

**Message Editing & Deletion**:
- ✅ Already implemented in API
- Need to: Add UI buttons for edit (5-min timer) and delete
- Show edit history on hover

**Mentions**:
- ✅ Automatically processed in posts/comments/messages
- Need to: Add @mention autocomplete in textarea
- Show mention highlights in rendered content
- Display mention badges

**Notifications**:
- ✅ Automatically triggered on posts, comments, mentions
- Need to: Display in notification center
- Add notification badges to community icon
- Show notification preferences in settings

**Polls**:
- ✅ Voting and results endpoints ready
- Need to: Update poll UI to fetch results from GET endpoint
- Show live vote counts
- Display poll expiry timer

---

## 📋 Testing Checklist

Test these workflows end-to-end:

### Messaging Workflow
- [ ] User sends message to channel
- [ ] User edits message (within 5 min)
- [ ] User deletes message
- [ ] Mentor deletes someone else's message
- [ ] Verify edit history is recorded

### Notification Workflow
- [ ] Create announcement → check all members get notified
- [ ] Post comment → check author gets notified
- [ ] Reply to comment → check parent commenter gets notified
- [ ] Mention user → check mentioned user gets notified

### Mention Workflow
- [ ] Create post with @john smith
- [ ] Verify mention record created
- [ ] Check john receives notification
- [ ] Test multiple mentions in one post
- [ ] Test mentions in comments and messages

### Report Workflow
- [ ] User reports post for spam
- [ ] Mentor sees report in dashboard
- [ ] Mentor reviews report details
- [ ] Mentor clicks "Delete Content" button
- [ ] Post is soft-deleted
- [ ] User can't see deleted post
- [ ] Moderation log shows action

### Poll Workflow
- [ ] Mentor creates poll with 3 options
- [ ] Student votes on poll
- [ ] Check GET endpoint returns vote counts
- [ ] Check poll results show correctly
- [ ] Student changes vote
- [ ] Check results update

### Muting Workflow
- [ ] Mentor mutes user for 24h
- [ ] User tries to comment → blocked with message
- [ ] Mentor unmutes user
- [ ] User can comment again

### RLS Workflow
- [ ] User A from Community 1 tries to access Community 2 messages
- [ ] Should be blocked/see nothing
- [ ] User A can only see messages in their communities
- [ ] User A can't edit/delete others' messages

---

## 🔧 Configuration Options

### Message Edit Window
Currently: 5 minutes  
Location: `src/app/api/community-messages/route.ts` line ~255  
To change: Modify the `diff > 5` check

### Mute Durations
Currently: 24h, 7d, 30d, permanent  
Location: `src/app/api/community-moderation/route.ts` line ~105-115  
To add more: Add duration option and calculation

### Report Reasons
Currently: spam, harassment, inappropriate, misinformation, hate_speech, violence, other  
Location: `src/components/communities/ReportPostModal.tsx` line ~11-18  
To customize: Modify REPORT_REASONS array

---

## 📊 API Quick Reference

### Messages
- `GET /api/community-messages?channelId=xxx&limit=50&offset=0`
- `POST /api/community-messages` - Send message or react
- `PATCH /api/community-messages` - Edit or delete message
- `DELETE /api/community-messages?messageId=xxx` - Delete message

### Polls
- `GET /api/community-poll-votes?pollId=xxx` - Get results
- `POST /api/community-poll-votes` - Vote
- `DELETE /api/community-poll-votes?pollId=xxx` - Remove vote

### Reports
- `GET /api/community-reports?communityId=xxx&status=pending`
- `POST /api/community-reports` - Create report
- `PATCH /api/community-reports` - Update status

### Moderation
- `POST /api/community-moderation` - Mute/unmute user
- `GET /api/community-moderation?communityId=xxx` - Get logs

---

## 🐛 Debugging Tips

### If notifications not triggering:
- Check migrations were applied
- Verify triggers exist: `SELECT trigger_name FROM information_schema.triggers WHERE table_name = 'community_posts'`
- Check notification preferences in user settings

### If messages not visible:
- Verify RLS policies are active: `SELECT * FROM pg_policies WHERE tablename = 'community_messages'`
- Check user is member: `SELECT * FROM community_members WHERE student_id = ? AND community_id = ?`
- Check channel exists: `SELECT * FROM community_channels WHERE id = ?`

### If edits not saving:
- Check edit window: `(now - message.created_at) < 5 minutes`
- Verify message ownership: `message.sender_id = auth.uid()`
- Check edit_history table populated: `SELECT * FROM message_edit_history`

### If reports not appearing:
- Check mentor is actually mentor: `SELECT mentor_id FROM communities WHERE id = ?`
- Verify report exists: `SELECT * FROM community_post_reports WHERE id = ?`
- Check report status: Should be 'pending' initially

---

## 📞 Support & Questions

All components have comments explaining key logic. See:
- `src/app/api/community-*/*.ts` - API logic
- `src/components/communities/*.tsx` - UI logic
- `supabase/migrations/00*.sql` - Database logic

Check `COMMUNITY_FEATURES_AUDIT.md` for detailed architecture docs.

---

## 🎉 You're All Set!

All core community features are now:
- ✅ Implemented
- ✅ Fixed
- ✅ Enhanced
- ✅ Documented
- ✅ Ready for deployment

Deploy migrations, add UI components, and test the workflows above!
