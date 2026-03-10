import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const communityId = searchParams.get('id');
        const mentorId = searchParams.get('mentorId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('users')
            .select('university_id')
            .eq('id', user.id)
            .single();

        if (communityId) {
            const { data, error } = await supabase
                .from('communities')
                .select('*, mentor:users!communities_mentor_id_fkey(id, full_name, avatar_url), community_members(count)')
                .eq('id', communityId)
                .single();
            if (error) throw error;
            return NextResponse.json({ community: data });
        }

        let query = supabase
            .from('communities')
            .select('*, mentor:users!communities_mentor_id_fkey(id, full_name, avatar_url), community_members(count)')
            .order('created_at', { ascending: false });

        // Only filter by university when the user has one set
        if (profile?.university_id) {
            query = (query as any).eq('university_id', profile.university_id);
        }

        if (mentorId) query = (query as any).eq('mentor_id', mentorId);

        const { data, error } = await query.range(offset, offset + limit - 1);
        if (error) throw error;
        return NextResponse.json({ communities: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('users')
            .select('role, university_id')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'mentor') {
            return NextResponse.json({ error: 'Only mentors can create communities' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, avatar_url } = body;

        const { data, error } = await supabase
            .from('communities')
            .insert({
                name,
                description,
                avatar_url,
                mentor_id: user.id,
                university_id: profile.university_id,
                is_active: true,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, community: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { communityId, name, description, avatar_url, messaging_enabled } = body;

        const { data, error } = await supabase
            .from('communities')
            .update({
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(avatar_url !== undefined && { avatar_url }),
                ...(messaging_enabled !== undefined && { messaging_enabled }),
            })
            .eq('id', communityId)
            .eq('mentor_id', user.id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, community: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const communityId = searchParams.get('id');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { error } = await supabase
            .from('communities')
            .delete()
            .eq('id', communityId)
            .eq('mentor_id', user.id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
