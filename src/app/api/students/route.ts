import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        // Auth check via user client
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const communityId = searchParams.get('communityId');

        // Use admin client to avoid RLS infinite recursion on users table
        // (the users RLS policy does a self-referencing subquery on users)
        const admin = createAdminClient();

        // Get caller's university_id
        const { data: profile } = await admin
            .from('users')
            .select('university_id')
            .eq('id', user.id)
            .single();

        if (!profile?.university_id) {
            return NextResponse.json({ students: [] });
        }

        if (communityId) {
            // Exclude students already in the community (real column: student_id)
            const { data: existingMembers } = await admin
                .from('community_members')
                .select('student_id')
                .eq('community_id', communityId);

            const existingMemberIds = existingMembers?.map(m => (m as any).student_id) || [];

            let query = admin
                .from('users')
                .select('id, full_name, email, avatar_url, degree_type, specialization_board')
                .eq('role', 'student')
                .eq('university_id', profile.university_id);

            if (existingMemberIds.length > 0) {
                query = query.not('id', 'in', `(${existingMemberIds.join(',')})`);
            }

            const { data, error } = await query.order('full_name');
            if (error) throw error;
            return NextResponse.json({ students: data });
        }

        // Get all students from same university
        const { data, error } = await admin
            .from('users')
            .select('id, full_name, email, avatar_url, degree_type, specialization_board')
            .eq('role', 'student')
            .eq('university_id', profile.university_id)
            .order('full_name');

        if (error) throw error;
        return NextResponse.json({ students: data });
    } catch (error: any) {
        console.error('Error in GET /api/students:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
