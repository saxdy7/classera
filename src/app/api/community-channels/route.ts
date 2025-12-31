import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Fetch channels for a community
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const communityId = searchParams.get('communityId');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!communityId) {
            return NextResponse.json({ error: 'Community ID required' }, { status: 400 });
        }

        // Fetch channels
        const { data: channels, error } = await supabase
            .from('community_channels')
            .select('*')
            .eq('community_id', communityId)
            .order('type', { ascending: true }); // announcement first, then discussion

        if (error) throw error;

        return NextResponse.json({ channels: channels || [] });
    } catch (error: any) {
        console.error('Error fetching channels:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Lock/unlock a channel (mentor only)
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { channelId, isLocked, reason } = body;

        if (!channelId || isLocked === undefined) {
            return NextResponse.json({ error: 'Channel ID and lock status required' }, { status: 400 });
        }

        // Get channel and verify user is mentor
        const { data: channel } = await supabase
            .from('community_channels')
            .select('*, community:communities(mentor_id)')
            .eq('id', channelId)
            .single();

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
        }

        if (channel.community.mentor_id !== user.id) {
            return NextResponse.json({ error: 'Only mentor can lock/unlock channels' }, { status: 403 });
        }

        // Update channel lock status
        const { error } = await supabase
            .from('community_channels')
            .update({ is_locked: isLocked })
            .eq('id', channelId);

        if (error) throw error;

        // Log moderation action
        await supabase
            .from('community_moderation_logs')
            .insert({
                community_id: channel.community_id,
                mentor_id: user.id,
                action: isLocked ? 'LOCK_CHANNEL' : 'UNLOCK_CHANNEL',
                reason: reason || 'No reason provided',
                metadata: { channel_id: channelId, channel_type: channel.type }
            });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating channel:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
