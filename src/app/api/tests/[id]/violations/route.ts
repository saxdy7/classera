import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/tests/[id]/violations - Log a test violation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: testId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, count, timestamp, student_id } = body;

    // Verify the student_id matches the authenticated user
    if (student_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log violation to test_violations table (or update test_submissions)
    // First check if violations table exists, otherwise update submission directly
    const { data: submission, error: subError } = await supabase
      .from('test_submissions')
      .select('id, violations')
      .eq('test_id', testId)
      .eq('student_id', user.id)
      .eq('status', 'in_progress')
      .single();

    if (submission) {
      // Update existing submission with new violation
      const existingViolations = submission.violations || [];
      const updatedViolations = [...existingViolations, { type, count, timestamp }];

      await supabase
        .from('test_submissions')
        .update({ violations: updatedViolations })
        .eq('id', submission.id);
    }

    // Also try to log to a dedicated violations table if it exists
    try {
      await supabase.from('test_violations').insert({
        test_id: testId,
        student_id: user.id,
        violation_type: type,
        violation_count: count,
        occurred_at: timestamp,
      });
    } catch {
      // Table might not exist, that's okay
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging violation:', error);
    return NextResponse.json(
      { error: 'Failed to log violation' },
      { status: 500 }
    );
  }
}

// GET /api/tests/[id]/violations - Get violations for a test (mentor only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: testId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is mentor and owns the test
    const { data: test, error: testError } = await supabase
      .from('tests')
      .select('mentor_id')
      .eq('id', testId)
      .single();

    if (testError || !test || test.mentor_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all submissions with violations
    const { data: submissions, error } = await supabase
      .from('test_submissions')
      .select(`
        id,
        student_id,
        violations,
        student:users!test_submissions_student_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('test_id', testId)
      .not('violations', 'is', null);

    if (error) {
      throw error;
    }

    // Format violations data
    const violationsSummary = submissions?.map(sub => ({
      student: sub.student,
      violations: sub.violations || [],
      total_violations: (sub.violations || []).length,
    })).filter(v => v.total_violations > 0);

    return NextResponse.json({
      test_id: testId,
      students_with_violations: violationsSummary?.length || 0,
      violations: violationsSummary || [],
    });
  } catch (error) {
    console.error('Error fetching violations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch violations' },
      { status: 500 }
    );
  }
}
