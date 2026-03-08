import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const communityId = searchParams.get('communityId');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Use admin client to bypass RLS recursive policy on users table
        const admin = createAdminClient();

        if (communityId) {
            // Get members for a specific community with user details
            // Real schema: community_members.student_id (FK → users.id)
            const { data, error } = await admin
                .from('community_members')
                .select(`
                  *,
                  student:users(id, full_name, email, avatar_url, degree_type, specialization_board)
                `)
                .eq('community_id', communityId)
                .order('joined_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ members: data });
        } else {
            // Get user's own community memberships (student viewpoint)
            const { data, error } = await admin
                .from('community_members')
                .select(`
                  *,
                  community:communities(id, name, description, avatar_url, is_active)
                `)
                .eq('student_id', user.id)
                .order('joined_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ memberships: data });
        }
    } catch (error: any) {
        console.error('Error in GET /api/community-members:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { communityId, action } = body;

        // Use admin client for all writes to bypass RLS restrictions
        const admin = createAdminClient();

        if (action === 'join') {
            // Real schema: student_id + status (pending/approved/rejected)
            const { data, error } = await admin
                .from('community_members')
                .insert({ community_id: communityId, student_id: user.id, status: 'pending' })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') return NextResponse.json({ error: 'Already a member' }, { status: 400 });
                throw error;
            }
            return NextResponse.json({ success: true, data });
        }

        if (action === 'leave') {
            const { error } = await admin
                .from('community_members')
                .delete()
                .eq('community_id', communityId)
                .eq('student_id', user.id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'add-direct') {
            const { studentId } = body;
            // Verify caller is the community mentor (real column: mentor_id)
            const { data: community } = await admin
                .from('communities')
                .select('mentor_id')
                .eq('id', communityId)
                .single();

            if (!community || community.mentor_id !== user.id) {
                return NextResponse.json({ error: 'Only community mentor can add members' }, { status: 403 });
            }

            const { data, error } = await admin
                .from('community_members')
                .insert({ community_id: communityId, student_id: studentId, status: 'approved' })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') return NextResponse.json({ error: 'Already a member' }, { status: 400 });
                throw error;
            }
            return NextResponse.json({ success: true, data });
        }

        if (action === 'approve') {
            const { memberId } = body;
            const { error } = await admin
                .from('community_members')
                .update({ status: 'approved' })
                .eq('id', memberId);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'reject') {
            const { memberId } = body;
            const { error } = await admin
                .from('community_members')
                .update({ status: 'rejected' })
                .eq('id', memberId);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'remove') {
            const { memberId } = body;
            const { error } = await admin
                .from('community_members')
                .delete()
                .eq('id', memberId);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Error in POST /api/community-members:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const memberId = searchParams.get('memberId');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const admin = createAdminClient();
        const { error } = await admin
            .from('community_members')
            .delete()
            .eq('id', memberId);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in DELETE /api/community-members:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
