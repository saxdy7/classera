/**
 * GitHub API utility library
 * All functions work with or without an OAuth access token (token enables private repos + higher rate limits)
 */

const GITHUB_API = 'https://api.github.com';

function githubHeaders(token?: string | null): HeadersInit {
  return {
    Accept: 'application/vnd.github.v3+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubFetch<T = unknown>(
  url: string,
  token?: string | null,
  revalidate = 3600,
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: githubHeaders(token),
      next: { revalidate },
    });
    // 202 means GitHub is computing stats — data not ready yet
    if (!res.ok || res.status === 202) return null;
    const text = await res.text();
    if (!text || text.trim() === '') return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// ── Repo ──────────────────────────────────────────────────────

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  private: boolean;
  topics: string[];
}

export function getRepoInfo(repoFullName: string, token?: string | null) {
  return githubFetch<GithubRepo>(
    `${GITHUB_API}/repos/${repoFullName}`,
    token,
    1800,
  );
}

// ── Commits ───────────────────────────────────────────────────

export interface GithubCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string };
    committer: { name: string; email: string; date: string };
  };
  stats?: { additions: number; deletions: number; total: number };
}

export async function getAllCommits(
  repoFullName: string,
  token?: string | null,
  maxPages = 5,
): Promise<GithubCommit[]> {
  const all: GithubCommit[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const page_data = await githubFetch<GithubCommit[]>(
      `${GITHUB_API}/repos/${repoFullName}/commits?per_page=100&page=${page}`,
      token,
      1800,
    );
    if (!page_data || page_data.length === 0) break;
    all.push(...page_data);
    if (page_data.length < 100) break;
  }
  return all;
}

// ── Weekly commit activity (last 52 weeks) ───────────────────

export interface WeekActivity {
  week: number; // unix timestamp
  total: number;
  days: number[];
}

export function getCommitActivity(repoFullName: string, token?: string | null) {
  return githubFetch<WeekActivity[]>(
    `${GITHUB_API}/repos/${repoFullName}/stats/commit_activity`,
    token,
    3600,
  );
}

// ── Contributors ──────────────────────────────────────────────

export interface Contributor {
  author: { login: string; avatar_url: string; html_url: string };
  total: number;
}

export function getContributors(repoFullName: string, token?: string | null) {
  return githubFetch<Contributor[]>(
    `${GITHUB_API}/repos/${repoFullName}/stats/contributors`,
    token,
    3600,
  );
}

// ── Languages ─────────────────────────────────────────────────

export function getLanguages(repoFullName: string, token?: string | null) {
  return githubFetch<Record<string, number>>(
    `${GITHUB_API}/repos/${repoFullName}/languages`,
    token,
    3600,
  );
}

// ── Branches ──────────────────────────────────────────────────

export function getBranches(repoFullName: string, token?: string | null) {
  return githubFetch<{ name: string }[]>(
    `${GITHUB_API}/repos/${repoFullName}/branches?per_page=100`,
    token,
    3600,
  );
}

// ── File tree ─────────────────────────────────────────────────

export interface TreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export async function getFileTree(
  repoFullName: string,
  token?: string | null,
): Promise<TreeItem[]> {
  const data = await githubFetch<{ tree: TreeItem[]; truncated: boolean }>(
    `${GITHUB_API}/repos/${repoFullName}/git/trees/HEAD?recursive=1`,
    token,
    3600,
  );
  return data?.tree ?? [];
}

// ── File content ──────────────────────────────────────────────

export async function getFileContent(
  repoFullName: string,
  path: string,
  token?: string | null,
): Promise<{ content: string; size: number; sha: string } | null> {
  interface ContentResponse {
    content: string;
    encoding: string;
    size: number;
    sha: string;
  }
  const data = await githubFetch<ContentResponse>(
    `${GITHUB_API}/repos/${repoFullName}/contents/${encodeURIComponent(path)}`,
    token,
    0, // no cache for file content
  );
  if (!data) return null;
  if (data.encoding === 'base64') {
    return {
      content: Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf-8'),
      size: data.size,
      sha: data.sha,
    };
  }
  return null;
}

// ── User repos & profile ──────────────────────────────────────

export function getUserRepos(username: string, token?: string | null) {
  return githubFetch<GithubRepo[]>(
    `${GITHUB_API}/users/${username}/repos?sort=updated&per_page=100`,
    token,
    3600,
  );
}

export interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export function getGithubUser(username: string, token?: string | null) {
  return githubFetch<GithubUser>(
    `${GITHUB_API}/users/${username}`,
    token,
    3600,
  );
}

export function getAuthenticatedUser(token: string) {
  return githubFetch<GithubUser>(`${GITHUB_API}/user`, token, 0);
}

// ── Helpers ───────────────────────────────────────────────────

/** Parse any GitHub repo URL into { owner, repo, full } */
export function parseRepoUrl(
  url: string,
): { owner: string; repo: string; full: string } | null {
  try {
    const cleaned = url.trim().replace(/\.git$/, '');
    const match = cleaned.match(
      /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\/.*)?$/,
    );
    if (!match) return null;
    return { owner: match[1], repo: match[2], full: `${match[1]}/${match[2]}` };
  } catch {
    return null;
  }
}

/** Build a date → commit-count map from commit list */
export function buildDailyActivity(
  commits: GithubCommit[],
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const c of commits) {
    const raw = c.commit?.author?.date ?? c.commit?.committer?.date;
    if (!raw) continue;
    const day = raw.slice(0, 10);
    map[day] = (map[day] ?? 0) + 1;
  }
  return map;
}

/** Number of days with at least one commit */
export function countActiveDays(daily: Record<string, number>): number {
  return Object.values(daily).filter((v) => v > 0).length;
}

/** Build a hierarchical nested tree from flat TreeItem list */
export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  sha: string;
  children?: TreeNode[];
}

export function buildNestedTree(items: TreeItem[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map = new Map<string, TreeNode>();

  // Sort so folders come before files
  const sorted = [...items].sort((a, b) => {
    if (a.type === b.type) return a.path.localeCompare(b.path);
    return a.type === 'tree' ? -1 : 1;
  });

  for (const item of sorted) {
    const parts = item.path.split('/');
    const name = parts[parts.length - 1];
    const node: TreeNode = {
      name,
      path: item.path,
      type: item.type === 'tree' ? 'folder' : 'file',
      size: item.size,
      sha: item.sha,
      children: item.type === 'tree' ? [] : undefined,
    };

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = map.get(parentPath);
      if (parent?.children) parent.children.push(node);
    }

    map.set(item.path, node);
  }

  return root;
}

// ── Suspicious activity detection ────────────────────────────

export interface SuspiciousFlag {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export function detectSuspiciousActivity(
  commits: GithubCommit[],
  deadline?: string | null,
): SuspiciousFlag[] {
  if (commits.length === 0) return [];
  const flags: SuspiciousFlag[] = [];

  // 1 — barely any commits and project is supposedly done
  if (commits.length <= 2) {
    flags.push({
      type: 'minimal_commits',
      message: `Only ${commits.length} commit(s) found — expected more development activity`,
      severity: 'medium',
    });
  }

  // 2 — deadline cramming
  if (deadline) {
    const dl = new Date(deadline);
    const oneDayBefore = new Date(dl.getTime() - 24 * 60 * 60 * 1000);
    const lastDayCount = commits.filter((c) => {
      const d = new Date(c.commit?.author?.date ?? c.commit?.committer?.date);
      return d >= oneDayBefore && d <= dl;
    }).length;
    const ratio = lastDayCount / commits.length;
    if (ratio >= 0.6 && commits.length >= 4) {
      flags.push({
        type: 'deadline_cramming',
        message: `${Math.round(ratio * 100)}% of commits were made within 24 h of the deadline`,
        severity: 'high',
      });
    }
  }

  // 3 — long inactivity then sudden burst
  const daily = buildDailyActivity(commits);
  const dates = Object.keys(daily).sort();
  if (dates.length >= 2) {
    const gaps = dates
      .slice(1)
      .map((d, i) =>
        Math.round(
          (new Date(d).getTime() - new Date(dates[i]).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
    const maxGap = Math.max(...gaps);
    if (maxGap > 14) {
      flags.push({
        type: 'inactivity_burst',
        message: `${maxGap}-day gap in development activity detected`,
        severity: 'medium',
      });
    }
  }

  return flags;
}

// ── Score calculation ─────────────────────────────────────────

export interface ProjectScores {
  consistency: number;
  activity: number;
  quality: number;
  overall: number;
}

export function calculateScores(opts: {
  commits: GithubCommit[];
  branches: number;
  hasReadme: boolean;
  hasTests: boolean;
  languageCount: number;
}): ProjectScores {
  const { commits, branches, hasReadme, hasTests, languageCount } = opts;
  const n = commits.length;

  // Activity (0–100): commits, branches, languages, tests
  const activity = Math.min(
    100,
    Math.round(
      Math.min(40, n * 2) +
        Math.min(20, branches * 7) +
        Math.min(20, languageCount * 7) +
        (hasTests ? 20 : 0),
    ),
  );

  // Consistency (0–100): how spread out commits are
  const daily = buildDailyActivity(commits);
  const activeDays = countActiveDays(daily);
  let spanDays = 1;
  if (n >= 2) {
    const first = new Date(commits[n - 1].commit?.author?.date ?? 0);
    const last = new Date(commits[0].commit?.author?.date ?? 0);
    spanDays = Math.max(
      1,
      Math.round((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }
  const target = Math.max(7, spanDays * 0.3);
  const consistency = Math.min(100, Math.round((activeDays / target) * 100));

  // Quality (0–100): readme, tests, branches, languages
  const quality = Math.min(
    100,
    Math.round(
      (hasReadme ? 30 : 0) +
        (hasTests ? 30 : 0) +
        Math.min(20, branches * 10) +
        (languageCount >= 2 ? 20 : 0),
    ),
  );

  const overall = Math.round(activity * 0.35 + consistency * 0.35 + quality * 0.3);

  return { consistency, activity, quality, overall };
}

/** Determine complexity level from total files + folder depth */
export function classifyComplexity(
  totalFiles: number,
  folderDepth: number,
): 'low' | 'medium' | 'high' {
  const score = totalFiles + folderDepth * 3;
  if (score < 20) return 'low';
  if (score < 80) return 'medium';
  return 'high';
}
