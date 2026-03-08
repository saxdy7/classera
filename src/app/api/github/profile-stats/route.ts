import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getUserRepos, getGithubUser } from '@/lib/github';

/**
 * GET /api/github/profile-stats?userId=...
 * Returns GitHub profile stats for a user (viewed by mentor or by self).
 * Aggregates data across all the user's linked GitHub repos.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const targetUserId = request.nextUrl.searchParams.get('userId') ?? user.id;
    const admin = createAdminClient();

    // Get GitHub connection for target user
    const { data: conn } = await admin
      .from('github_connections')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (!conn) {
      return NextResponse.json({ connected: false, stats: null });
    }

    // Fetch live GitHub user profile
    const ghUser = await getGithubUser(conn.github_username, conn.access_token);
    const repos = await getUserRepos(conn.github_username, conn.access_token);

    // Language distribution across all repos
    const langMap: Record<string, number> = {};
    let totalStars = 0;
    let totalForks = 0;
    for (const r of repos ?? []) {
      if (r.language) langMap[r.language] = (langMap[r.language] ?? 0) + 1;
      totalStars += r.stargazers_count;
      totalForks += r.forks_count;
    }

    const topLanguages = Object.entries(langMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([lang, count]) => ({ lang, count }));

    // Recent activity from repo_analytics
    const { data: analytics } = await admin
      .from('repo_analytics')
      .select('overall_score, consistency_score, activity_score, quality_score, total_commits, analyzed_at, repo_full_name')
      .eq('student_id', targetUserId)
      .order('analyzed_at', { ascending: false })
      .limit(10);

    const avgOverall =
      analytics && analytics.length > 0
        ? Math.round(analytics.reduce((s, a) => s + (a.overall_score ?? 0), 0) / analytics.length)
        : null;

    const totalCommitsAcrossProjects = analytics?.reduce((s, a) => s + (a.total_commits ?? 0), 0) ?? 0;

    return NextResponse.json({
      connected: true,
      github: {
        username: conn.github_username,
        name: conn.github_name,
        avatar: conn.github_avatar_url,
        profileUrl: conn.github_profile_url,
        publicRepos: ghUser?.public_repos ?? conn.public_repos,
        followers: ghUser?.followers ?? conn.followers,
        following: ghUser?.following ?? conn.following,
        memberSince: ghUser?.created_at,
      },
      stats: {
        totalRepos: repos?.length ?? 0,
        totalStars,
        totalForks,
        topLanguages,
        totalCommitsInPlatform: totalCommitsAcrossProjects,
        avgOverallScore: avgOverall,
        projectsAnalyzed: analytics?.length ?? 0,
        recentProjects: analytics?.slice(0, 3) ?? [],
      },
    });
  } catch (err) {
    console.error('Profile stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch GitHub stats' }, { status: 500 });
  }
}

/**
 * DELETE /api/github/profile-stats
 * Disconnects (removes) GitHub connection for the authenticated user.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Only allow users to disconnect themselves
    const targetId = request.nextUrl.searchParams.get('userId') ?? user.id;
    if (targetId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const admin = createAdminClient();
    await admin.from('github_connections').delete().eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Disconnect error:', err);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
