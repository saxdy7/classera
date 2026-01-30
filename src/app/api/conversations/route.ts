import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // NEW SCHEMA: Fetch conversations via conversation_participants
    const { data: participations, error: participationError } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        updated_at,
        conversation:conversations!inner(
          id,
          type,
          name,
          image_url,
          last_message_at,
          participants:conversation_participants(
            user:users(id, full_name, avatar_url, role)
          )
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (participationError) {
      console.error('Error fetching conversations:', participationError);
      return NextResponse.json({ error: participationError.message }, { status: 500 });
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Transform data for frontend
    const conversations = participations.map((p: any) => {
      const conv = p.conversation;

      // Find the "other user" for direct chats
      let otherUser = null;
      if (conv.type === 'direct') {
        const otherParticipant = conv.participants.find(
          (part: any) => part.user.id !== user.id
        );
        otherUser = otherParticipant?.user;
      }

      // Fetch last message (optional optimization: could include in query)
      // For now, we return structure expected by frontend, but we might need to fetch last message separately
      // or rely on `last_message_at`. 

      return {
        id: conv.id, // Conversation ID (new field for frontend to track)
        user: otherUser, // For direct chats
        name: conv.name, // For group chats
        type: conv.type,
        lastMessage: {
          // Placeholder - real implementation would fetch from messages table
          // For simple list, last_message_at might be enough for sorting
          created_at: conv.last_message_at,
          content: 'Message',
          isFromCurrentUser: false,
          read: true
        },
        unreadCount: 0 // Placeholder
      };
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
