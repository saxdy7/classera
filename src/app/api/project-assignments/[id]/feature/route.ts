import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * PATCH /api/project-assignments/[id]/feature
 * Body: { featured: boolean }
 * Student-only: opt a graded project in/out of their public portfolio.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: assignmentId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as { featured: boolean };
    if (typeof body.featured !== 'boolean') {
      return NextResponse.json({ error: 'featured (boolean) required' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: submission } = await admin
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .single();

    if (!submission) {
      return NextResponse.json({ error: 'No submission found for this assignment' }, { status: 404 });
    }

    const { data: evaluation, error } = await admin
      .from('project_evaluations')
      .update({ featured_on_portfolio: body.featured })
      .eq('submission_id', submission.id)
      .eq('student_id', user.id)
      .select('featured_on_portfolio')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!evaluation) return NextResponse.json({ error: 'This project has not been graded yet' }, { status: 404 });

    return NextResponse.json({ featured_on_portfolio: evaluation.featured_on_portfolio });
  } catch (err) {
    console.error('Feature toggle error:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
