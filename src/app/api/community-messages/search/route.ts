import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const channelId = searchParams.get('channelId');
        const query = searchParams.get('query');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!channelId || !query) {
            return NextResponse.json({ error: 'Channel ID and query required' }, { status: 400 });
        }

        // Perform text search
        // Note: This relies on the index created in the migration
        const { data: messages, error } = await supabase
            .from('community_messages')
            .select(`
        id,
        channel_id,
        user_id,
        content,
        created_at,
        updated_at,
        sender:users!community_messages_user_id_fkey(
          id,
          full_name,
          avatar_url
        )
      `)
            .eq('channel_id', channelId)
            .textSearch('content', query, {
                type: 'plain',
                config: 'english'
            })
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return NextResponse.json({ messages: messages || [] });
    } catch (error: any) {
        console.error('Error searching messages:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
