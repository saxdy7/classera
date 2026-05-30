import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/tests/diagnostics?test_id=xxx&student_id=xxx
 * Diagnostic endpoint to verify test and invitation data
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('test_id');
    const studentId = searchParams.get('student_id');

    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      testId,
      studentId,
    };

    // 1. Check if test exists
    if (testId) {
      const { data: test, error: testError } = await admin
        .from('tests')
        .select('id, title, is_live, mentor_id')
        .eq('id', testId)
        .single();

      diagnostics.test = {
        exists: !!test,
        isLive: test?.is_live,
        mentorId: test?.mentor_id,
        error: testError?.message,
      };
    }

    // 2. Check test_invitations for this test
    if (testId) {
      const { data: invitations, error: invError } = await admin
        .from('test_invitations')
        .select('id, test_id, student_id, status, invited_at, invited_by')
        .eq('test_id', testId);

      diagnostics.allInvitations = {
        count: invitations?.length || 0,
        records: invitations,
        error: invError?.message,
      };
    }

    // 3. Check specific student's invitation
    if (testId && studentId) {
      const { data: invitation, error: invError } = await admin
        .from('test_invitations')
        .select('*')
        .eq('test_id', testId)
        .eq('student_id', studentId)
        .single();

      diagnostics.studentInvitation = {
        exists: !!invitation,
        status: invitation?.status,
        invitedAt: invitation?.invited_at,
        invitedBy: invitation?.invited_by,
        error: invError?.message,
      };
    }

    // 4. Check if student has already submitted
    if (testId && studentId) {
      const { data: submission, error: subError } = await admin
        .from('test_submissions')
        .select('id, submitted_at')
        .eq('test_id', testId)
        .eq('student_id', studentId)
        .single();

      diagnostics.submission = {
        exists: !!submission,
        submittedAt: submission?.submitted_at,
        error: subError?.message,
      };
    }

    // 5. Check active session
    if (testId && studentId) {
      const { data: session, error: sesError } = await admin
        .from('test_sessions')
        .select('id, is_active, expires_at')
        .eq('test_id', testId)
        .eq('student_id', studentId)
        .eq('is_active', true)
        .single();

      diagnostics.activeSession = {
        exists: !!session,
        expiresAt: session?.expires_at,
        error: sesError?.message,
      };
    }

    return NextResponse.json(diagnostics);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
