# 🏗️ Realtime Architecture - Classera Messaging System

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLASSERA REALTIME SYSTEM                     │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐                                      ┌──────────────┐
│   Student    │                                      │    Mentor    │
│   Browser    │                                      │   Browser    │
└──────┬───────┘                                      └──────┬───────┘
       │                                                     │
       │  ┌─────────────────────────────────────────────┐   │
       │  │         React Components Layer              │   │
       │  │                                             │   │
       ├──┤  • MessagesClient                          ├───┤
       │  │  • ChatInterface                           │   │
       │  │  • PresenceProvider                        │   │
       │  └─────────────────────────────────────────────┘   │
       │                                                     │
       │  ┌─────────────────────────────────────────────┐   │
       │  │         Custom Hooks Layer                  │   │
       │  │                                             │   │
       ├──┤  • useRealtimeMessages                     ├───┤
       │  │  • useTypingIndicator                      │   │
       │  │  • usePresence                             │   │
       │  │  • useMessageSound                         │   │
       │  └─────────────────────────────────────────────┘   │
       │                                                     │
       │  ┌─────────────────────────────────────────────┐   │
       │  │         Supabase Client Layer               │   │
       │  │                                             │   │
       ├──┤  • Realtime Subscriptions                  ├───┤
       │  │  • Database Queries                        │   │
       │  │  • Authentication                          │   │
       │  └─────────────────────────────────────────────┘   │
       │                                                     │
       │                        │                            │
       │                        ▼                            │
       │              ┌──────────────────┐                   │
       │              │  Supabase Cloud  │                   │
       │              │                  │                   │
       └──────────────┤  • PostgreSQL    ├───────────────────┘
                      │  • Realtime      │
                      │  • Auth          │
                      │  • Storage       │
                      └──────────────────┘
```

---

## Data Flow Diagrams

### 1. Message Sending Flow

```
Student Types Message
        │
        ▼
┌───────────────────┐
│ handleTyping()    │ ─────► Typing Indicator Sent to DB
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ sendMessage()     │
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ POST /api/messages│
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ Supabase INSERT   │ ─────► Realtime Broadcast
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ Mentor's Browser  │ ◄──── Realtime Subscription Receives
└───────┬───────────┘
        │
        ▼
┌───────────────────┐
│ Message Appears   │
│ Sound Plays       │
└───────────────────┘
```

### 2. Typing Indicator Flow

```
User Types in Input
        │
        ▼
┌─────────────────────────┐
│ handleTyping() called   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Upsert typing_indicators│
│ table with user_id      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Realtime Broadcast      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Other User's Subscription│
│ Receives Update         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Show "..." Animation    │
└─────────────────────────┘
            │
            ▼ (after 3 seconds of no typing)
┌─────────────────────────┐
│ Delete typing indicator │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Hide "..." Animation    │
└─────────────────────────┘
```

### 3. Presence Tracking Flow

```
User Opens Messages Page
        │
        ▼
┌─────────────────────────┐
│ PresenceProvider Mounts │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Upsert user_presence    │
│ status = 'online'       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Set Interval (30s)      │
│ Keep updating presence  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Other Users See         │
│ Green Dot (Online)      │
└─────────────────────────┘
            │
            ▼ (when user closes tab)
┌─────────────────────────┐
│ beforeunload event      │
│ Update status='offline' │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Other Users See         │
│ Gray Dot (Offline)      │
└─────────────────────────┘
```

---

## Database Schema

### Messages Table
```sql
messages
├── id (UUID)
├── sender_id (UUID) → users.id
├── receiver_id (UUID) → users.id
├── content (TEXT)
├── read (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

Indexes:
- idx_messages_sender_id
- idx_messages_receiver_id
- idx_messages_sender_receiver
- idx_messages_created_at_desc

RLS Policies:
- Users can view their own messages
- Users can send messages
- Users can update received messages (mark as read)
```

### User Presence Table
```sql
user_presence
├── user_id (UUID) → users.id [PRIMARY KEY]
├── status (TEXT) → 'online' | 'offline' | 'away'
├── last_seen (TIMESTAMP)
└── updated_at (TIMESTAMP)

Indexes:
- idx_user_presence_user_id
- idx_user_presence_status

RLS Policies:
- Readable by all authenticated users
- Users can insert/update their own presence
```

### Typing Indicators Table
```sql
typing_indicators
├── id (UUID)
├── user_id (UUID) → users.id
├── conversation_with (UUID) → users.id
├── is_typing (BOOLEAN)
└── created_at (TIMESTAMP)

UNIQUE(user_id, conversation_with)

Indexes:
- idx_typing_user_conversation

RLS Policies:
- Users can see typing in their conversations
- Users can insert/update/delete their own typing status
```

---

## Realtime Channels

### 1. Messages Channel
```typescript
Channel: `messages:${currentUserId}:${otherUserId}`

Subscriptions:
- INSERT events where sender_id = otherUserId
- INSERT events where sender_id = currentUserId
- UPDATE events on messages table

Purpose: Instant message delivery
```

### 2. Typing Channel
```typescript
Channel: `typing:${currentUserId}:${otherUserId}`

Subscriptions:
- INSERT/UPDATE/DELETE events on typing_indicators
- Filter: user_id = otherUserId

Purpose: Show typing indicators
```

### 3. Presence Channel
```typescript
Channel: `presence:${userId}`

Subscriptions:
- INSERT/UPDATE/DELETE events on user_presence
- Filter: user_id = userId

Purpose: Track online/offline status
```

---

## Performance Optimizations

### Before Realtime
```
┌─────────────────────────────────────┐
│ Polling Strategy                    │
├─────────────────────────────────────┤
│ Messages: Every 3 seconds           │
│ Conversations: Every 5 seconds      │
│ API Calls/minute: ~20               │
│ Server Load: High                   │
│ Message Delay: 0-3 seconds          │
└─────────────────────────────────────┘
```

### After Realtime
```
┌─────────────────────────────────────┐
│ Realtime + Fallback Strategy        │
├─────────────────────────────────────┤
│ Messages: Realtime + 30s fallback   │
│ Conversations: 30s polling           │
│ API Calls/minute: ~2                │
│ Server Load: Low                    │
│ Message Delay: < 100ms              │
│ Bandwidth Saved: ~90%               │
└─────────────────────────────────────┘
```

---

## Security Architecture

### Row Level Security (RLS)

```
┌────────────────────────────────────────────────┐
│              RLS Policy Flow                   │
└────────────────────────────────────────────────┘

User Makes Request
        │
        ▼
┌─────────────────────┐
│ Supabase Auth       │
│ Validates JWT       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ RLS Policy Check    │
│ auth.uid() = ?      │
└──────────┬──────────┘
           │
           ├─── PASS ──► Query Executes
           │
           └─── FAIL ──► 403 Forbidden
```

### Policy Examples

**Messages:**
```sql
-- Users can only see messages where they are sender OR receiver
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id
)
```

**Presence:**
```sql
-- Everyone can read, only owner can update
SELECT: auth.uid() IS NOT NULL
UPDATE: auth.uid() = user_id
```

**Typing Indicators:**
```sql
-- Can see typing in your conversations
SELECT: user_id = auth.uid() OR conversation_with = auth.uid()
INSERT/UPDATE/DELETE: user_id = auth.uid()
```

---

## Monitoring & Debugging

### Key Metrics to Track

1. **Realtime Connection Status**
   - Check: `supabase.channel().state`
   - Should be: `'joined'`

2. **Message Latency**
   - Measure: Time from send to receive
   - Target: < 200ms

3. **Subscription Health**
   - Monitor: Channel subscriptions
   - Alert: If subscription drops

4. **Database Performance**
   - Watch: Query execution time
   - Optimize: Add indexes if slow

### Debug Checklist

```
□ Realtime enabled on messages table?
□ RLS policies allow the operation?
□ User authenticated (JWT valid)?
□ Channel subscription active?
□ Network connection stable?
□ Browser console shows errors?
□ Supabase dashboard shows activity?
```

---

## Scalability Considerations

### Current Capacity (Supabase Free Tier)
- **Concurrent Connections:** 200
- **Messages/month:** Unlimited
- **Database Size:** 500MB
- **Bandwidth:** 5GB

### Scaling Strategy
1. **Horizontal:** Add more Supabase instances
2. **Vertical:** Upgrade to Pro tier
3. **Caching:** Use Redis for presence data
4. **CDN:** Serve static assets via CDN

---

## Future Enhancements

### Phase 1 (Current) ✅
- Real-time messaging
- Typing indicators
- Presence tracking

### Phase 2 (Planned)
- Message reactions (❤️, 👍)
- File attachments
- Voice messages
- Message search

### Phase 3 (Future)
- Group chats
- Video calls integration
- Screen sharing
- End-to-end encryption

---

**Architecture designed for scale, built for performance! 🚀**
