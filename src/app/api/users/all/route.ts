import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Authenticate with the user's session
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = createAdminClient();

        // Get current user's university_id
        const { data: profile, error: profileError } = await admin
            .from('users')
            .select('university_id')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('[users/all] profile fetch error:', profileError);
        }

        console.log('[users/all] user:', user.id, '| university_id:', profile?.university_id);

        // Build query — admin client bypasses RLS
        let query = admin
            .from('users')
            .select('id, full_name, email, avatar_url, role, specialization_board')
            .neq('id', user.id)
            .in('role', ['student', 'mentor'])
            .order('role')
            .order('full_name');

        if (profile?.university_id) {
            query = (query as any).eq('university_id', profile.university_id);
        }

        const { data, error } = await query;

        if (error) {
            console.error('[users/all] query error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('[users/all] returning', data?.length ?? 0, 'users');
        return NextResponse.json({ users: data || [] });
    } catch (error: any) {
        console.error('[users/all] unexpected error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

