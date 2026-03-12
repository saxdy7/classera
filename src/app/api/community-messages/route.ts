import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET: Fetch messages for a channel
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const channelId = searchParams.get('channelId');
        const parentMessageId = searchParams.get('parentMessageId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!channelId && !parentMessageId) {
            return NextResponse.json({ error: 'Channel ID or Parent Message ID required' }, { status: 400 });
        }

        // Build query
        let query = supabase
            .from('community_messages')
            .select(`
        *,
        sender:users!community_messages_sender_id_fkey(
          id,
          full_name,
          avatar_url,
          role
        ),
        message_reactions(
          id,
          reaction,
          user_id,
          user:users(full_name)
        ),
        message_attachments(*),
        message_read_receipts(count)
      `)
            .eq('is_deleted', false);

        if (parentMessageId) {
            query = query.eq('parent_message_id', parentMessageId);
        } else {
            query = query.eq('channel_id', channelId).is('parent_message_id', null);
        }

        // Fetch messages
        const { data: messages, error } = await query
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
        const { channelId, content, action } = body;

        // Handle different actions
        if (action === 'react') {
            // Add reaction to message
            const { messageId, reaction } = body;

            const { data, error } = await supabase
                .from('message_reactions')
                .insert({
                    message_id: messageId,
                    user_id: user.id,
                    reaction
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    // Already reacted, remove reaction
                    await supabase
                        .from('message_reactions')
                        .delete()
                        .eq('message_id', messageId)
                        .eq('user_id', user.id)
                        .eq('reaction', reaction);

                    return NextResponse.json({ success: true, action: 'removed' });
                }
                throw error;
            }

            return NextResponse.json({ success: true, data, action: 'added' });
        }

        // Send message
        if (!channelId || !content) {
            // For now we still require content, but relax if needed later
            return NextResponse.json({ error: 'Channel ID and content required' }, { status: 400 });
        }

        // Get channel info to check type and lock status
        const { data: channel, error: channelError } = await supabase
            .from('community_channels')
            .select('*')
            .eq('id', channelId)
            .single();

        if (channelError || !channel) {
            console.error('Channel lookup error:', channelError, 'channelId:', channelId);
            return NextResponse.json({
                error: `Channel not found. Debug: channelId=${channelId}, error=${channelError?.message || 'null'}, code=${channelError?.code || 'null'}`
            }, { status: 404 });
        }

        // Get community to check limits
        const { data: community, error: commError } = await supabase
            .from('communities')
            .select('mentor_id, messaging_enabled')
            .eq('id', channel.community_id)
            .single();

        if (commError || !community) {
            return NextResponse.json({ error: 'Community not found' }, { status: 404 });
        }

        // Check if channel is locked
        if (channel.is_locked) {
            return NextResponse.json({ error: 'Channel is locked' }, { status: 403 });
        }

        // Check if messaging is enabled
        if (community.messaging_enabled === false && user.id !== community.mentor_id) {
            return NextResponse.json({ error: 'Messaging is disabled for this community' }, { status: 403 });
        }

        // Check if user is muted
        const { data: muteStatus } = await supabase
            .from('community_muted_users')
            .select('*')
            .eq('community_id', channel.community_id)
            .eq('user_id', user.id)
            .maybeSingle();

        if (muteStatus) {
            // Check if mute is still active
            if (!muteStatus.muted_until || new Date(muteStatus.muted_until) > new Date()) {
                return NextResponse.json({ error: 'You are muted in this community' }, { status: 403 });
            }
        }

        // Insert message
        const { data: message, error } = await supabase
            .from('community_messages')
            .insert({
                channel_id: channelId,
                sender_id: user.id,
                content,
                parent_message_id: body.parentMessageId || null
            })
            .select()
            .single();

        // Fetch the message with the sender info since the UI expects it
        const { data: populatedMessage, error: fetchError } = await supabase
            .from('community_messages')
            .select(`
                *,
                sender:users!community_messages_sender_id_fkey(
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

        return NextResponse.json({ success: true, message: populatedMessage });
    } catch (error: any) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Delete a message (mentor only)
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messageId, reason, content, action } = await request.json();

        if (!messageId) {
            return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
        }

        // Get message to check permissions and time
        const { data: message, error: msgError } = await supabase
            .from('community_messages')
            .select('*')
            .eq('id', messageId)
            .single();

        if (msgError || !message) {
            return NextResponse.json({ error: 'Message not found or lookup failed' }, { status: 404 });
        }

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

        if (action === 'edit') {
            if (message.sender_id !== user.id) {
                return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 });
            }

            // Check 5-minute window
            const created = new Date(message.created_at);
            const now = new Date();
            const diff = (now.getTime() - created.getTime()) / 1000 / 60; // minutes

            if (diff > 5) {
                return NextResponse.json({ error: 'Edit window (5 min) expired' }, { status: 400 });
            }

            // Save history
            await supabase.from('message_edit_history').insert({
                message_id: messageId,
                old_content: message.content
            });

            const { error } = await supabase
                .from('community_messages')
                .update({
                    content,
                    edited_at: new Date().toISOString()
                })
                .eq('id', messageId);

            if (error) throw error;
            return NextResponse.json({ success: true });

        } else {
            // Default to Delete (soft delete)
            const isMentor = mentorId === user.id;

            if (!isMentor) {
                return NextResponse.json({ error: 'Only mentors can delete messages' }, { status: 403 });
            }

            const { error } = await supabase
                .from('community_messages')
                .update({
                    is_deleted: true,
                    deleted_by: user.id,
                    deleted_at: new Date().toISOString()
                    // We could store reason in a separate audit log if needed
                })
                .eq('id', messageId);

            if (error) throw error;

            // Log moderation action
            await supabase
                .from('community_moderation_logs')
                .insert({
                    community_id: channel?.community_id || null,
                    action_type: 'delete_message',
                    performed_by: user.id,
                    target_id: messageId,
                    reason: reason || 'Mentor deletion'
                });

            return NextResponse.json({ success: true });
        }

    } catch (error: any) {
        console.error('Error updating message:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
