# 🔔 Notifications Setup - Quick Guide

## ❌ Current Issue
Notifications are not showing when messages are sent between student and mentor.

## ✅ Solution - Follow These Steps

### **Step 1: Run Database Migration** (REQUIRED)

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the **ENTIRE content** from this file:
   ```
   d:\classera\supabase\migrations\006_notifications_system.sql
   ```
3. Paste into SQL Editor
4. Click **Run**
5. ✅ Verify: Should see "Success. No rows returned"

---

### **Step 2: Enable Realtime on Notifications Table** (REQUIRED)

1. Go to **Supabase Dashboard** → **Realtime** (in sidebar)
2. Find `notifications` table in the list
3. Toggle the switch to **ON**
4. Click **Save**
5. ✅ Verify: Green checkmark appears next to notifications

---

### **Step 3: Update Dashboard Pages** (REQUIRED)

You need to pass the user ID to the Header component.

#### **File 1:** `src/app/dashboard/student/page.tsx`

Find this line (around line 88):
```typescript
<Header profile={profile} />
```

Replace with:
```typescript
<Header profile={{ id: user.id, ...profile }} />
```

#### **File 2:** `src/app/dashboard/mentor/page.tsx`

Find this line (around line 88):
```typescript
<Header profile={profile} />
```

Replace with:
```typescript
<Header profile={{ id: user.id, ...profile }} />
```

#### **File 3:** `src/app/dashboard/student/messages/page.tsx`

Find this line (around line 42):
```typescript
<Header profile={profile} />
```

Replace with:
```typescript
<Header profile={{ id: user.id, ...profile }} />
```

#### **File 4:** `src/app/dashboard/mentor/messages/page.tsx`

Find this line (around line 42):
```typescript
<Header profile={profile} />
```

Replace with:
```typescript
<Header profile={{ id: user.id, ...profile }} />
```

---

### **Step 4: Test Notifications**

1. **Open two browser windows:**
   - Window 1: Login as Student
   - Window 2: Login as Mentor (use incognito mode)

2. **Send a message:**
   - From Student → Send message to Mentor
   - Check Mentor's notification bell → Should show "1" badge
   - Click bell → Should see notification: "New Message - [Student Name] sent you a message"

3. **Click notification:**
   - Should navigate to messages page
   - Notification should be marked as read
   - Badge count should decrease

---

## 🎯 How It Works

### **When Student Sends Message:**

1. **Message Created** → Database INSERT into `messages` table
2. **Trigger Fires** → `notify_new_message()` function runs automatically
3. **Notification Created** → INSERT into `notifications` table
4. **Realtime Broadcast** → Sends to topic `notifications:MENTOR_ID`
5. **Mentor's Browser** → Receives broadcast via `useNotifications` hook
6. **Bell Updates** → Badge shows unread count
7. **Sound Plays** → notification.mp3 (if available)

---

## 🔍 Troubleshooting

### **Issue: No notification appears**

**Check:**
- [ ] Migration ran successfully?
- [ ] Realtime enabled on `notifications` table?
- [ ] User ID passed to Header component?
- [ ] Browser console shows errors?

**Debug:**
```typescript
// Add this to check if notification was created
// In Supabase SQL Editor:
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
```

### **Issue: Notification created but not showing in real-time**

**Check:**
- [ ] Realtime enabled on `notifications` table?
- [ ] Browser console shows subscription logs?
- [ ] Network tab shows WebSocket connection?

**Debug:**
```typescript
// Check browser console for:
🔔 Subscribing to notifications topic: notifications:USER_ID
🔔 Notifications subscription status: SUBSCRIBED
🔔 New notification received: {...}
```

### **Issue: Badge not updating**

**Check:**
- [ ] `useNotifications` hook is being called?
- [ ] `userId` prop is passed correctly?
- [ ] `isMounted` state is true?

---

## 📝 Quick Verification Script

Run this in **Supabase SQL Editor** to verify setup:

```sql
-- 1. Check if notifications table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'notifications'
);
-- Should return: true

-- 2. Check if trigger exists
SELECT EXISTS (
  SELECT FROM pg_trigger 
  WHERE tgname = 'notify_new_message_trigger'
);
-- Should return: true

-- 3. Check if function exists
SELECT EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'notify_new_message'
);
-- Should return: true

-- 4. Test notification creation manually
SELECT create_notification(
  'USER_ID_HERE'::uuid,
  'message',
  'Test Notification',
  'This is a test message',
  null,
  null,
  '/dashboard/student/messages',
  '{}'::jsonb
);
-- Should return: notification UUID
```

---

## 🎉 Expected Result

After completing all steps:

1. **Student sends message to Mentor**
2. **Mentor sees:**
   - 🔔 Red badge with "1" on notification bell
   - Click bell → Dropdown opens
   - Notification shows: "💬 New Message - [Student Name] sent you a message"
   - Click notification → Navigate to messages
   - Notification marked as read
   - Badge count decreases

3. **Mentor sends message to Student**
   - Same process in reverse
   - Student gets notification

---

## 📋 Checklist

- [ ] Step 1: Run migration SQL
- [ ] Step 2: Enable Realtime on notifications table
- [ ] Step 3: Update all 4 dashboard pages with user ID
- [ ] Step 4: Test with two browser windows
- [ ] ✅ Notifications working!

---

**Once you complete these steps, notifications will work perfectly! Let me know if you encounter any issues.** 🚀
