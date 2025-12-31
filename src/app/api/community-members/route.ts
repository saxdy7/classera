import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const communityId = searchParams.get('communityId');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (communityId) {
            // Get specific community with members
            const { data, error } = await supabase
                .from('community_members')
                .select(`
          *,
          student:users!community_members_student_id_fkey(
            id,
            full_name,
            email,
            avatar_url,
            degree_type,
            specialization_board
          )
        `)
                .eq('community_id', communityId)
                .order('joined_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ members: data });
        } else {
            // Get user's community memberships
            const { data, error } = await supabase
                .from('community_members')
                .select(`
          *,
          community:communities(
            id,
            name,
            description,
            avatar_url,
            is_active,
            mentor:users!communities_mentor_id_fkey(
              id,
              full_name,
              avatar_url
            )
          )
        `)
                .eq('student_id', user.id)
                .order('joined_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ memberships: data });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { communityId, action } = body;

        if (action === 'join') {
            // Student joins community (pending approval)
            const { data, error } = await supabase
                .from('community_members')
                .insert({
                    community_id: communityId,
                    student_id: user.id,
                    status: 'pending'
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    return NextResponse.json({ error: 'Already requested to join' }, { status: 400 });
                }
                throw error;
            }

            // Create notification for mentor
            const { data: community } = await supabase
                .from('communities')
                .select('mentor_id, name')
                .eq('id', communityId)
                .single();

            if (community) {
                await supabase.from('notifications').insert({
                    user_id: community.mentor_id,
                    type: 'community_invite',
                    title: 'New Join Request',
                    message: `A student requested to join ${community.name}`,
                    related_id: communityId,
                    related_type: 'community',
                    action_url: `/dashboard/mentor/communities/${communityId}`
                });
            }

            return NextResponse.json({ success: true, data });
        }

        if (action === 'add-direct') {
            // Mentor directly adds student (approved status)
            const { studentId } = body;

            // Verify user is the community mentor
            const { data: community } = await supabase
                .from('communities')
                .select('mentor_id, name')
                .eq('id', communityId)
                .single();

            if (!community || community.mentor_id !== user.id) {
                return NextResponse.json({ error: 'Only community mentor can add students' }, { status: 403 });
            }

            const { data, error } = await supabase
                .from('community_members')
                .insert({
                    community_id: communityId,
                    student_id: studentId,
                    status: 'approved'
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    return NextResponse.json({ error: 'Student is already a member' }, { status: 400 });
                }
                throw error;
            }

            // Notify student
            await supabase.from('notifications').insert({
                user_id: studentId,
                type: 'community_accepted',
                title: 'Added to Community',
                message: `You have been added to ${community.name}`,
                related_id: communityId,
                related_type: 'community',
                action_url: `/dashboard/student/communities`
            });

            return NextResponse.json({ success: true, data });
        }

        if (action === 'approve' || action === 'reject') {
            // Mentor approves/rejects member
            const { memberId } = body;

            const { data, error } = await supabase
                .from('community_members')
                .update({ status: action === 'approve' ? 'approved' : 'rejected' })
                .eq('id', memberId)
                .select()
                .single();

            if (error) throw error;

            // Notify student
            if (data) {
                await supabase.from('notifications').insert({
                    user_id: data.student_id,
                    type: 'community_accepted',
                    title: action === 'approve' ? 'Join Request Approved' : 'Join Request Rejected',
                    message: `Your request to join the community has been ${action === 'approve' ? 'approved' : 'rejected'}`,
                    related_id: data.community_id,
                    related_type: 'community',
                    action_url: `/dashboard/student/communities`
                });
            }

            return NextResponse.json({ success: true, data });
        }

        if (action === 'leave') {
            // Student leaves community
            const { error } = await supabase
                .from('community_members')
                .delete()
                .eq('community_id', communityId)
                .eq('student_id', user.id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const memberId = searchParams.get('memberId');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Remove member (mentor only)
        const { error } = await supabase
            .from('community_members')
            .delete()
            .eq('id', memberId);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
