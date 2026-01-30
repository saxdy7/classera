import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Get messages for a specific conversation
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('otherUserId');

    // NEW: We now expect a conversationId or we find it
    let conversationId = searchParams.get('conversationId');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // IF no conversationId but otherUserId is provided, try to find the direct conversation
    if (!conversationId && otherUserId) {
      // Find common conversation of type 'direct'
      const { data: commonConvs } = await supabase
        .rpc('get_direct_conversation_id', {
          user1_id: user.id,
          user2_id: otherUserId
        });

      // If RPC is not available or returns null, we might need a fallback query or just return empty
      // Fallback query (more expensive):
      if (!commonConvs) {
        // Query conversation_participants for both users
        const { data: myConvs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', user.id);

        const { data: otherConvs } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId);

        // Find intersection
        const myConvIds = new Set(myConvs?.map(c => c.conversation_id));
        const common = otherConvs?.find(c => myConvIds.has(c.conversation_id));

        if (common) {
          conversationId = common.conversation_id;
        }
      }
    }

    if (!conversationId) {
      // No conversation exists yet, return empty list
      return NextResponse.json({ messages: [] });
    }

    // Get messages for this conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, avatar_url, role)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }); // Chat UI expects ascending usually, or we reverse in frontend

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: messagesError.message }, { status: 500 });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Send a new message
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { receiverId, conversationId: existingId, content, type = 'text', fileUrl } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let conversationId = existingId;

    // Phase 1: Ensure Conversation Exists
    if (!conversationId && receiverId) {
      // Logic to find or create conversation
      // 1. Check if exists (same as GET logic)
      const { data: myConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      const { data: otherConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', receiverId);

      const myConvIds = new Set(myConvs?.map(c => c.conversation_id));
      const common = otherConvs?.find(c => myConvIds.has(c.conversation_id));

      if (common) {
        conversationId = common.conversation_id;
      } else {
        // CREATE NEW CONVERSATION
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({ type: 'direct' })
          .select()
          .single();

        if (createError) throw createError;

        conversationId = newConv.id;

        // Add participants
        await supabase.from('conversation_participants').insert([
          { conversation_id: conversationId, user_id: user.id },
          { conversation_id: conversationId, user_id: receiverId }
        ]);
      }
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'Could not resolve conversation' }, { status: 400 });
    }

    // Phase 2: Insert Message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content?.trim(),
        type: type,
        file_url: fileUrl
      })
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, full_name, avatar_url, role)
      `)
      .single();

    if (insertError) {
      console.error('Error sending message:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in POST /api/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
