'use client';

import { useState } from 'react';
import { RefreshCw, Download, CheckCircle, AlertTriangle } from 'lucide-react';

interface SubmissionItem {
  id: string;
  status: string;
  student_name?: string;
  student_email?: string;
  score?: number;
  analytics?: {
    overall_score: number;
    consistency_score: number;
    activity_score: number;
    quality_score: number;
    total_commits: number;
    suspicious_flags: Array<{ type: string; severity: string }>;
  } | null;
}

interface BatchToolbarProps {
  assignmentId: string;
  submissions: SubmissionItem[];
}

export default function BatchToolbar({ assignmentId, submissions }: BatchToolbarProps) {
  const [reanalyzing, setReanalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(0);
  const [errors, setErrors] = useState(0);
  const [finished, setFinished] = useState(false);

  async function handleReanalyzeAll() {
    const analyzable = submissions.filter((s) => s.status !== 'pending');
    if (analyzable.length === 0) return;

    setReanalyzing(true);
    setProgress(0);
    setDone(0);
    setErrors(0);
    setFinished(false);
    let doneCount = 0;
    let errorCount = 0;

    for (const sub of analyzable) {
      try {
        const res = await fetch('/api/github/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submission_id: sub.id }),
        });
        if (!res.ok) errorCount++;
        else doneCount++;
      } catch {
        errorCount++;
      }
      setProgress(Math.round(((doneCount + errorCount) / analyzable.length) * 100));
      setDone(doneCount);
      setErrors(errorCount);
      // Rate-limit: wait 500ms between requests
      await new Promise((r) => setTimeout(r, 500));
    }

    setReanalyzing(false);
    setFinished(true);
  }

  function handleExportCSV() {
    const rows: string[] = [
      ['Student', 'Email', 'Status', 'Score', 'Overall', 'Consistency', 'Activity', 'Quality', 'Commits', 'Flags'].join(','),
    ];

    for (const sub of submissions) {
      const ana = sub.analytics;
      rows.push([
        `"${(sub.student_name ?? '').replace(/"/g, '""')}"`,
        `"${(sub.student_email ?? '').replace(/"/g, '""')}"`,
        sub.status,
        sub.score ?? '',
        ana?.overall_score ?? '',
        ana?.consistency_score ?? '',
        ana?.activity_score ?? '',
        ana?.quality_score ?? '',
        ana?.total_commits ?? '',
        ana?.suspicious_flags.length ?? 0,
      ].join(','));
    }

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignment-${assignmentId}-submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Re-analyze */}
      <button
        onClick={handleReanalyzeAll}
        disabled={reanalyzing}
        className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 disabled:opacity-60 transition-colors"
      >
        <RefreshCw size={14} className={reanalyzing ? 'animate-spin' : ''} />
        {reanalyzing ? `Re-analyzing… ${done}/${submissions.length}` : 'Re-analyze All'}
      </button>

      {/* Export CSV */}
      <button
        onClick={handleExportCSV}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
      >
        <Download size={14} />
        Export CSV
      </button>

      {/* Progress bar */}
      {reanalyzing && (
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{progress}%</span>
        </div>
      )}

      {/* Finished state */}
      {finished && !reanalyzing && (
        <div className={`flex items-center gap-1.5 text-sm ${errors > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {errors > 0 ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
          {errors > 0
            ? `${done} analyzed, ${errors} failed`
            : `All ${done} submissions re-analyzed`}
        </div>
      )}
    </div>
  );
}
