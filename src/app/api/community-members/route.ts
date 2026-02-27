import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const communityId = searchParams.get('communityId');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (communityId) {
            // Get members for a specific community
            const { data, error } = await supabase
                .from('community_members')
                .select(`
                  *,
                  users(id, full_name, email, avatar_url)
                `)
                .eq('community_id', communityId)
                .order('joined_at', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ members: data });
        } else {
            // Get user's own community memberships
            const { data, error } = await supabase
                .from('community_members')
                .select(`
                  *,
                  community:communities(
                    id, name, description, avatar_url, is_public,
                    creator:users!communities_created_by_fkey(id, full_name, avatar_url)
                  )
                `)
                .eq('user_id', user.id)
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
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { communityId, action } = body;

        if (action === 'join') {
            const { data, error } = await supabase
                .from('community_members')
                .insert({ community_id: communityId, user_id: user.id, role: 'member' })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') return NextResponse.json({ error: 'Already a member' }, { status: 400 });
                throw error;
            }
            return NextResponse.json({ success: true, data });
        }

        if (action === 'leave') {
            const { error } = await supabase
                .from('community_members')
                .delete()
                .eq('community_id', communityId)
                .eq('user_id', user.id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'add-direct') {
            const { studentId } = body;
            const { data: community } = await supabase
                .from('communities')
                .select('created_by, name')
                .eq('id', communityId)
                .single();

            if (!community || community.created_by !== user.id) {
                return NextResponse.json({ error: 'Only community creator can add members' }, { status: 403 });
            }

            const { data, error } = await supabase
                .from('community_members')
                .insert({ community_id: communityId, user_id: studentId, role: 'member' })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') return NextResponse.json({ error: 'Already a member' }, { status: 400 });
                throw error;
            }
            return NextResponse.json({ success: true, data });
        }

        if (action === 'remove') {
            const { memberId } = body;
            const { error } = await supabase
                .from('community_members')
                .delete()
                .eq('id', memberId);
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
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
