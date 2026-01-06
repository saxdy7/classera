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

        // Fetch test with related data
        const { data: test, error } = await supabase
            .from('tests')
            .select(`
        *,
        mentor:users!tests_mentor_id_fkey(id, full_name, avatar_url, email),
        community:communities(id, name),
        submissions:test_submissions(
          id,
          student_id,
          score,
          percentage,
          submitted_at,
          student:users(id, full_name, avatar_url)
        ),
        invitations:test_invitations(
          id,
          student_id,
          status,
          invited_at,
          student:users(id, full_name, avatar_url, email)
        )
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Check if user has access
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const isMentor = profile?.role === 'mentor' && test.mentor_id === user.id;
        const isInvited = test.invitations?.some((inv: any) => inv.student_id === user.id);

        if (!isMentor && !isInvited) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // For students, hide mentor-only information
        if (!isMentor) {
            delete test.submissions;
            delete test.invitations;
        }

        return NextResponse.json({ test });
    } catch (error) {
        console.error('Error fetching test:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

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

        const body = await request.json();
        const { action } = body;

        if (action === 'start') {
            // Start test session for student
            const { data: invitation } = await supabase
                .from('test_invitations')
                .select('*')
                .eq('test_id', id)
                .eq('student_id', user.id)
                .single();

            if (!invitation) {
                return NextResponse.json({ error: 'Not invited to this test' }, { status: 403 });
            }

            // Create submission record
            const { data: submission, error } = await supabase
                .from('test_submissions')
                .insert({
                    test_id: id,
                    student_id: user.id,
                    answers: {},
                    started_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({ submission });
        }

        if (action === 'toggle_live') {
            // Toggle is_live status (mentor only)
            const { data: test } = await supabase
                .from('tests')
                .select('is_live, mentor_id')
                .eq('id', id)
                .single();

            if (test?.mentor_id !== user.id) {
                return NextResponse.json({ error: 'Access denied' }, { status: 403 });
            }

            const { data: updated, error } = await supabase
                .from('tests')
                .update({ is_live: !test.is_live })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({ test: updated });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error in test action:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
