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
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, full_name, avatar_url, role),
        receiver:receiver_id(id, full_name, avatar_url, role)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group messages by conversation partner
    const conversationsMap = new Map();

    messages?.forEach((message: any) => {
      const isCurrentUserSender = message.sender_id === user.id;
      const otherUser = isCurrentUserSender ? message.receiver : message.sender;
      
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
