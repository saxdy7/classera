import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Get messages between two users
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('otherUserId');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!otherUserId) {
      return NextResponse.json({ error: 'otherUserId is required' }, { status: 400 });
    }

    // Get messages between current user and other user
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    // Get user details for sender and receiver
    const userIds = [user.id, otherUserId];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, role')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    }

    // Create user map
    const userMap = new Map();
    users?.forEach((u: any) => {
      userMap.set(u.id, u);
    });

    // Enrich messages with user data
    const enrichedMessages = messages?.map((msg: any) => ({
      ...msg,
      sender: userMap.get(msg.sender_id),
      receiver: userMap.get(msg.receiver_id)
    }));

    return NextResponse.json({ messages: enrichedMessages || [] });
  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Send a new message
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { receiverId, content } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'receiverId and content are required' },
        { status: 400 }
      );
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim(),
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error sending message:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Fetch user details separately
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, role')
      .in('id', [user.id, receiverId]);

    const userMap = new Map();
    users?.forEach((u: any) => {
      userMap.set(u.id, u);
    });

    const enrichedMessage = {
      ...message,
      sender: userMap.get(message.sender_id),
      receiver: userMap.get(message.receiver_id)
    };

    return NextResponse.json({ message: enrichedMessage });
  } catch (error) {
    console.error('Error in POST /api/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Mark messages as read
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { messageIds } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: 'messageIds array is required' }, { status: 400 });
    }

    // Mark messages as read
    const { error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', messageIds)
      .eq('receiver_id', user.id);

    if (error) {
      console.error('Error marking messages as read:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
