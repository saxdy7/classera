import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's university
        const { data: profile } = await supabase
            .from('users')
            .select('university_id, role')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Get all mentors from same university
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, avatar_url, role, specialization_board')
            .eq('role', 'mentor')
            .eq('university_id', profile.university_id)
            .order('full_name');

        if (error) throw error;
        return NextResponse.json({ mentors: data });
    } catch (error: any) {
        console.error('Error fetching mentors:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
