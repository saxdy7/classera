import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST - Start taking a test
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { id: testId } = await params;

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if student is invited to this test
        const { data: invitation } = await supabase
            .from('test_invitations')
            .select('*')
            .eq('test_id', testId)
            .eq('student_id', user.id)
            .single();

        if (!invitation) {
            return NextResponse.json({ error: 'You are not invited to this test' }, { status: 403 });
        }

        // Check if already submitted
        const { data: existingSubmission } = await supabase
            .from('test_submissions')
            .select('id')
            .eq('test_id', testId)
            .eq('student_id', user.id)
            .single();

        if (existingSubmission) {
            return NextResponse.json({ error: 'You have already submitted this test' }, { status: 400 });
        }

        // Get test details
        const { data: test, error: testError } = await supabase
            .from('tests')
            .select('*')
            .eq('id', testId)
            .single();

        if (testError || !test) {
            return NextResponse.json({ error: 'Test not found' }, { status: 404 });
        }

        // Check if test is live
        if (!test.is_live) {
            return NextResponse.json({ error: 'This test is not available yet' }, { status: 400 });
        }

        // Mark invitation as accepted/in-progress
        // Note: DB constraint allows 'pending','accepted','declined' only
        await supabase
            .from('test_invitations')
            .update({ status: 'accepted' })
            .eq('test_id', testId)
            .eq('student_id', user.id);

        // Calculate end time
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + test.duration_minutes * 60 * 1000);

        return NextResponse.json({
            test: {
                id: test.id,
                title: test.title,
                description: test.description,
                duration_minutes: test.duration_minutes,
                total_marks: test.total_marks,
                questions: test.questions,
                question_type: test.question_type,
                enable_screen_recording: test.enable_screen_recording,
                enable_face_monitoring: test.enable_face_monitoring
            },
            session: {
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                remaining_seconds: test.duration_minutes * 60
            }
        });

    } catch (error: any) {
        console.error('Error starting test:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// GET - Get test status for student
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const { id: testId } = await params;

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get test and invitation status
        const { data: test } = await supabase
            .from('tests')
            .select('*')
            .eq('id', testId)
            .single();

        const { data: invitation } = await supabase
            .from('test_invitations')
            .select('*')
            .eq('test_id', testId)
            .eq('student_id', user.id)
            .single();

        const { data: submission } = await supabase
            .from('test_submissions')
            .select('*')
            .eq('test_id', testId)
            .eq('student_id', user.id)
            .single();

        return NextResponse.json({
            test,
            invitation,
            submission,
            can_start: invitation && !submission && test?.is_live,
            status: submission ? 'completed' : invitation?.status || 'not_invited'
        });

    } catch (error: any) {
        console.error('Error fetching test status:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
