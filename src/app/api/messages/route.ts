import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Actual DB schema (999_CLEAN_CONSOLIDATED_SCHEMA + ADD_MISSING_TABLES):
//   messages: id, sender_id, receiver_id, content, is_read,
//             created_at, updated_at,
//             conversation_id (nullable — added by ADD_MISSING_TABLES)
// No `type`, no `message_type`, no `community_id` columns.
function normalizeMessage(m: any, senderMap?: Record<string, any>) {
  if (!m) return m;
  return {
    ...m,
    type: m.message_type ?? m.type ?? 'text', // default to 'text' — no type column in DB
    sender: m.sender ?? (senderMap ? senderMap[m.sender_id] ?? null : null),
  };
}

// Helper: find or create a conversation between two users (for conversation_participants tracking)
async function findOrCreateConversation(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  otherUserId: string
): Promise<string | null> {
  try {
    const [{ data: mine }, { data: theirs }] = await Promise.all([
      admin.from('conversation_participants').select('conversation_id').eq('user_id', userId),
      admin.from('conversation_participants').select('conversation_id').eq('user_id', otherUserId),
    ]);
    const mySet = new Set((mine ?? []).map((r: any) => r.conversation_id));
    const common = (theirs ?? []).find((r: any) => mySet.has(r.conversation_id));
    if (common) return (common as any).conversation_id as string;

    const { data: newConv, error: convErr } = await admin
      .from('conversations')
      .insert({ type: 'direct' })
      .select('id')
      .single();
    if (convErr || !newConv) return null;

    const conversationId = (newConv as any).id as string;
    await admin.from('conversation_participants').insert([
      { conversation_id: conversationId, user_id: userId },
      { conversation_id: conversationId, user_id: otherUserId },
    ]);
    return conversationId;
  } catch {
    return null; // conversations/conversation_participants tables may not be ready
  }
}

// GET /api/messages?otherUserId=X
// Uses sender_id+receiver_id query — works with archive 001 schema (receiver_id column exists)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const otherUserId = new URL(request.url).searchParams.get('otherUserId');
    if (!otherUserId) return NextResponse.json({ messages: [] });

    const admin = createAdminClient();

    // Query by sender/receiver pair (no community_id column — only direct messages exist in this table)
    const { data: messages, error } = await admin
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),` +
        `and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: error.message || 'Failed to fetch messages' }, { status: 500 });
    }

    // Bulk-fetch sender info (no FK hints — avoids schema cache issues)
    const senderIds = [...new Set((messages ?? []).map((m: any) => m.sender_id))];
    let senderMap: Record<string, any> = {};
    if (senderIds.length > 0) {
      const { data: users } = await admin
        .from('users')
        .select('id, full_name, avatar_url, role')
        .in('id', senderIds);
      senderMap = Object.fromEntries((users ?? []).map((u: any) => [u.id, u]));
    }

    return NextResponse.json({ messages: (messages ?? []).map((m: any) => normalizeMessage(m, senderMap)) });
  } catch (error: any) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

// POST /api/messages  { receiverId, content, type? }
// Uses message_type + receiver_id (actual archive 001 columns). Also stores conversation_id if available.
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

    const { receiverId, content, type = 'text' } = body;
    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: 'receiverId and content are required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Optionally track conversation (for conversations list view)
    const conversationId = await findOrCreateConversation(admin, user.id, receiverId);

    // Build insert — only columns that exist: sender_id, receiver_id, content, conversation_id (nullable)
    // No `type` or `message_type` column in the actual DB schema
    const msgPayload: Record<string, any> = {
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
    };
    if (conversationId) msgPayload.conversation_id = conversationId;

    const { data: message, error: msgErr } = await admin
      .from('messages')
      .insert(msgPayload)
      .select()
      .single();

    if (msgErr) {
      console.error('Insert message error:', msgErr);
      return NextResponse.json({ error: msgErr.message || 'Failed to insert message' }, { status: 500 });
    }

    // Fetch sender info separately (avoids FK hint issues — messages has sender_id and receiver_id FKs)
    const { data: sender } = await admin
      .from('users')
      .select('id, full_name, avatar_url, role')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      message: normalizeMessage(message, sender ? { [user.id]: sender } : {}),
    });
  } catch (error: any) {
    console.error('Error in POST /api/messages:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}




