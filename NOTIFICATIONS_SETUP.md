# 🔔 Realtime Notifications System - Setup Complete!

## ✅ What Has Been Created

### 1. Database Schema ✅
**File:** `supabase/migrations/006_notifications_system.sql`

Created:
- ✅ `notifications` table with all fields
- ✅ RLS policies for security
- ✅ Realtime broadcast triggers
- ✅ Helper functions (create, mark as read, delete, etc.)
- ✅ Automatic notification triggers for:
  - New messages
  - Connection accepted
  - (Extensible for more events)

### 2. API Routes ✅
**File:** `src/app/api/notifications/route.ts`

Endpoints:
- ✅ `GET /api/notifications` - Fetch notifications
- ✅ `POST /api/notifications` - Create notification
- ✅ `PATCH /api/notifications` - Mark as read
- ✅ `DELETE /api/notifications` - Delete notification

### 3. Custom Hook ✅
**File:** `src/hooks/useNotifications.ts`

Features:
- ✅ Realtime subscription to notifications
- ✅ Automatic sound playback
- ✅ Mark as read functionality
- ✅ Mark all as read
- ✅ Delete notifications
- ✅ Unread count tracking

### 4. UI Component ✅
**File:** `src/components/shared/NotificationBell.tsx`

Features:
- ✅ Beautiful dropdown with animations
- ✅ Unread badge with count
- ✅ Click to navigate to action URL
- ✅ Mark as read / Mark all as read
- ✅ Delete individual notifications
- ✅ Smooth Framer Motion animations
- ✅ Responsive design

### 5. Header Integration ✅
**File:** `src/components/shared/Header.tsx`

Updated:
- ✅ Added NotificationBell component
- ✅ Added user ID to profile props
- ✅ Removed static notifications link

---

## 🚀 Setup Steps

### Step 1: Run Database Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy content from `supabase/migrations/006_notifications_system.sql`
3. Click **Run**
4. ✅ Verify no errors

### Step 2: Enable Realtime on Notifications Table

1. Go to **Realtime** in Supabase sidebar
2. Find `notifications` table
3. Toggle **ON**
4. Click **Save**

### Step 3: Update Dashboard Pages to Pass User ID

Update both student and mentor dashboard pages to pass user ID to Header:

**File:** `src/app/dashboard/student/page.tsx` and `src/app/dashboard/mentor/page.tsx`

```typescript
// Add id to profile object when passing to Header
<Header profile={{ 
  id: user.id,  // Add this line
  ...profile 
}} />
```

### Step 4: Test Notifications

1. Open your app
2. Send a message to another user
3. Check the notification bell - should show unread count!
4. Click to see the notification dropdown
5. Click notification to navigate to the message

---

## 🎯 Notification Types

The system supports these notification types:

| Type | Icon | Description | Auto-Created |
|------|------|-------------|--------------|
| `message` | 💬 | New message received | ✅ Yes |
| `connection_request` | 🤝 | New connection request | ❌ Manual |
| `connection_accepted` | ✅ | Connection accepted | ✅ Yes |
| `test_assigned` | 📝 | New test assigned | ❌ Manual |
| `test_graded` | 📊 | Test graded | ❌ Manual |
| `community_invite` | 👥 | Community invitation | ❌ Manual |
| `community_accepted` | 🎉 | Community join accepted | ❌ Manual |
| `mention` | @ | Mentioned in message | ❌ Manual |
| `system` | ⚙️ | System notification | ❌ Manual |

---

## 📝 How to Create Custom Notifications

### Method 1: Using API Route

```typescript
await fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-uuid',
    type: 'test_assigned',
    title: 'New Test Assigned',
    message: 'You have been assigned a new test: Advanced JavaScript',
    relatedId: 'test-uuid',
    relatedType: 'test',
    actionUrl: '/dashboard/student/tests/test-uuid',
    metadata: {
      testName: 'Advanced JavaScript',
      dueDate: '2025-01-15',
    },
  }),
});
```

### Method 2: Using Database Function

```sql
SELECT create_notification(
  'user-uuid'::uuid,
  'test_graded',
  'Test Graded',
  'Your test "Advanced JavaScript" has been graded. Score: 85%',
  'test-uuid'::uuid,
  'test',
  '/dashboard/student/tests/test-uuid',
  '{"score": 85, "testName": "Advanced JavaScript"}'::jsonb
);
```

### Method 3: Using Database Trigger

Create a trigger function for automatic notifications:

```sql
CREATE OR REPLACE FUNCTION notify_test_graded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.score IS NOT NULL AND OLD.score IS NULL THEN
    PERFORM create_notification(
      NEW.student_id,
      'test_graded',
      'Test Graded',
      'Your test has been graded. Score: ' || NEW.score || '%',
      NEW.id,
      'test',
      '/dashboard/student/tests/' || NEW.test_id::text,
      jsonb_build_object('score', NEW.score)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_test_graded_trigger
  AFTER UPDATE ON public.test_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_test_graded();
```

---

## 🎨 Customization

### Change Notification Sound

Replace `/public/sounds/notification.mp3` with your own sound file.

Or modify `useNotifications.ts`:

```typescript
function playNotificationSound() {
  const audio = new Audio('/sounds/your-custom-sound.mp3');
  audio.volume = 0.7; // Adjust volume
  audio.play();
}
```

### Change Notification Colors

Edit `NotificationBell.tsx`:

```typescript
// Change badge color
className="bg-red-500" // Change to bg-blue-500, bg-green-500, etc.

// Change icon gradient
className="bg-gradient-to-br from-purple-500 to-fuchsia-500"
// Change to from-blue-500 to-cyan-500, etc.
```

### Add More Notification Types

1. Update the CHECK constraint in migration:
```sql
type TEXT NOT NULL CHECK (type IN (
  'message',
  'your_new_type', -- Add here
  ...
))
```

2. Add icon in `NotificationBell.tsx`:
```typescript
const iconMap = {
  message: '💬',
  your_new_type: '🎯', // Add here
  ...
};
```

---

## 🔧 Troubleshooting

### Notifications Not Appearing

**Check:**
- ✅ Migration ran successfully?
- ✅ Realtime enabled on `notifications` table?
- ✅ User ID passed to Header component?
- ✅ Browser console shows subscription logs?

**Debug:**
```typescript
// Check console for these logs:
🔔 Subscribing to notifications topic: notifications:USER_ID
🔔 Notifications subscription status: SUBSCRIBED
🔔 New notification received: {...}
```

### Unread Count Not Updating

**Check:**
- ✅ `mark_notification_read` function exists?
- ✅ RLS policies allow UPDATE?
- ✅ Realtime broadcasts UPDATE events?

**Test manually:**
```sql
SELECT mark_notification_read('notification-uuid');
```

### Notification Sound Not Playing

**Reasons:**
- Browser blocks autoplay (user interaction required first)
- Sound file doesn't exist
- Volume is muted

**Fix:**
- Add sound file to `/public/sounds/notification.mp3`
- Or remove sound playback from `useNotifications.ts`

---

## 📊 Database Helper Functions

### Get Unread Count

```sql
SELECT get_unread_notifications_count();
```

### Mark All as Read

```sql
SELECT mark_all_notifications_read();
```

### Cleanup Old Notifications

```sql
SELECT cleanup_old_notifications();
```

Run cleanup periodically (e.g., daily cron job):
```sql
-- Delete read notifications older than 30 days
SELECT cleanup_old_notifications();
```

---

## 🎯 Next Steps

### Add More Auto-Notifications

Create triggers for:
- ✅ Test assigned
- ✅ Test graded
- ✅ Community invitation
- ✅ Community join approved
- ✅ Mention in community message

### Add Email Notifications

Integrate with Resend or SendGrid:

```typescript
// In notification trigger
await fetch('/api/send-email', {
  method: 'POST',
  body: JSON.stringify({
    to: userEmail,
    subject: notification.title,
    body: notification.message,
  }),
});
```

### Add Push Notifications

Integrate with Firebase Cloud Messaging or OneSignal for browser push notifications.

---

## 🎉 Success!

Your realtime notification system is now complete! Users will receive instant notifications for:
- ✅ New messages
- ✅ Connection accepted
- ✅ Any custom events you add

**Test it now:**
1. Send a message to another user
2. Watch the notification bell light up! 🔔
3. Click to see the beautiful dropdown
4. Click notification to navigate

---

## 📚 Related Files

- `REALTIME_SETUP_GUIDE.md` - Messaging realtime setup
- `REALTIME_COMPLETE.md` - Realtime completion guide
- `REALTIME_ARCHITECTURE.md` - System architecture

**Happy coding! 🚀**
