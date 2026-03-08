import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFileContent } from '@/lib/github';

/**
 * GET /api/github/file?submission_id=...&path=...
 * Returns the decoded content of a file in the student's linked repository.
 * Only mentors or the owning student may access.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const submissionId = searchParams.get('submission_id');
    const path = searchParams.get('path');

    if (!submissionId || !path) {
      return NextResponse.json({ error: 'submission_id and path required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify access: must be the submitting student OR the assignment mentor
    const { data: submission } = await admin
      .from('assignment_submissions')
      .select('student_id, repo_full_name, assignment:project_assignments(mentor_id)')
      .eq('id', submissionId)
      .single();

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const mentorId = (submission.assignment as { mentor_id?: string })?.mentor_id;
    if (submission.student_id !== user.id && mentorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get token if student is connected
    const { data: conn } = await admin
      .from('github_connections')
      .select('access_token')
      .eq('user_id', submission.student_id)
      .single();

    const result = await getFileContent(
      submission.repo_full_name,
      path,
      conn?.access_token ?? null,
    );

    if (!result) {
      return NextResponse.json({ error: 'File not found or not decodable' }, { status: 404 });
    }

    // Limit content size returned to 200 KB to avoid payload bloat
    const truncated = result.content.length > 200_000;
    return NextResponse.json({
      content: truncated ? result.content.slice(0, 200_000) + '\n\n[... truncated ...]' : result.content,
      size: result.size,
      sha: result.sha,
      truncated,
    });
  } catch (err) {
    console.error('File fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}
