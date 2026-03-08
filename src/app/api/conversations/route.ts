import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // 1. Get all conversation_ids where this user is a participant
    const { data: myParts, error: partsError } = await admin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (partsError) throw partsError;

    const convIds = (myParts ?? []).map((p: any) => p.conversation_id);
    if (convIds.length === 0) return NextResponse.json({ conversations: [] });

    // 2. Get the other participant for each conversation
    const { data: otherParts } = await admin
      .from('conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds)
      .neq('user_id', user.id);

    // 3. Fetch user info for all other participants
    const otherUserIds = [...new Set((otherParts ?? []).map((p: any) => p.user_id))];
    let usersMap: Record<string, any> = {};
    if (otherUserIds.length > 0) {
      const { data: usersData } = await admin
        .from('users')
        .select('id, full_name, avatar_url, role')
        .in('id', otherUserIds);
      usersMap = Object.fromEntries((usersData ?? []).map((u: any) => [u.id, u]));
    }

    // 4. Get last message per conversation
    const { data: allMsgs } = await admin
      .from('messages')
      .select('conversation_id, content, sender_id, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false });

    const lastMsgMap: Record<string, any> = {};
    for (const msg of allMsgs ?? []) {
      if (!lastMsgMap[(msg as any).conversation_id]) lastMsgMap[(msg as any).conversation_id] = msg;
    }

    // 5. Build response
    const conversations = convIds
      .map((convId: string) => {
        const otherPart = (otherParts ?? []).find((p: any) => p.conversation_id === convId);
        if (!otherPart) return null;
        const otherUser = usersMap[(otherPart as any).user_id];
        if (!otherUser) return null;
        const lastMsg = lastMsgMap[convId];
        return {
          id: convId,
          user: otherUser,
          type: 'direct',
          lastMessage: {
            created_at: lastMsg?.created_at ?? null,
            content: lastMsg?.content ?? '',
            isFromCurrentUser: lastMsg?.sender_id === user.id,
            read: true,
          },
          unreadCount: 0,
        };
      })
      .filter(Boolean);

    // Sort by most recent message
    conversations.sort((a: any, b: any) => {
      const at = a.lastMessage?.created_at ? new Date(a.lastMessage.created_at).getTime() : 0;
      const bt = b.lastMessage?.created_at ? new Date(b.lastMessage.created_at).getTime() : 0;
      return bt - at;
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Error in GET /api/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

