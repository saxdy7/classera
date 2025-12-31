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

        // Get user's university
        const { data: profile } = await supabase
            .from('users')
            .select('university_id')
            .eq('id', user.id)
            .single();

        if (communityId) {
            // Get students from same university who are NOT already members
            const { data: existingMembers } = await supabase
                .from('community_members')
                .select('student_id')
                .eq('community_id', communityId);

            const existingMemberIds = existingMembers?.map(m => m.student_id) || [];

            let query = supabase
                .from('users')
                .select('id, full_name, email, avatar_url, degree_type, specialization_board')
                .eq('role', 'student')
                .eq('university_id', profile?.university_id);

            if (existingMemberIds.length > 0) {
                query = query.not('id', 'in', `(${existingMemberIds.join(',')})`);
            }

            const { data, error } = await query.order('full_name');

            if (error) throw error;
            return NextResponse.json({ students: data });
        }

        // Get all students from same university
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, avatar_url, degree_type, specialization_board')
            .eq('role', 'student')
            .eq('university_id', profile?.university_id)
            .order('full_name');

        if (error) throw error;
        return NextResponse.json({ students: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
