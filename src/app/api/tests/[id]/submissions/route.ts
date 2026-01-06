import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify test belongs to this mentor
        const { data: test } = await supabase
            .from('tests')
            .select('id, mentor_id')
            .eq('id', id)
            .eq('mentor_id', user.id)
            .single();

        if (!test) {
            return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        // Get all submissions with student info
        const { data: submissions, error } = await supabase
            .from('test_submissions')
            .select(`
                id,
                student_id,
                answers,
                score,
                percentage,
                status,
                started_at,
                submitted_at,
                manual_grades,
                ai_analysis,
                student:users(id, full_name, email, avatar_url)
            `)
            .eq('test_id', id)
            .order('submitted_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ submissions: submissions || [] });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
