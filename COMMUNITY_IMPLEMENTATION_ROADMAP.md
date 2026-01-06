# Community System - Complete Implementation Guide

## ✅ COMPLETED FEATURES

### 1. Poll System
**Status:** ✅ API Routes Created, Components Built
- [x] Poll API: `/api/community-polls`
- [x] Vote API: `/api/community-poll-votes`
- [x] PollComponent.tsx - Display and voting UI
- [x] CreatePollModal.tsx - Create polls interface

**Integration Needed:**
- Add poll creation option to CreatePostModal
- Integrate Poll Component in community feed posts

---

### 2. Media Upload System  
**Status:** ✅ API & Component Ready
- [x] Upload API: `/api/upload`
- [x] FileUpload.tsx component exists
- [x] Supports images (max 4) and files (max 3)
- [x] Supabase Storage integration

**Integration Needed:**
- Add FileUpload to CreatePostModal
- Update community_posts API to save images/files
- Display media in post cards

---

## 🔨 REMAINING FEATURES TO IMPLEMENT

### 3. Moderation Dashboard
**Required:**
- [ ] Create `/dashboard/mentor/communities/[id]/moderation` page
- [ ] Reports review interface
- [ ] Bulk actions (approve/reject multiple reports)
- [ ] Moderation logs viewer
- [ ] User mute/unmute interface
- [ ] Content filtering tools

**API Routes Needed:**
```
GET  /api/community-reports - Fetch all reports
POST /api/community-reports - Update report status
GET  /api/community-moderation-logs - View moderation history
```

---

### 4. Post Editing
**Required:**
- [ ] Edit button on own posts (3-hour time limit)
- [ ] Edit modal component
- [ ] Update post API endpoint
- [ ] Edit history tracking (optional)
- [ ] Show "edited" indicator on posts

**API Changes:**
```typescript
// Update /api/community-posts route.ts
PATCH /api/community-posts
{
  postId, 
  title, 
  content,
  // Only allow if author and within 3 hours
}
```

---

### 5. Search & Filter
**Required:**
- [ ] Search bar in community feed
- [ ] Filter by post type (Normal/Question/Announcement)
- [ ] Filter by tags
- [ ] Sort options (Recent, Popular, Unanswered)
- [ ] Search API endpoint

**Implementation:**
```typescript
GET /api/community-posts?communityId=X&search=query&type=question&sort=popular
```

---

### 6. Rich Text Editor
**Required:**
- [ ] Install rich text library (e.g., Tiptap, Lexical)
- [ ] Replace textarea in CreatePostModal
- [ ] Support bold, italic, lists, links
- [ ] Code blocks for technical discussions
- [ ] Mention users (@username)
- [ ] Markdown support

**Recommended Library:**
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention
```

---

### 7. Analytics Dashboard
**Required for Mentors:**
- [ ] Community stats overview
- [ ] Engagement metrics (posts, comments, likes per day)
- [ ] Most active members leaderboard
- [ ] Post performance analytics
- [ ] Member growth chart
- [ ] Export data feature

**New Page:**
```
/dashboard/mentor/communities/[id]/analytics
```

**API Routes:**
```typescript
GET /api/community-analytics?communityId=X&period=week
// Returns: { posts, comments, likes, views, activeMembers, topContributors }
```

---

### 8. Enhanced Notifications
**Current:** Basic like/comment notifications exist

**Add:**
- [ ] @mention notifications
- [ ] Reply to comment notifications
- [ ] New announcement notifications
- [ ] Best answer marked notification
- [ ] Poll expiring soon notification
- [ ] Daily/weekly digest emails

**Update:**
```sql
-- Add new notification types to migrations
'mention', 'reply', 'announcement', 'best_answer', 'poll_expiring'
```

---

## 📋 INTEGRATION TASKS

### Integrate Polls into Feed
**File:** `src/components/communities/CommunityFeed.tsx`

```tsx
// In post card rendering
{post.type === 'poll' && post.poll_id && (
  <PollComponent poll={post.poll} onVote={fetchPosts} />
)}
```

### Integrate Media into Posts
**Files to Update:**
1. `CreatePostModal.tsx` - Add FileUpload component
2. `/api/community-posts` - Save images/files arrays
3. `CommunityFeed.tsx` - Display media in posts

```tsx
// In CreatePostModal
<FileUpload onFilesChange={(images, files) => {
  setImages(images);
  setFiles(files);
}} />

// In CommunityFeed post card
{post.images && post.images.length > 0 && (
  <div className="grid grid-cols-2 gap-2">
    {post.images.map(img => <img src={img} />)}
  </div>
)}
```

---

## 🎯 PRIORITY IMPLEMENTATION ORDER

1. **HIGH PRIORITY** (Core UX):
   - Media upload integration (posts with images/files)
   - Post editing (users expect this)
   - Search functionality (navigation)

2. **MEDIUM PRIORITY** (Mentor Tools):
   - Moderation dashboard
   - Analytics dashboard
   - Rich text editor

3. **LOW PRIORITY** (Nice to Have):
   - Poll integration (already built, just needs wiring)
   - Enhanced notifications
   - Advanced filtering/tags

---

## 🚀 QUICK WIN: Media Upload Integration

**Step-by-step:**

1. **Update CreatePostModal.tsx:**
```tsx
import { FileUpload } from './FileUpload';

// Add state
const [images, setImages] = useState<string[]>([]);
const [files, setFiles] = useState<any[]>([]);

// Add to form
<FileUpload onFilesChange={(imgs, fls) => {
  setImages(imgs);
  setFiles(fls);
}} />

// Update submit
await supabase.from('community_posts').insert({
  // ...existing fields,
  images: images,
  files: files
});
```

2. **Update CommunityFeed.tsx to display:**
```tsx
{post.images?.length > 0 && (
  <div className="grid grid-cols-2 gap-2 mt-3">
    {post.images.map((img, i) => (
      <img key={i} src={img} className="rounded-xl" />
    ))}
  </div>
)}
```

3. **Test:** Create post with images, verify display.

---

## 📦 NPM PACKAGES NEEDED

```bash
# Rich Text Editor
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention

# Charts for Analytics
npm install recharts

# Image optimization (optional)
npm install sharp
```

---

## 🔐 SECURITY CHECKLIST

- [ ] Storage buckets created in Supabase
  - `community-images` (public)
  - `community-files` (public)
- [ ] RLS policies for uploads (user can only delete own files)
- [ ] File size limits enforced (10MB)
- [ ] File type validation
- [ ] Rate limiting on uploads
- [ ] Content moderation for images (optional: AI scanning)

---

## 🎨 UI COMPONENTS COMPLETED

✅ PollComponent  
✅ CreatePollModal  
✅ FileUpload  
✅ CommunityFeed  
✅ CreatePostModal  
✅ CommunitySidebar  
✅ CommunityRightSidebar  

**Still Needed:**
- ModerationDashboard
- AnalyticsDashboard  
- RichTextEditor wrapper
- SearchBar component
- EditPostModal

---

## 📝 DOCUMENTATION STATUS

- [x] Setup Guide created
- [x] UI Preview created
- [x] Implementation docs created
- [ ] API documentation needed
- [ ] Component usage examples needed
- [ ] Deployment checklist needed

---

## ⚡ NEXT IMMEDIATE ACTIONS

1. Integrate FileUpload into CreatePostModal
2. Display media in feed posts
3. Add "Create Poll" option to post modal
4. Implement search bar in feed
5. Add edit button to posts (with time check)

---

**Ready for Production Checklist:**
- [ ] All features implemented
- [ ] Tests written
- [ ] Performance optimized
- [ ] SEO configured
- [ ] Analytics integrated
- [ ] Error tracking (Sentry)
- [ ] Documentation complete
