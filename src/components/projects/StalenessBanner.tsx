'use client';

import { useState } from 'react';
import { Clock, RefreshCw, Loader2 } from 'lucide-react';

const STALE_AFTER_MS = 6 * 60 * 60 * 1000; // 6 hours, matches repo_analytics' documented cache window

export default function StalenessBanner({
  submissionId,
  analyzedAt,
}: {
  submissionId: string;
  analyzedAt: string | null;
}) {
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStale = analyzedAt ? Date.now() - new Date(analyzedAt).getTime() > STALE_AFTER_MS : false;
  if (!isStale) return null;

  async function reanalyze() {
    setReanalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/github/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: submissionId }),
      });
      if (!res.ok) throw new Error('Re-analysis failed');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Re-analysis failed');
      setReanalyzing(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500 rounded-lg px-4 py-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-xs text-amber-600 truncate">
          {error ?? 'This data may be outdated - re-analyze to pull your latest commits.'}
        </p>
      </div>
      <button
        onClick={reanalyze}
        disabled={reanalyzing}
        className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:opacity-80 flex-shrink-0 disabled:opacity-60"
      >
        {reanalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        Re-analyze
      </button>
    </div>
  );
}
