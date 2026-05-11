import { NextRequest, NextResponse } from 'next/server';

const GITHUB_API = 'https://api.github.com';

/**
 * GET /api/github/repo-commits?repo=owner/repo&page=1&token=...
 * Fetch commits from a public GitHub repository.
 * No authentication required for public repos.
 * Optional token param for higher rate limits.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const repo = searchParams.get('repo');
    const token = searchParams.get('token');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(parseInt(searchParams.get('per_page') ?? '30', 10), 100);

    if (!repo) {
      return NextResponse.json(
        { error: 'repo parameter required (format: owner/repo)' },
        { status: 400 }
      );
    }

    if (!repo.includes('/') || repo.split('/').length !== 2) {
      return NextResponse.json(
        { error: 'Invalid repo format. Use owner/repo' },
        { status: 400 }
      );
    }

    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token && typeof token === 'string' ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(
      `${GITHUB_API}/repos/${repo}/commits?per_page=${perPage}&page=${page}`,
      { headers }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      const isRateLimit = res.status === 403 || res.status === 429;
      const isNotFound = res.status === 404;
      
      let friendlyMsg = err.message ?? 'GitHub API error';
      
      if (isRateLimit) {
        friendlyMsg = 'GitHub API rate limit reached. Please provide a valid access token using the token parameter or configure GITHUB_TOKEN on the server.';
      } else if (isNotFound) {
        friendlyMsg = 'Repository not found. Verify the repository name is correct.';
      }
      
      return NextResponse.json({ error: friendlyMsg }, { status: res.status });
    }

    const commits = await res.json() as Array<{
      sha: string;
      commit: { message: string; author: { name: string; date: string } };
      author: { login: string } | null;
    }>;

    const linkHeader = res.headers.get('link') ?? '';
    const hasMore = linkHeader.includes('rel="next"');

    const formatted = commits.map((c) => ({
      sha: c.sha,
      message: c.commit?.message ?? '',
      author: {
        name: c.commit?.author?.name ?? c.author?.login ?? 'Unknown',
        date: c.commit?.author?.date ?? '',
      },
    }));

    return NextResponse.json({
      repo,
      page,
      per_page: perPage,
      commits: formatted,
      has_more: hasMore,
      _links: {
        next: hasMore ? `/api/github/repo-commits?repo=${repo}&page=${page + 1}&per_page=${perPage}${token ? `&token=${token}` : ''}` : null,
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minute cache
      }
    });
  } catch (err) {
    console.error('Repo commits error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch repository commits' },
      { status: 500 }
    );
  }
}
