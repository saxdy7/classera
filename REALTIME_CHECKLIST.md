# ✅ Realtime Setup Checklist

Use this checklist to implement the realtime features step by step.

---

## 📋 Phase 1: Database Setup

### Step 1.1: Run Migration
- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Create new query
- [ ] Copy content from `supabase/migrations/004_realtime_enhancements.sql`
- [ ] Click **Run**
- [ ] Verify no errors in output

### Step 1.2: Verify Tables Created
- [ ] Go to Table Editor
- [ ] Confirm `user_presence` table exists
- [ ] Confirm `typing_indicators` table exists
- [ ] Check that both tables have RLS enabled

### Step 1.3: Enable Realtime
- [ ] Go to Database → Replication
- [ ] Find `messages` table
- [ ] Toggle Realtime to **ON**
- [ ] Click Save
- [ ] Verify green checkmark appears

---

## 📋 Phase 2: Code Integration

### Step 2.1: Update ChatInterface Component
File: `src/components/shared/ChatInterface.tsx`

- [ ] Add imports for new hooks (lines 3-5)
  ```typescript
  import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
  import { useTypingIndicator } from '@/hooks/useTypingIndicator';
  import { usePresence } from '@/hooks/usePresence';
  ```

- [ ] Replace state with hooks (around line 40-44)
  ```typescript
  const { messages, loading: messagesLoading } = useRealtimeMessages(currentUserId, otherUser.id);
  const { isOtherUserTyping, handleTyping } = useTypingIndicator(currentUserId, otherUser.id);
  const { isOnline, lastSeen } = usePresence(otherUser.id);
  ```

- [ ] Remove old fetchMessages function (lines 55-79)
- [ ] Remove old useEffect with subscriptions (lines 82-122)
- [ ] Update input onChange to call handleTyping() (line 238)
  ```typescript
  onChange={(e) => {
    setNewMessage(e.target.value);
    handleTyping();
  }}
  ```

- [ ] Add typing indicator UI (before messagesEndRef, around line 227)
  ```typescript
  {isOtherUserTyping && (
    <div className="flex justify-start mb-4">
      <div className="bg-slate-200 rounded-2xl px-4 py-2 rounded-bl-none">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  )}
  ```

- [ ] Update header to show online status (around line 178-181)
  ```typescript
  <div className="flex-1">
    <h3 className="font-semibold text-slate-900">{otherUser.full_name}</h3>
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></div>
      <p className="text-sm text-slate-500 capitalize">
        {isOnline ? 'Online' : otherUser.role}
      </p>
    </div>
  </div>
  ```

### Step 2.2: Wrap Messages Pages
File: `src/app/dashboard/student/messages/page.tsx`

- [ ] Add import at top
  ```typescript
  import { PresenceProvider } from '@/components/providers/PresenceProvider';
  ```

- [ ] Wrap return statement
  ```typescript
  return (
    <PresenceProvider userId={user.id}>
      {/* existing code */}
    </PresenceProvider>
  );
  ```

File: `src/app/dashboard/mentor/messages/page.tsx`

- [ ] Add import at top
- [ ] Wrap return statement (same as above)

### Step 2.3: Optimize Polling (Optional)
File: `src/components/shared/MessagesClient.tsx`

- [ ] Update polling interval (line 99)
  ```typescript
  // Change from 5000 to 30000
  const interval = setInterval(fetchConversations, 30000);
  ```

---

## 📋 Phase 3: Testing

### Test 3.1: Realtime Messages
- [ ] Open browser window 1 (Student account)
- [ ] Open browser window 2 (Mentor account) - use incognito
- [ ] Start conversation from window 1
- [ ] Send message from window 1
- [ ] **Expected:** Message appears instantly in window 2
- [ ] Send message from window 2
- [ ] **Expected:** Message appears instantly in window 1
- [ ] **Result:** ✅ PASS / ❌ FAIL

### Test 3.2: Typing Indicators
- [ ] Keep both windows open
- [ ] Start typing in window 1 (don't send)
- [ ] **Expected:** "..." animation appears in window 2
- [ ] Stop typing for 3 seconds
- [ ] **Expected:** "..." animation disappears in window 2
- [ ] **Result:** ✅ PASS / ❌ FAIL

### Test 3.3: Presence Tracking
- [ ] Keep both windows open
- [ ] Check online status in window 1
- [ ] **Expected:** Green dot next to user in window 2
- [ ] Close window 2
- [ ] Wait 5 seconds
- [ ] **Expected:** Gray dot appears in window 1
- [ ] Reopen window 2
- [ ] **Expected:** Green dot reappears in window 1
- [ ] **Result:** ✅ PASS / ❌ FAIL

### Test 3.4: Performance
- [ ] Open browser DevTools → Network tab
- [ ] Send 5 messages
- [ ] Count API calls in 1 minute
- [ ] **Expected:** < 5 calls/minute (down from ~20)
- [ ] **Result:** ✅ PASS / ❌ FAIL

---

## 📋 Phase 4: Optional Enhancements

### Enhancement 4.1: Unread Badge in Header
File: `src/components/shared/Header.tsx`

- [ ] Add state for unread count
- [ ] Add useEffect to fetch count
- [ ] Update Messages link with badge
- [ ] Test badge updates in real-time

### Enhancement 4.2: Sound Notifications
- [ ] Download notification sound
- [ ] Place in `public/sounds/message-notification.mp3`
- [ ] Import useMessageSound hook
- [ ] Call playSound() on new message
- [ ] Test sound plays

### Enhancement 4.3: Message Reactions
- [ ] Create message_reactions table
- [ ] Add reaction UI to messages
- [ ] Subscribe to reaction changes
- [ ] Test reactions appear in real-time

---

## 📋 Phase 5: Production Deployment

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] No console errors
- [ ] RLS policies verified
- [ ] Migration run on production DB
- [ ] Realtime enabled on production
- [ ] Environment variables set

### Deployment Steps
- [ ] Commit all changes to git
- [ ] Push to repository
- [ ] Deploy to Vercel/hosting
- [ ] Run migration on production Supabase
- [ ] Enable Realtime on production tables
- [ ] Test with real users

### Post-Deployment Monitoring
- [ ] Check Supabase dashboard for errors
- [ ] Monitor realtime connection count
- [ ] Watch for failed subscriptions
- [ ] Track message delivery latency
- [ ] Review user feedback

---

## 🐛 Troubleshooting Guide

### Issue: Messages not appearing in realtime

**Check:**
- [ ] Realtime enabled on messages table?
- [ ] Browser console shows subscription errors?
- [ ] RLS policies allow SELECT?
- [ ] Network tab shows websocket connection?

**Fix:**
1. Go to Supabase → Database → Replication
2. Enable Realtime on messages table
3. Refresh browser
4. Check console for errors

---

### Issue: Typing indicators not working

**Check:**
- [ ] typing_indicators table exists?
- [ ] RLS policies allow INSERT/DELETE?
- [ ] Console shows errors?

**Fix:**
1. Re-run migration SQL
2. Verify table in Table Editor
3. Check RLS policies
4. Test with console.log in handleTyping()

---

### Issue: Presence always shows offline

**Check:**
- [ ] user_presence table exists?
- [ ] PresenceProvider wrapping page?
- [ ] Console shows upsert errors?

**Fix:**
1. Verify PresenceProvider is imported
2. Check it wraps the page component
3. Look for RLS policy errors in console
4. Manually insert test row in user_presence

---

### Issue: High API call count

**Check:**
- [ ] Polling intervals updated?
- [ ] Realtime subscriptions active?
- [ ] Multiple subscriptions to same channel?

**Fix:**
1. Increase polling intervals to 30s
2. Ensure only one subscription per channel
3. Remove duplicate useEffect calls
4. Check for memory leaks (unmounted components)

---

## 📊 Success Metrics

After implementation, you should see:

### Performance Improvements
- ✅ Message latency: < 200ms (was 0-3 seconds)
- ✅ API calls: ~2/minute (was ~20/minute)
- ✅ Bandwidth usage: -90%
- ✅ Server load: -85%

### User Experience
- ✅ Instant message delivery
- ✅ Live typing indicators
- ✅ Real-time presence
- ✅ Smooth, responsive UI

### Technical Metrics
- ✅ Realtime connections: Active
- ✅ Subscription success rate: > 99%
- ✅ Database queries: Optimized
- ✅ RLS policies: Secure

---

## 🎉 Completion

When all checkboxes are checked:

- [ ] **Phase 1:** Database Setup ✅
- [ ] **Phase 2:** Code Integration ✅
- [ ] **Phase 3:** Testing ✅
- [ ] **Phase 4:** Optional Enhancements ✅
- [ ] **Phase 5:** Production Deployment ✅

**Congratulations! Your realtime messaging system is live! 🚀**

---

## 📚 Next Steps

1. **Monitor Usage**
   - Check Supabase dashboard daily
   - Watch for errors or performance issues
   - Track user engagement

2. **Gather Feedback**
   - Ask users about messaging experience
   - Identify pain points
   - Plan improvements

3. **Plan Enhancements**
   - Message reactions
   - File sharing
   - Group chats
   - Video calls

---

**Need help?** Check the detailed guides:
- `REALTIME_SETUP_GUIDE.md` - Complete setup instructions
- `REALTIME_IMPLEMENTATION.md` - Quick implementation guide
- `REALTIME_ARCHITECTURE.md` - System architecture details
