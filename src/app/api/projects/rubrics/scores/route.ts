import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** POST /api/projects/rubrics/scores
 *  Body: { submission_id, rubric_id, scores: [{ criterion_id, score, comment }] }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as {
      submission_id: string;
      rubric_id: string;
      scores: Array<{ criterion_id: string; score: number; comment?: string }>;
    };
    const { submission_id, rubric_id, scores } = body;

    if (!submission_id || !rubric_id || !Array.isArray(scores)) {
      return NextResponse.json({ error: 'submission_id, rubric_id, and scores required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify the calling user is the mentor for this submission
    const { data: submission } = await admin
      .from('assignment_submissions')
      .select('assignment:project_assignments(mentor_id)')
      .eq('id', submission_id)
      .single();

    const mentorId = (submission?.assignment as { mentor_id?: string })?.mentor_id;
    if (mentorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden — mentors only' }, { status: 403 });
    }

    const rows = scores.map((s) => ({
      submission_id,
      rubric_id,
      criterion_id: s.criterion_id,
      score: s.score,
      comment: s.comment ?? null,
      scored_at: new Date().toISOString(),
    }));

    const { error } = await admin
      .from('rubric_scores')
      .upsert(rows, { onConflict: 'submission_id,criterion_id' });

    if (error) {
      console.error('Rubric scores upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST rubric scores error:', err);
    return NextResponse.json({ error: 'Failed to save rubric scores' }, { status: 500 });
  }
}
