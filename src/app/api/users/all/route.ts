import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current user's university and role
        const { data: profile } = await supabase
            .from('users')
            .select('university_id, role')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Get all users (students AND mentors) from same university, excluding current user
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, avatar_url, role, degree_type, specialization_board')
            .eq('university_id', profile.university_id)
            .neq('id', user.id) // Exclude current user
            .in('role', ['student', 'mentor']) // Only students and mentors
            .order('role') // Show mentors first
            .order('full_name');

        if (error) {
            console.error('Error fetching users:', error);
            throw error;
        }

        return NextResponse.json({ users: data || [] });
    } catch (error: any) {
        console.error('Error in /api/users/all:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
