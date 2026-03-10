import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/** GET /api/projects/rubrics?assignment_id=...&submission_id=... (optional)
 *  POST /api/projects/rubrics  body: { rubric_id?, assignment_id, criteria }
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const assignmentId = searchParams.get('assignment_id');
    const submissionId = searchParams.get('submission_id');

    if (!assignmentId) {
      return NextResponse.json({ error: 'assignment_id required' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: rubric } = await admin
      .from('assignment_rubrics')
      .select('id, criteria, mentor_id')
      .eq('assignment_id', assignmentId)
      .single();

    if (!rubric) {
      return NextResponse.json({ rubric: null, scores: null });
    }

    let scores: Record<string, { score: number; comment: string }> | null = null;
    if (submissionId) {
      const { data: scoreRows } = await admin
        .from('rubric_scores')
        .select('criterion_id, score, comment')
        .eq('submission_id', submissionId)
        .eq('rubric_id', rubric.id);

      if (scoreRows && scoreRows.length > 0) {
        scores = {};
        for (const row of scoreRows) {
          scores[row.criterion_id] = { score: Number(row.score), comment: row.comment ?? '' };
        }
      }
    }

    return NextResponse.json({ rubric, scores });
  } catch (err) {
    console.error('GET rubric error:', err);
    return NextResponse.json({ error: 'Failed to fetch rubric' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as {
      assignment_id: string;
      criteria: Array<{ id: string; name: string; description: string; max_points: number; weight: number }>;
    };
    const { assignment_id, criteria } = body;

    if (!assignment_id || !Array.isArray(criteria)) {
      return NextResponse.json({ error: 'assignment_id and criteria required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify the calling user is the mentor for this assignment
    const { data: assignment } = await admin
      .from('project_assignments')
      .select('mentor_id')
      .eq('id', assignment_id)
      .single();

    if (!assignment || assignment.mentor_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: rubric, error } = await admin
      .from('assignment_rubrics')
      .upsert(
        { assignment_id, mentor_id: user.id, criteria, updated_at: new Date().toISOString() },
        { onConflict: 'assignment_id' },
      )
      .select('id, criteria')
      .single();

    if (error) {
      console.error('Rubric upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rubric });
  } catch (err) {
    console.error('POST rubric error:', err);
    return NextResponse.json({ error: 'Failed to save rubric' }, { status: 500 });
  }
}
