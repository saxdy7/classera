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

        // Get caller's profile
        const { data: profile } = await admin
            .from('users')
            .select('university_id, role')
            .eq('id', user.id)
            .single();

        if (communityId) {
            // Exclude students who are already APPROVED members
            const { data: existingMembers } = await admin
                .from('community_members')
                .select('student_id')
                .eq('community_id', communityId)
                .eq('status', 'approved');

            const existingMemberIds = existingMembers?.map(m => (m as { student_id: string }).student_id) || [];

            // Fetch ALL students — mentors should be able to add any student
            // regardless of university so they can build cross-university communities
            let query = admin
                .from('users')
                .select('id, full_name, email, avatar_url, degree_type, specialization_board')
                .eq('role', 'student')
                .not('full_name', 'is', null);

            if (existingMemberIds.length > 0) {
                query = query.not('id', 'in', `(${existingMemberIds.join(',')})`);
            }

            const { data, error } = await query.order('full_name');
            if (error) throw error;
            return NextResponse.json({ students: data });
        }


        // No communityId — return ALL students regardless of university
        // so mentors can invite any student to their tests.
        const { data, error } = await admin
            .from('users')
            .select('id, full_name, email, avatar_url, degree_type, specialization_board')
            .eq('role', 'student')
            .not('full_name', 'is', null)
            .order('full_name');
        if (error) throw error;
        return NextResponse.json({ students: data });
    } catch (error: any) {
        console.error('Error in GET /api/students:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
