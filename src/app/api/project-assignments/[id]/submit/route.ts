import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseRepoUrl } from '@/lib/github';

/**
 * POST /api/project-assignments/[id]/submit
 * Body: { repo_url: string }
 * Student links their GitHub repository to an assignment.
 * Triggers automatic analysis after submission.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: assignmentId } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as { repo_url: string };
    const { repo_url } = body;

    if (!repo_url?.trim()) {
      return NextResponse.json({ error: 'repo_url is required' }, { status: 400 });
    }

    const parsed = parseRepoUrl(repo_url);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL. Expected: https://github.com/owner/repo' },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Verify assignment exists and student is assigned
    const { data: eligible } = await admin
      .from('assignment_students')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .single();

    if (!eligible) {
      return NextResponse.json({ error: 'You are not assigned to this project' }, { status: 403 });
    }

    // Upsert submission
    const { data: submission, error: subErr } = await admin
      .from('assignment_submissions')
      .upsert(
        {
          assignment_id: assignmentId,
          student_id: user.id,
          repo_url: repo_url.trim(),
          repo_owner: parsed.owner,
          repo_name: parsed.repo,
          repo_full_name: parsed.full,
          status: 'submitted',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'assignment_id,student_id' },
      )
      .select()
      .single();

    if (subErr) throw subErr;

    // Trigger analysis in background (fire and forget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    fetch(`${appUrl}/api/github/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: submission.id }),
    }).catch((e) => console.error('Background analysis failed to start:', e));

    return NextResponse.json({ submission, message: 'Repository submitted. Analysis started.' }, { status: 201 });
  } catch (err) {
    console.error('Submit error:', err);
    return NextResponse.json({ error: 'Failed to submit repository' }, { status: 500 });
  }
}
