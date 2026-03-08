import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getRepoInfo,
  getAllCommits,
  getCommitActivity,
  getContributors,
  getLanguages,
  getBranches,
  getFileTree,
  buildDailyActivity,
  countActiveDays,
  detectSuspiciousActivity,
  calculateScores,
  classifyComplexity,
  buildNestedTree,
} from '@/lib/github';

/**
 * POST /api/github/analyze
 * Body: { submission_id: string }
 * Fetches GitHub data, computes scores, stores in repo_analytics, updates submission status.
 */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  let submission_id: string | undefined;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as { submission_id: string };
    submission_id = body.submission_id;

    if (!submission_id) {
      return NextResponse.json({ error: 'submission_id required' }, { status: 400 });
    }

    // Fetch submission
    const { data: submission } = await admin
      .from('assignment_submissions')
      .select('*, assignment:project_assignments(deadline)')
      .eq('id', submission_id)
      .single();

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Mark as analyzing
    await admin
      .from('assignment_submissions')
      .update({ status: 'analyzing' })
      .eq('id', submission_id);

    const repoFullName = submission.repo_full_name;
    const deadline = (submission.assignment as { deadline?: string })?.deadline ?? null;

    // Get GitHub token for student (optional, public repos work without it)
    const { data: conn } = await admin
      .from('github_connections')
      .select('access_token')
      .eq('user_id', submission.student_id)
      .single();
    const token = conn?.access_token ?? null;

    // Parallel fetch all repo data
    const [repoInfo, commits, weeklyActivity, contributors, languages, branches, treeItems] =
      await Promise.all([
        getRepoInfo(repoFullName, token),
        getAllCommits(repoFullName, token),
        getCommitActivity(repoFullName, token),
        getContributors(repoFullName, token),
        getLanguages(repoFullName, token),
        getBranches(repoFullName, token),
        getFileTree(repoFullName, token),
      ]);

    if (!repoInfo) {
      await admin.from('assignment_submissions').update({ status: 'submitted' }).eq('id', submission_id);
      return NextResponse.json({ error: 'Repository not found or inaccessible' }, { status: 404 });
    }

    // Build daily activity map
    const dailyActivity = buildDailyActivity(commits);
    const activeDays = countActiveDays(dailyActivity);

    // File tree stats
    const allFiles = (treeItems ?? []).filter((t) => t.type === 'blob');
    const allFolders = (treeItems ?? []).filter((t) => t.type === 'tree');
    const totalFiles = allFiles.length;
    const folderDepth =
      allFolders.length > 0
        ? Math.max(...allFolders.map((f) => f.path.split('/').length))
        : 0;

    // Check for readme / tests
    const paths = (treeItems ?? []).map((t) => t.path.toLowerCase());
    const hasReadme = paths.some((p) => p === 'readme.md' || p === 'readme.txt' || p === 'readme');
    const hasTests = paths.some(
      (p) =>
        p.includes('test') ||
        p.includes('spec') ||
        p.includes('__tests__') ||
        p.includes('.test.') ||
        p.includes('.spec.'),
    );

    // Estimate total lines (rough: average 30 lines/file)
    const totalLines = totalFiles * 30;

    const complexity = classifyComplexity(totalFiles, folderDepth);
    const branchCount = (branches ?? []).length;
    const langCount = Object.keys(languages ?? {}).length;

    const scores = calculateScores({
      commits,
      branches: branchCount,
      hasReadme,
      hasTests,
      languageCount: langCount,
    });

    const suspiciousFlags = detectSuspiciousActivity(commits, deadline);

    // Build timeline events
    const timelineEvents: Array<{ date: string; type: string; message: string }> = [];
    if (repoInfo.created_at) {
      timelineEvents.push({ date: repoInfo.created_at, type: 'repo_created', message: 'Repository created' });
    }
    // Add first commit
    if (commits.length > 0) {
      const firstCommit = commits[commits.length - 1];
      timelineEvents.push({
        date: firstCommit.commit.author.date,
        type: 'first_commit',
        message: `First commit: "${firstCommit.commit.message.slice(0, 60)}"`,
      });
    }
    // Add latest commit
    if (commits.length > 1) {
      const latestCommit = commits[0];
      timelineEvents.push({
        date: latestCommit.commit.author.date,
        type: 'latest_commit',
        message: `Latest commit: "${latestCommit.commit.message.slice(0, 60)}"`,
      });
    }
    timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Build weekly summary
    const weeklyData = (weeklyActivity ?? [])
      .filter((w) => w.total > 0)
      .map((w) => ({ week: w.week, total: w.total, days: w.days }));

    // Build nested file tree (limit to keep JSON manageable)
    const nestedTree = buildNestedTree((treeItems ?? []).slice(0, 500));

    // Contributor summary
    const contributorSummary = (contributors ?? [])
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((c) => ({
        login: c.author?.login,
        avatar: c.author?.avatar_url,
        commits: c.total,
      }));

    // Upsert analytics
    await admin.from('repo_analytics').upsert(
      {
        submission_id,
        student_id: submission.student_id,
        repo_full_name: repoFullName,
        total_commits: commits.length,
        total_branches: branchCount,
        total_files: totalFiles,
        repo_size_kb: repoInfo.size,
        open_issues: repoInfo.open_issues_count,
        stars: repoInfo.stargazers_count,
        forks: repoInfo.forks_count,
        repo_created_at: repoInfo.created_at,
        last_push_at: repoInfo.pushed_at,
        last_commit_at: commits[0]?.commit?.author?.date ?? null,
        active_days: activeDays,
        commit_frequency: weeklyData,
        daily_activity: dailyActivity,
        weekly_activity: weeklyData,
        contributors: contributorSummary,
        languages: languages ?? {},
        total_lines: totalLines,
        complexity_level: complexity,
        has_readme: hasReadme,
        has_tests: hasTests,
        folder_depth: folderDepth,
        consistency_score: scores.consistency,
        activity_score: scores.activity,
        quality_score: scores.quality,
        overall_score: scores.overall,
        suspicious_flags: suspiciousFlags,
        timeline_events: timelineEvents,
        file_tree: nestedTree,
        analyzed_at: new Date().toISOString(),
        is_stale: false,
      },
      { onConflict: 'submission_id' },
    );

    // Mark submission as analyzed
    await admin
      .from('assignment_submissions')
      .update({ status: 'analyzed', updated_at: new Date().toISOString() })
      .eq('id', submission_id);

    return NextResponse.json({ success: true, overall_score: scores.overall });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Analyze error:', msg, err);
    // Always reset status so the student can retry
    if (submission_id) {
      await admin
        .from('assignment_submissions')
        .update({ status: 'submitted' })
        .eq('id', submission_id);
    }
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? msg : 'Analysis failed' },
      { status: 500 },
    );
  }
}
