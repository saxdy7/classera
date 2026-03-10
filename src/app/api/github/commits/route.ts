import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const GITHUB_API = 'https://api.github.com';

/** GET /api/github/commits?submission_id=...&page=... */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const submissionId = searchParams.get('submission_id');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = 30;

    if (!submissionId) {
      return NextResponse.json({ error: 'submission_id required' }, { status: 400 });
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

    const { data: conn } = await admin
      .from('github_connections')
      .select('access_token')
      .eq('user_id', submission.student_id)
      .single();

    const token = conn?.access_token ?? process.env.GITHUB_TOKEN;
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(
      `${GITHUB_API}/repos/${submission.repo_full_name}/commits?per_page=${perPage}&page=${page}`,
      { headers },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      return NextResponse.json({ error: err.message ?? 'GitHub API error' }, { status: res.status });
    }

    const raw = await res.json() as Array<{
      sha: string;
      commit: { message: string; author: { name: string; date: string } };
      author: { login: string } | null;
    }>;

    const linkHeader = res.headers.get('link') ?? '';
    const hasMore = linkHeader.includes('rel="next"');

    const commits = raw.map((c) => ({
      sha: c.sha,
      message: c.commit?.message ?? '',
      author: {
        name: c.commit?.author?.name ?? c.author?.login ?? 'Unknown',
        date: c.commit?.author?.date ?? '',
      },
    }));

    return NextResponse.json({ commits, has_more: hasMore });
  } catch (err) {
    console.error('Commits route error:', err);
    return NextResponse.json({ error: 'Failed to fetch commits' }, { status: 500 });
  }
}
