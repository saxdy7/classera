'use client';

import { useState, useEffect, useCallback } from 'react';
import { GitCommit, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Commit {
  sha: string;
  message: string;
  author: { name: string; date: string };
}

interface CommitFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

interface CommitDetail {
  sha: string;
  message: string;
  author: { name: string; date: string };
  additions: number;
  deletions: number;
  files: CommitFile[];
}

export default function CommitHistory({ submissionId }: { submissionId: string }) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSha, setExpandedSha] = useState<string | null>(null);
  const [diffData, setDiffData] = useState<Record<string, CommitDetail>>({});
  const [loadingDiff, setLoadingDiff] = useState<string | null>(null);

  const fetchCommits = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/github/commits?submission_id=${submissionId}&page=${pageNum}`);
      const data = await res.json() as { commits?: Commit[]; has_more?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load commits');
      setCommits((prev) => append ? [...prev, ...(data.commits ?? [])] : (data.commits ?? []));
      setHasMore(data.has_more ?? false);
      setPage(pageNum);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading commits');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [submissionId]);

  useEffect(() => { fetchCommits(1); }, [fetchCommits]);

  async function toggleDiff(sha: string) {
    if (expandedSha === sha) { setExpandedSha(null); return; }
    setExpandedSha(sha);
    if (diffData[sha]) return;
    setLoadingDiff(sha);
    try {
      const res = await fetch(`/api/github/diff?submission_id=${submissionId}&sha=${sha}`);
      const data = await res.json() as { commit?: CommitDetail; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load diff');
      if (data.commit) setDiffData((prev) => ({ ...prev, [sha]: data.commit! }));
    } catch (e) {
      console.error('Diff error:', e);
    } finally {
      setLoadingDiff(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <GitCommit className="mx-auto mb-2 opacity-40" size={32} />
        <p className="text-sm">No commits found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {commits.map((commit) => {
        const isExpanded = expandedSha === commit.sha;
        const detail = diffData[commit.sha];
        const shortSha = commit.sha.slice(0, 7);
        const firstLine = commit.message.split('\n')[0];
        const dateStr = commit.author.date
          ? formatDistanceToNow(new Date(commit.author.date), { addSuffix: true })
          : '';

        return (
          <div key={commit.sha} className="border border-slate-100 rounded-xl overflow-hidden">
            <button
              onClick={() => toggleDiff(commit.sha)}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <GitCommit size={14} className="text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{firstLine}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {commit.author.name} · {dateStr}
                </p>
              </div>
              <code className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded flex-shrink-0">
                {shortSha}
              </code>
              {isExpanded ? (
                <ChevronUp size={16} className="text-slate-400 flex-shrink-0" />
              ) : (
                <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50 p-3">
                {loadingDiff === commit.sha ? (
                  <div className="text-xs text-slate-400 animate-pulse">Loading diff…</div>
                ) : detail ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Plus size={12} /> {detail.additions} additions
                      </span>
                      <span className="flex items-center gap-1 text-red-500">
                        <Minus size={12} /> {detail.deletions} deletions
                      </span>
                      <span>{detail.files.length} file{detail.files.length !== 1 ? 's' : ''} changed</span>
                    </div>
                    {detail.files.map((file) => (
                      <div key={file.filename} className="rounded-lg border border-slate-200 overflow-hidden">
                        <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 text-xs font-mono">
                          <span className="text-slate-700 truncate">{file.filename}</span>
                          <span className="flex gap-2 flex-shrink-0 ml-2">
                            <span className="text-emerald-600">+{file.additions}</span>
                            <span className="text-red-500">-{file.deletions}</span>
                          </span>
                        </div>
                        {file.patch && (
                          <pre className="p-3 text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed">
                            {file.patch.split('\n').map((line, i) => (
                              <span
                                key={i}
                                className={
                                  line.startsWith('+')
                                    ? 'block bg-emerald-50 text-emerald-800'
                                    : line.startsWith('-')
                                    ? 'block bg-red-50 text-red-800'
                                    : line.startsWith('@@')
                                    ? 'block bg-blue-50 text-blue-700'
                                    : 'block text-slate-600'
                                }
                              >
                                {line}
                              </span>
                            ))}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Diff not available</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {hasMore && (
        <button
          onClick={() => fetchCommits(page + 1, true)}
          disabled={loadingMore}
          className="w-full py-2.5 text-sm text-violet-600 font-medium hover:bg-violet-50 rounded-xl border border-violet-100 transition-colors disabled:opacity-50"
        >
          {loadingMore ? 'Loading…' : 'Load more commits'}
        </button>
      )}
    </div>
  );
}
