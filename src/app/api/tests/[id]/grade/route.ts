import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
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

        const body = await request.json();
        const { submission_id, manual_grades, total_score, percentage } = body;

        if (!submission_id) {
            return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
        }

        // Update submission with manual grades
        const { data: submission, error } = await supabase
            .from('test_submissions')
            .update({
                manual_grades,
                score: total_score,
                percentage,
                graded_by: user.id,
                graded_at: new Date().toISOString(),
            })
            .eq('id', submission_id)
            .eq('test_id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ submission });
    } catch (error) {
        console.error('Error saving grades:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
