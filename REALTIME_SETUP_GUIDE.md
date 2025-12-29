# 🚀 Realtime Experience Setup Guide - Classera

## Overview
This guide will help you enhance your existing messaging system with advanced realtime features including typing indicators, presence tracking, and optimized Supabase Realtime subscriptions.

## ✅ What You Already Have
- ✅ Messages table with RLS policies
- ✅ Basic Supabase Realtime subscriptions
- ✅ MessagesClient and ChatInterface components
- ✅ API routes for messages and conversations
- ✅ Polling fallback (every 3 seconds)

## 🎯 What We'll Add
1. **Enhanced Realtime Subscriptions** - Better channel management
2. **Typing Indicators** - "User is typing..." feature
3. **Online/Offline Presence** - See who's online
4. **Unread Message Badges** - Real-time badge in header
5. **Sound Notifications** - Audio alerts for new messages
6. **Optimized Performance** - Reduce polling, better subscriptions

---

## 📋 Step 1: Enable Realtime in Supabase

### 1.1 Enable Realtime for Messages Table
1. Go to your **Supabase Dashboard**
2. Navigate to **Database** → **Replication**
3. Find the **`messages`** table
4. Toggle **Realtime** to **ON**
5. Click **Save**

### 1.2 Create Presence Table (Optional but Recommended)
Run this SQL in your Supabase SQL Editor:

```sql
-- Create presence tracking table
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'away')) DEFAULT 'offline',
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read presence
CREATE POLICY "Presence readable by authenticated users"
  ON public.user_presence
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Users can update their own presence
CREATE POLICY "Users can update own presence"
  ON public.user_presence
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own presence status"
  ON public.user_presence
  FOR UPDATE
  USING (user_id = auth.uid());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_presence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_presence_updated_at
  BEFORE UPDATE ON public.user_presence
  FOR EACH ROW
  EXECUTE FUNCTION update_user_presence_updated_at();
```

### 1.3 Create Typing Indicators Table
```sql
-- Create typing indicators table (ephemeral data)
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  conversation_with UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, conversation_with)
);

-- Enable RLS
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see typing indicators for their conversations
CREATE POLICY "Users can see typing in their conversations"
  ON public.typing_indicators
  FOR SELECT
  USING (
    user_id = auth.uid() OR conversation_with = auth.uid()
  );

-- Policy: Users can insert/update their own typing status
CREATE POLICY "Users can update own typing status"
  ON public.typing_indicators
  FOR ALL
  USING (user_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_typing_user_conversation 
  ON public.typing_indicators(user_id, conversation_with);

-- Auto-delete old typing indicators (cleanup function)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
  DELETE FROM public.typing_indicators
  WHERE created_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 Step 2: Update Database Migration

Add this to a new migration file: `supabase/migrations/004_realtime_enhancements.sql`

```sql
-- Enable Realtime for messages table (if not already enabled)
-- This is done via Supabase Dashboard, but documented here

-- Add online status to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS online_status TEXT 
CHECK (online_status IN ('online', 'offline', 'away')) 
DEFAULT 'offline';

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Index for online status queries
CREATE INDEX IF NOT EXISTS idx_users_online_status ON public.users(online_status);
```

---

## 📋 Step 3: Create Enhanced Hooks

### 3.1 Create `useRealtimeMessages` Hook
Create file: `src/hooks/useRealtimeMessages.ts`

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export function useRealtimeMessages(currentUserId: string, otherUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/messages?otherUserId=${otherUserId}`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [otherUserId]);

  useEffect(() => {
    fetchMessages();

    // Subscribe to realtime changes
    const channel: RealtimeChannel = supabase
      .channel(`messages:${currentUserId}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${otherUserId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          fetchMessages(); // Refetch to get complete data with joins
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Message updated:', payload);
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId, fetchMessages, supabase]);

  return { messages, loading, refetch: fetchMessages };
}
```

### 3.2 Create `useTypingIndicator` Hook
Create file: `src/hooks/useTypingIndicator.ts`

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useTypingIndicator(currentUserId: string, otherUserId: string) {
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const supabase = createClient();
  let typingTimeout: NodeJS.Timeout;

  const setTyping = useCallback(async (isTyping: boolean) => {
    try {
      if (isTyping) {
        await supabase
          .from('typing_indicators')
          .upsert({
            user_id: currentUserId,
            conversation_with: otherUserId,
            is_typing: true,
            created_at: new Date().toISOString(),
          });
      } else {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('user_id', currentUserId)
          .eq('conversation_with', otherUserId);
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [currentUserId, otherUserId, supabase]);

  const handleTyping = useCallback(() => {
    setTyping(true);
    
    // Clear existing timeout
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeout = setTimeout(() => {
      setTyping(false);
    }, 3000);
  }, [setTyping]);

  useEffect(() => {
    // Subscribe to typing indicators
    const channel = supabase
      .channel(`typing:${currentUserId}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `user_id=eq.${otherUserId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setIsOtherUserTyping(true);
            // Auto-hide after 5 seconds
            setTimeout(() => setIsOtherUserTyping(false), 5000);
          } else if (payload.eventType === 'DELETE') {
            setIsOtherUserTyping(false);
          }
        }
      )
      .subscribe();

    return () => {
      setTyping(false);
      supabase.removeChannel(channel);
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [currentUserId, otherUserId, setTyping, supabase]);

  return { isOtherUserTyping, handleTyping, setTyping };
}
```

### 3.3 Create `usePresence` Hook
Create file: `src/hooks/usePresence.ts`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function usePresence(userId: string) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Fetch initial presence
    const fetchPresence = async () => {
      const { data } = await supabase
        .from('user_presence')
        .select('status, last_seen')
        .eq('user_id', userId)
        .single();

      if (data) {
        setIsOnline(data.status === 'online');
        setLastSeen(data.last_seen);
      }
    };

    fetchPresence();

    // Subscribe to presence changes
    const channel = supabase
      .channel(`presence:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            setIsOnline(payload.new.status === 'online');
            setLastSeen(payload.new.last_seen);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase]);

  return { isOnline, lastSeen };
}
```

---

## 📋 Step 4: Update Components

### 4.1 Enhanced ChatInterface Component
Update `src/components/shared/ChatInterface.tsx` to use the new hooks:

```typescript
// Add these imports at the top
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { usePresence } from '@/hooks/usePresence';

// Inside the component, replace the existing hooks with:
const { messages, loading: messagesLoading } = useRealtimeMessages(currentUserId, otherUser.id);
const { isOtherUserTyping, handleTyping } = useTypingIndicator(currentUserId, otherUser.id);
const { isOnline, lastSeen } = usePresence(otherUser.id);

// Update the input onChange to include typing indicator:
onChange={(e) => {
  setNewMessage(e.target.value);
  handleTyping(); // Trigger typing indicator
}}

// Add typing indicator in the messages area:
{isOtherUserTyping && (
  <div className="flex justify-start">
    <div className="bg-slate-200 rounded-2xl px-4 py-2 rounded-bl-none">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
    </div>
  </div>
)}

// Add online status indicator in the header:
<div className="flex items-center gap-2">
  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></div>
  <p className="text-sm text-slate-500 capitalize">
    {isOnline ? 'Online' : lastSeen ? `Last seen ${formatLastSeen(lastSeen)}` : otherUser.role}
  </p>
</div>
```

---

## 📋 Step 5: Add Presence Tracking

### 5.1 Create Presence Provider
Create file: `src/components/providers/PresenceProvider.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PresenceProviderProps {
  userId: string;
  children: React.ReactNode;
}

export function PresenceProvider({ userId, children }: PresenceProviderProps) {
  const supabase = createClient();

  useEffect(() => {
    // Set user as online when component mounts
    const setOnline = async () => {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          status: 'online',
          last_seen: new Date().toISOString(),
        });
    };

    // Set user as offline when component unmounts or page closes
    const setOffline = async () => {
      await supabase
        .from('user_presence')
        .update({
          status: 'offline',
          last_seen: new Date().toISOString(),
        })
        .eq('user_id', userId);
    };

    setOnline();

    // Update presence every 30 seconds
    const interval = setInterval(setOnline, 30000);

    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', setOffline);

    return () => {
      setOffline();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', setOffline);
    };
  }, [userId, supabase]);

  return <>{children}</>;
}
```

### 5.2 Wrap Dashboard Pages with PresenceProvider
Update both `src/app/dashboard/student/messages/page.tsx` and `src/app/dashboard/mentor/messages/page.tsx`:

```typescript
import { PresenceProvider } from '@/components/providers/PresenceProvider';

// Wrap the return with PresenceProvider:
return (
  <PresenceProvider userId={user.id}>
    <div className="min-h-screen bg-slate-50">
      {/* ... rest of the component */}
    </div>
  </PresenceProvider>
);
```

---

## 📋 Step 6: Add Sound Notifications

### 6.1 Create Notification Sound Hook
Create file: `src/hooks/useMessageSound.ts`

```typescript
'use client';

import { useEffect, useRef } from 'react';

export function useMessageSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio('/sounds/message-notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.log('Could not play sound:', error);
      });
    }
  };

  return { playSound };
}
```

### 6.2 Add Sound File
1. Create folder: `public/sounds/`
2. Add a notification sound file: `message-notification.mp3`
   - You can download free sounds from [Zapsplat](https://www.zapsplat.com/) or [Freesound](https://freesound.org/)
   - Or use a simple beep sound

---

## 📋 Step 7: Testing Checklist

### ✅ Test Realtime Messaging
1. Open two browser windows (or one incognito)
2. Login as Student in one, Mentor in another
3. Start a conversation
4. Send a message from one window
5. **Expected**: Message appears instantly in the other window

### ✅ Test Typing Indicators
1. In one window, start typing
2. **Expected**: "User is typing..." appears in the other window
3. Stop typing for 3 seconds
4. **Expected**: Typing indicator disappears

### ✅ Test Presence
1. Close one browser window
2. **Expected**: User shows as "Offline" in the other window
3. Reopen the window
4. **Expected**: User shows as "Online"

### ✅ Test Sound Notifications
1. Have one window in the background
2. Send a message from the other window
3. **Expected**: Notification sound plays

---

## 🎨 UI Enhancements

### Add Unread Badge to Header
Update `src/components/shared/Header.tsx`:

```typescript
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  const fetchUnreadCount = async () => {
    const response = await fetch('/api/conversations');
    const data = await response.json();
    const total = data.conversations?.reduce((sum: number, conv: any) => sum + conv.unreadCount, 0) || 0;
    setUnreadCount(total);
  };

  fetchUnreadCount();
  const interval = setInterval(fetchUnreadCount, 5000);
  return () => clearInterval(interval);
}, []);

// In the Messages link:
<Link href={`/dashboard/${profile.role}/messages`} className="relative ...">
  <MessageSquare className="..." />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</Link>
```

---

## 🚀 Performance Optimizations

### 1. Remove Polling (Now that Realtime is working)
In `ChatInterface.tsx`, you can remove or increase the polling interval:

```typescript
// BEFORE: Poll every 3 seconds
const interval = setInterval(fetchMessages, 3000);

// AFTER: Poll every 30 seconds as fallback only
const interval = setInterval(fetchMessages, 30000);
```

### 2. Debounce Typing Indicators
Already implemented in the `useTypingIndicator` hook with 3-second timeout.

### 3. Batch Presence Updates
Already implemented in `PresenceProvider` with 30-second intervals.

---

## 🔒 Security Considerations

1. **RLS Policies**: Already in place for messages, presence, and typing indicators
2. **Rate Limiting**: Consider adding rate limiting for typing indicator updates
3. **Validation**: All data is validated on the server side via API routes

---

## 📚 Additional Features (Optional)

### Message Reactions
```sql
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL, -- emoji
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);
```

### Message Editing
```sql
ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN is_edited BOOLEAN DEFAULT false;
```

### File Attachments
```sql
ALTER TABLE messages ADD COLUMN attachment_type TEXT CHECK (attachment_type IN ('image', 'file', 'video'));
ALTER TABLE messages ADD COLUMN attachment_size INTEGER;
```

---

## 🎉 Conclusion

You now have a fully-featured realtime messaging system with:
- ✅ Instant message delivery
- ✅ Typing indicators
- ✅ Online/offline presence
- ✅ Sound notifications
- ✅ Unread message badges
- ✅ Optimized performance

**Next Steps:**
1. Run the SQL migrations
2. Create the hooks folder and add the custom hooks
3. Update the components
4. Test thoroughly
5. Deploy to production!

---

**Need Help?** Check the [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime) for more information.
