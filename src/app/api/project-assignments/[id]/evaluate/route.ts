import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/project-assignments/[id]/evaluate
 * Body: { submission_id, score?, feedback?, comment? }
 * Mentor saves/updates evaluation for a student's submission.
 *
 * GET /api/project-assignments/[id]/evaluate?submission_id=...
 * Returns existing evaluation for a submission.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: assignmentId } = await params;
  const submissionId = request.nextUrl.searchParams.get('submission_id');

  if (!submissionId) {
    return NextResponse.json({ error: 'submission_id required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: evaluation } = await admin
      .from('project_evaluations')
      .select('*')
      .eq('submission_id', submissionId)
      .eq('assignment_id', assignmentId)
      .single();

    return NextResponse.json({ evaluation: evaluation ?? null });
  } catch (err) {
    console.error('Evaluate GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch evaluation' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: assignmentId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // Verify caller is the assignment mentor
    const { data: assignment } = await admin
      .from('project_assignments')
      .select('mentor_id')
      .eq('id', assignmentId)
      .single();

    if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    if (assignment.mentor_id !== user.id) {
      return NextResponse.json({ error: 'Only the assignment mentor can evaluate' }, { status: 403 });
    }

    const body = await request.json() as {
      submission_id: string;
      student_id: string;
      score?: number;
      feedback?: string;
      comment?: string;
    };

    const { submission_id, student_id, score, feedback, comment } = body;
    if (!submission_id || !student_id) {
      return NextResponse.json({ error: 'submission_id and student_id required' }, { status: 400 });
    }

    // Get existing evaluation to append comments
    const { data: existing } = await admin
      .from('project_evaluations')
      .select('comments')
      .eq('submission_id', submission_id)
      .single();

    const existingComments: Array<{ text: string; created_at: string }> =
      (existing?.comments as Array<{ text: string; created_at: string }>) ?? [];

    const newComments = comment?.trim()
      ? [...existingComments, { text: comment.trim(), created_at: new Date().toISOString() }]
      : existingComments;

    const { data: evaluation, error } = await admin
      .from('project_evaluations')
      .upsert(
        {
          submission_id,
          assignment_id: assignmentId,
          mentor_id: user.id,
          student_id,
          ...(score !== undefined && { score }),
          ...(feedback !== undefined && { feedback }),
          comments: newComments,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'submission_id' },
      )
      .select()
      .single();

    if (error) throw error;

    // Update submission status to reviewed/graded
    const newStatus = score !== undefined ? 'graded' : 'reviewed';
    await admin
      .from('assignment_submissions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', submission_id);

    return NextResponse.json({ evaluation });
  } catch (err) {
    console.error('Evaluate POST error:', err);
    return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 });
  }
}
