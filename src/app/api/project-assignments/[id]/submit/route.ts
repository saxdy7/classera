import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseRepoUrl } from '@/lib/github';

/**
 * POST /api/project-assignments/[id]/submit
 * Body shape depends on the assignment's submission_type:
 *   github      -> { repo_url }
 *   link        -> { submission_url }
 *   written     -> { submission_text }
 *   file_upload -> { file_url, file_name }  (file itself uploaded client-side via /api/upload first)
 * Any type may also include an optional { deploy_url } (live preview link).
 * GitHub submissions trigger automatic repo analysis; other types go straight to "submitted".
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

    const { data: assignment } = await admin
      .from('project_assignments')
      .select('title, mentor_id, submission_type')
      .eq('id', assignmentId)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const { data: studentProfile } = await admin
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const body = await request.json() as {
      repo_url?: string;
      submission_url?: string;
      submission_text?: string;
      file_url?: string;
      file_name?: string;
      deploy_url?: string;
    };

    const submissionType = assignment.submission_type ?? 'github';
    const payload: Record<string, unknown> = {
      assignment_id: assignmentId,
      student_id: user.id,
      status: 'submitted',
      updated_at: new Date().toISOString(),
      deploy_url: body.deploy_url?.trim() || null,
    };

    if (submissionType === 'github') {
      if (!body.repo_url?.trim()) {
        return NextResponse.json({ error: 'repo_url is required' }, { status: 400 });
      }
      const parsed = parseRepoUrl(body.repo_url);
      if (!parsed) {
        return NextResponse.json(
          { error: 'Invalid GitHub repository URL. Expected: https://github.com/owner/repo' },
          { status: 400 },
        );
      }
      payload.repo_url = body.repo_url.trim();
      payload.repo_owner = parsed.owner;
      payload.repo_name = parsed.repo;
      payload.repo_full_name = parsed.full;
    } else if (submissionType === 'link') {
      if (!body.submission_url?.trim()) {
        return NextResponse.json({ error: 'submission_url is required' }, { status: 400 });
      }
      payload.submission_url = body.submission_url.trim();
    } else if (submissionType === 'written') {
      if (!body.submission_text?.trim()) {
        return NextResponse.json({ error: 'submission_text is required' }, { status: 400 });
      }
      payload.submission_text = body.submission_text.trim();
    } else if (submissionType === 'file_upload') {
      if (!body.file_url?.trim()) {
        return NextResponse.json({ error: 'file_url is required - upload the file first' }, { status: 400 });
      }
      payload.file_url = body.file_url.trim();
      payload.file_name = body.file_name?.trim() || null;
    }

    const { data: submission, error: subErr } = await admin
      .from('assignment_submissions')
      .upsert(payload, { onConflict: 'assignment_id,student_id' })
      .select()
      .single();

    if (subErr) throw subErr;

    if (assignment.mentor_id) {
      await admin.from('notifications').insert({
        user_id: assignment.mentor_id,
        type: 'project_submitted',
        title: 'New Submission',
        message: `${studentProfile?.full_name ?? 'A student'} submitted work for "${assignment.title}".`,
        related_id: assignmentId,
        related_type: 'project_assignment',
        action_url: `/dashboard/mentor/projects/${assignmentId}/${user.id}`,
        metadata: { assignment_id: assignmentId, student_id: user.id },
        is_read: false,
      });
    }

    if (submissionType === 'github') {
      // Trigger analysis in background (fire and forget)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      fetch(`${appUrl}/api/github/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submission.id }),
      }).catch((e) => console.error('Background analysis failed to start:', e));

      return NextResponse.json({ submission, message: 'Repository submitted. Analysis started.' }, { status: 201 });
    }

    return NextResponse.json({ submission, message: 'Submission received.' }, { status: 201 });
  } catch (err) {
    console.error('Submit error:', err);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}
