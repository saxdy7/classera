import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const GITHUB_API = 'https://api.github.com';

/** GET /api/github/commits?submission_id=...&page=... */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user, session } } = await supabase.auth.getSession();
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

    // Try to get GitHub token (in priority order):
    // 1. Session provider_token (if current user is student)
    // 2. Student's stored GitHub connection token
    // 3. Session provider_token (if current user is mentor)
    // 4. Mentor's stored GitHub connection token
    // 5. Environment GITHUB_TOKEN
    // 6. null (will work for public repos)
    
    const { data: studentConn } = await admin
      .from('github_connections')
      .select('access_token')
      .eq('user_id', submission.student_id)
      .single();

    const isStudent = user.id === submission.student_id;
    let token = (isStudent && session?.provider_token) ? session.provider_token : (studentConn?.access_token ?? null);
    
    if (!token && mentorId) {
      const { data: mentorConn } = await admin
        .from('github_connections')
        .select('access_token')
        .eq('user_id', mentorId)
        .single();
      const isMentor = user.id === mentorId;
      token = (isMentor && session?.provider_token) ? session.provider_token : (mentorConn?.access_token ?? null);
    }
    
    // Final fallback to environment token
    token = token ?? process.env.GITHUB_TOKEN ?? null;
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token && typeof token === 'string' ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(
      `${GITHUB_API}/repos/${submission.repo_full_name}/commits?per_page=${perPage}&page=${page}`,
      { headers },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      const isRateLimit = res.status === 403 || res.status === 429;
      const isUnauthorized = res.status === 401;
      const isNotFound = res.status === 404;
      
      let friendlyMsg = err.message ?? 'GitHub API error';
      
      if (isRateLimit) {
        friendlyMsg = 'GitHub API rate limit reached. Please ask the student to connect their GitHub account for higher rate limits, or add a GITHUB_TOKEN to the server environment.';
      } else if (isUnauthorized) {
        friendlyMsg = 'GitHub authentication failed. The repository may be private. Please connect your GitHub account (via /api/github/connect) or ask your mentor to add a GITHUB_TOKEN to the server environment.';
      } else if (isNotFound) {
        friendlyMsg = 'Repository not found or is not accessible. Verify the repository name is correct and that it exists.';
      }
      
      console.log(`GitHub API error [${res.status}]:`, err.message, 'for repo:', submission.repo_full_name);
      return NextResponse.json({ error: friendlyMsg, repo: submission.repo_full_name }, { status: res.status });
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
