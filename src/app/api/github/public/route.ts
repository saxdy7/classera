import { NextRequest, NextResponse } from 'next/server';
import {
  getRepoInfo,
  getAllCommits,
  getCommitActivity,
  getContributors,
  getLanguages,
  getBranches,
  getFileTree,
} from '@/lib/github';

const GITHUB_API = 'https://api.github.com';

/**
 * GET /api/github/public?repo=owner/repo
 * Fetch public GitHub repository data without authentication.
 * Works for public repositories without needing an access token.
 * Optional query params:
 *   - repo: owner/repo (required)
 *   - token: GitHub access token (optional, for higher rate limits)
 *   - includeCommits: boolean (default: true)
 *   - includeContributors: boolean (default: true)
 *   - includeLanguages: boolean (default: true)
 *   - maxPages: number (default: 3, max commits pages to fetch)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const repo = searchParams.get('repo');
    const token = searchParams.get('token');
    const maxPages = Math.min(parseInt(searchParams.get('maxPages') ?? '3', 10), 10);
    const includeCommits = searchParams.get('includeCommits') !== 'false';
    const includeContributors = searchParams.get('includeContributors') !== 'false';
    const includeLanguages = searchParams.get('includeLanguages') !== 'false';

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

    // Validate repo name (basic security check)
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName || owner.length > 39 || repoName.length > 100) {
      return NextResponse.json(
        { error: 'Invalid owner or repo name' },
        { status: 400 }
      );
    }

    // Fetch repository info (always public)
    const repoInfo = await getRepoInfo(repo, token);
    
    if (!repoInfo) {
      return NextResponse.json(
        { error: 'Repository not found or not accessible' },
        { status: 404 }
      );
    }

    // Build response
    const response: any = {
      repo: repoInfo,
    };

    // Conditionally fetch additional data
    const [commits, contributors, languages] = await Promise.all([
      includeCommits ? getAllCommits(repo, token, maxPages) : Promise.resolve([]),
      includeContributors ? getContributors(repo, token) : Promise.resolve([]),
      includeLanguages ? getLanguages(repo, token) : Promise.resolve({}),
    ]);

    if (includeCommits) {
      response.commits = commits;
      response.totalCommits = commits.length;
      
      // Calculate commit stats
      if (commits.length > 0) {
        const additionsTotal = commits.reduce((sum, c) => sum + (c.stats?.additions ?? 0), 0);
        const deletionsTotal = commits.reduce((sum, c) => sum + (c.stats?.deletions ?? 0), 0);
        response.commitStats = {
          total: commits.length,
          totalAdditions: additionsTotal,
          totalDeletions: deletionsTotal,
          firstCommit: commits[commits.length - 1],
          latestCommit: commits[0],
        };
      }
    }

    if (includeContributors) {
      response.contributors = contributors;
      response.contributorCount = contributors?.length ?? 0;
    }

    if (includeLanguages) {
      response.languages = languages;
      response.languageCount = Object.keys(languages ?? {}).length;
      response.primaryLanguage = Object.entries(languages ?? {})
        .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] ?? null;
    }

    // Cache for 1 hour
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // 1 hour
    });

    return NextResponse.json(response, { headers });
  } catch (err) {
    console.error('Public GitHub API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub repository data' },
      { status: 500 }
    );
  }
}
