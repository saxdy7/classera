import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { messageId, communityId, action } = body;

        if (!messageId || !communityId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify user is mentor of the community
        const { data: community } = await supabase
            .from('communities')
            .select('mentor_id')
            .eq('id', communityId)
            .single();

        if (!community || community.mentor_id !== user.id) {
            return NextResponse.json({ error: 'Only mentors can pin messages' }, { status: 403 });
        }

        if (action === 'pin') {
            // Check pin limit (5 per community)
            const { count } = await supabase
                .from('pinned_messages')
                .select('*', { count: 'exact', head: true })
                .eq('community_id', communityId);

            if (count && count >= 5) {
                return NextResponse.json({ error: 'Pin limit reached (max 5)' }, { status: 400 });
            }

            const { data, error } = await supabase
                .from('pinned_messages')
                .insert({
                    message_id: messageId,
                    community_id: communityId,
                    pinned_by: user.id
                })
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, pinned: data });
        } else if (action === 'unpin') {
            const { error } = await supabase
                .from('pinned_messages')
                .delete()
                .eq('message_id', messageId)
                .eq('community_id', communityId);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Error managing pins:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const communityId = searchParams.get('communityId');

        if (!communityId) {
            return NextResponse.json({ error: 'Community ID required' }, { status: 400 });
        }

        const { data: pins, error } = await supabase
            .from('pinned_messages')
            .select(`
        *,
        message:community_messages(
          id,
          content,
          created_at,
          sender:users(full_name)
        )
      `)
            .eq('community_id', communityId)
            .order('pinned_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ pins: pins || [] });
    } catch (error: any) {
        console.error('Error fetching pins:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
