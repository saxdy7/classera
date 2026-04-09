import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const GITHUB_API = 'https://api.github.com';
const MAX_PATCH_CHARS = 5_000;

/** GET /api/github/diff?submission_id=...&sha=... */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user, session } } = await supabase.auth.getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const submissionId = searchParams.get('submission_id');
    const sha = searchParams.get('sha');

    if (!submissionId || !sha) {
      return NextResponse.json({ error: 'submission_id and sha required' }, { status: 400 });
    }

    const admin = createAdminClient();

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

    // Try student token → mentor token → env fallback (in that priority order)
    const { data: studentConn } = await admin
      .from('github_connections')
      .select('access_token')
      .eq('user_id', submission.student_id)
      .single();

    const isStudent = user.id === submission.student_id;
    let token = (isStudent ? session?.provider_token : null) || studentConn?.access_token || null;
    
    if (!token && mentorId) {
      const { data: mentorConn } = await admin
        .from('github_connections')
        .select('access_token')
        .eq('user_id', mentorId)
        .single();
      const isMentor = user.id === mentorId;
      token = (isMentor ? session?.provider_token : null) || mentorConn?.access_token || null;
    }
    
    token = token ?? process.env.GITHUB_TOKEN ?? null;
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token && typeof token === 'string' ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(
      `${GITHUB_API}/repos/${submission.repo_full_name}/commits/${sha}`,
      { headers },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      const isRateLimit = res.status === 403 || res.status === 429;
      const friendlyMsg = isRateLimit
        ? 'GitHub API rate limit reached. Ask the student to connect their GitHub account, or add a GITHUB_TOKEN to the server environment.'
        : (err.message ?? 'GitHub API error');
      return NextResponse.json({ error: friendlyMsg }, { status: res.status });
    }

    const raw = await res.json() as {
      sha: string;
      commit: {
        message: string;
        author: { name: string; date: string };
      };
      stats: { additions: number; deletions: number };
      files: Array<{
        filename: string;
        status: string;
        additions: number;
        deletions: number;
        patch?: string;
      }>;
    };

    const commit = {
      sha: raw.sha,
      message: raw.commit?.message ?? '',
      author: {
        name: raw.commit?.author?.name ?? 'Unknown',
        date: raw.commit?.author?.date ?? '',
      },
      additions: raw.stats?.additions ?? 0,
      deletions: raw.stats?.deletions ?? 0,
      files: (raw.files ?? []).map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch ? f.patch.slice(0, MAX_PATCH_CHARS) : undefined,
      })),
    };

    return NextResponse.json({ commit });
  } catch (err) {
    console.error('Diff route error:', err);
    return NextResponse.json({ error: 'Failed to fetch diff' }, { status: 500 });
  }
}
