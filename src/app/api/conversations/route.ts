import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Get list of conversations (users you've messaged with)
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all messages involving current user
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Get unique user IDs (conversation partners)
    const userIds = new Set<string>();
    messages.forEach((msg: any) => {
      if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
      if (msg.receiver_id !== user.id) userIds.add(msg.receiver_id);
    });

    // Fetch user details separately
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, role')
      .in('id', Array.from(userIds));

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // Create user map for quick lookup
    const userMap = new Map();
    users?.forEach((u: any) => {
      userMap.set(u.id, u);
    });

    // Group messages by conversation partner
    const conversationsMap = new Map();

    messages?.forEach((message: any) => {
      const isCurrentUserSender = message.sender_id === user.id;
      const otherUserId = isCurrentUserSender ? message.receiver_id : message.sender_id;
      const otherUser = userMap.get(otherUserId);
      
      if (!otherUser) return;

      const existingConversation = conversationsMap.get(otherUser.id);

      if (!existingConversation || new Date(message.created_at) > new Date(existingConversation.lastMessage.created_at)) {
        conversationsMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: {
            content: message.content,
            created_at: message.created_at,
            isFromCurrentUser: isCurrentUserSender,
            read: message.read,
          },
          unreadCount: 0,
        });
      }
    });

    // Calculate unread count for each conversation
    messages?.forEach((message: any) => {
      if (message.receiver_id === user.id && !message.read) {
        const conversation = conversationsMap.get(message.sender_id);
        if (conversation) {
          conversation.unreadCount += 1;
        }
      }
    });

    const conversations = Array.from(conversationsMap.values());

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
