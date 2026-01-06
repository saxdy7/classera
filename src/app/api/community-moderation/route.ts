import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST: Execute moderation action
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { communityId, action, targetUserId, duration, reason, reportId, deleteContent, postId, commentId } = body;

        if (!communityId && !reportId) {
            return NextResponse.json({ error: 'Community ID or Report ID required' }, { status: 400 });
        }

        if (!action) {
            return NextResponse.json({ error: 'Action required' }, { status: 400 });
        }

        // Verify user is mentor of this community
        let community;
        if (communityId) {
            const { data } = await supabase
                .from('communities')
                .select('mentor_id')
                .eq('id', communityId)
                .single();
            community = data;
        } else if (reportId) {
            const { data: report } = await supabase
                .from('community_reports')
                .select('community_id, communities!inner(mentor_id)')
                .eq('id', reportId)
                .single();

            if (report) {
                community = { mentor_id: report.communities?.[0]?.mentor_id };
            }
        }

        if (!community || community.mentor_id !== user.id) {
            return NextResponse.json({ error: 'Only community mentor can perform moderation' }, { status: 403 });
        }

        let result;

        switch (action) {
            case 'resolve':
                if (!reportId) {
                    return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
                }

                // Delete content if requested
                if (deleteContent) {
                    if (postId) {
                        await supabase.from('community_posts').delete().eq('id', postId);
                    } else if (commentId) {
                        await supabase.from('community_comments').delete().eq('id', commentId);
                    }
                }

                // Update report status
                await supabase
                    .from('community_reports')
                    .update({
                        status: 'resolved',
                        resolved_at: new Date().toISOString(),
                        resolved_by: user.id,
                    })
                    .eq('id', reportId);

                result = { success: true, action: 'resolved' };
                break;

            case 'dismiss':
                if (!reportId) {
                    return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
                }

                await supabase
                    .from('community_reports')
                    .update({
                        status: 'dismissed',
                        resolved_at: new Date().toISOString(),
                        resolved_by: user.id,
                    })
                    .eq('id', reportId);

                result = { success: true, action: 'dismissed' };
                break;

            case 'MUTE_USER':
                if (!targetUserId) {
                    return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
                }

                // Calculate mute expiry
                let mutedUntil = null;
                if (duration) {
                    const now = new Date();
                    if (duration === '24h') {
                        mutedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                    } else if (duration === '7d') {
                        mutedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    } else if (duration === '30d') {
                        mutedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    }
                    // If duration is 'permanent' or null, mutedUntil stays null
                }

                // Insert or update mute status
                const { error: muteError } = await supabase
                    .from('community_muted_users')
                    .upsert({
                        community_id: communityId,
                        user_id: targetUserId,
                        muted_by: user.id,
                        muted_until: mutedUntil?.toISOString(),
                        reason: reason || 'No reason provided'
                    });

                if (muteError) throw muteError;

                // Also update community_members table
                await supabase
                    .from('community_members')
                    .update({ is_muted: true })
                    .eq('community_id', communityId)
                    .eq('student_id', targetUserId);

                result = { success: true, mutedUntil };
                break;

            case 'UNMUTE_USER':
                if (!targetUserId) {
                    return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
                }

                // Remove mute status
                await supabase
                    .from('community_muted_users')
                    .delete()
                    .eq('community_id', communityId)
                    .eq('user_id', targetUserId);

                // Update community_members table
                await supabase
                    .from('community_members')
                    .update({ is_muted: false })
                    .eq('community_id', communityId)
                    .eq('student_id', targetUserId);

                result = { success: true };
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Log moderation action
        await supabase
            .from('community_moderation_logs')
            .insert({
                community_id: communityId,
                mentor_id: user.id,
                action,
                target_user_id: targetUserId,
                reason: reason || 'No reason provided',
                metadata: { duration }
            });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error executing moderation action:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Fetch moderation logs
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const communityId = searchParams.get('communityId');
        const limit = parseInt(searchParams.get('limit') || '50');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!communityId) {
            return NextResponse.json({ error: 'Community ID required' }, { status: 400 });
        }

        // Verify user is mentor
        const { data: community } = await supabase
            .from('communities')
            .select('mentor_id')
            .eq('id', communityId)
            .single();

        if (!community || community.mentor_id !== user.id) {
            return NextResponse.json({ error: 'Only mentor can view logs' }, { status: 403 });
        }

        // Fetch logs
        const { data: logs, error } = await supabase
            .from('community_moderation_logs')
            .select(`
        *,
        mentor:users!community_moderation_logs_mentor_id_fkey(full_name),
        target_user:users!community_moderation_logs_target_user_id_fkey(full_name)
      `)
            .eq('community_id', communityId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return NextResponse.json({ logs: logs || [] });
    } catch (error: any) {
        console.error('Error fetching moderation logs:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
