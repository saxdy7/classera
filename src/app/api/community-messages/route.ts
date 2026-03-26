import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Fetch messages for a channel
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const channelId = searchParams.get('channelId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!channelId) {
            return NextResponse.json({ error: 'Channel ID required' }, { status: 400 });
        }

        // Get channel and community info
        const { data: channel } = await supabase
            .from('community_channels')
            .select('community_id')
            .eq('id', channelId)
            .single();

        if (!channel) {
            return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
        }

        // Verify user is member or mentor of the community
        const { data: community } = await supabase
            .from('communities')
            .select('mentor_id')
            .eq('id', channel.community_id)
            .single();

        if (!community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        const isMentor = community.mentor_id === user.id;
        if (!isMentor) {
            const { data: membership } = await supabase
                .from('community_members')
                .select('status')
                .eq('community_id', channel.community_id)
                .eq('student_id', user.id)
                .single();

            if (!membership || membership.status !== 'approved') {
                return NextResponse.json({ error: 'You are not a member of this community' }, { status: 403 });
            }
        }

        // Fetch messages for the channel
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
                    avatar_url,
                    role
                )
            `)
            .eq('channel_id', channelId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({ messages: messages || [] });
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Send a new message
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { channelId, content } = body;

        // Validate input
        if (!channelId || !content) {
            return NextResponse.json({ error: 'Channel ID and content required' }, { status: 400 });
        }

        // Get channel info to verify it exists
        const { data: channel, error: channelError } = await supabase
            .from('community_channels')
            .select('community_id, is_locked')
            .eq('id', channelId)
            .single();

        if (channelError || !channel) {
            console.error('Channel lookup error:', channelError, 'channelId:', channelId);
            return NextResponse.json({
                error: 'Channel not found'
            }, { status: 404 });
        }

        // Check if channel is locked
        if (channel.is_locked) {
            return NextResponse.json({ error: 'Channel is locked' }, { status: 403 });
        }

        // Get community info
        const { data: community, error: commError } = await supabase
            .from('communities')
            .select('mentor_id, messaging_enabled')
            .eq('id', channel.community_id)
            .single();

        if (commError || !community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        // Check if messaging is enabled (exception for mentor)
        if (community.messaging_enabled === false && user.id !== community.mentor_id) {
            return NextResponse.json({ error: 'Messaging is disabled for this community' }, { status: 403 });
        }

        // Insert message
        const { data: message, error } = await supabase
            .from('community_messages')
            .insert({
                channel_id: channelId,
                user_id: user.id,
                content
            })
            .select()
            .single();

        if (error || !message) {
            throw error || new Error('Failed to insert message');
        }

        // Fetch the message with sender info
        const { data: populatedMessage, error: fetchError } = await supabase
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
                    avatar_url,
                    role
                )
            `)
            .eq('id', message.id)
            .single();

        if (fetchError) {
            console.error('Fetch inserted message error:', fetchError);
            throw fetchError;
        }

        // Process mentions in the message content (if RPC exists)
        try {
            await supabase.rpc('process_mentions', {
                p_content: content,
                p_message_id: message.id,
                p_mentioned_by: user.id
            });
        } catch (mentionError) {
            console.warn('Mention processing failed (may not be set up):', mentionError);
            // Don't fail the whole request if mentions aren't set up
        }

        return NextResponse.json({ success: true, message: populatedMessage });
    } catch (error: any) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Delete a message
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const messageId = searchParams.get('messageId');
        const reason = searchParams.get('reason');

        if (!messageId) {
            return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
        }

        // Get message to check permissions
        const { data: message, error: msgError } = await supabase
            .from('community_messages')
            .select('*')
            .eq('id', messageId)
            .single();

        if (msgError || !message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        // Get community mentor info
        const { data: channel } = await supabase
            .from('community_channels')
            .select('community_id')
            .eq('id', message.channel_id)
            .single();

        let mentorId = null;
        if (channel?.community_id) {
            const { data: community } = await supabase
                .from('communities')
                .select('mentor_id')
                .eq('id', channel.community_id)
                .single();
            mentorId = community?.mentor_id;
        }

        // Check permissions: user can delete their own messages, mentors can delete any message
        const isMentor = mentorId === user.id;
        const isAuthor = message.user_id === user.id;

        if (!isMentor && !isAuthor) {
            return NextResponse.json({ error: 'Only message author or mentors can delete messages' }, { status: 403 });
        }

        // Delete the message permanently
        const { error: deleteError } = await supabase
            .from('community_messages')
            .delete()
            .eq('id', messageId);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting message:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
