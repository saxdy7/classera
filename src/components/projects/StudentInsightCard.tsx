'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface StudentInsightCardProps {
  submissionId: string | null;
  cachedNote: string | null;
  grade: string | null;
  analyzedCount: number;
}

export default function StudentInsightCard({ submissionId, cachedNote, grade, analyzedCount }: StudentInsightCardProps) {
  const [note, setNote] = useState<string | null>(cachedNote);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!submissionId || cachedNote) return;
    let cancelled = false;
    setLoading(true);
    fetch('/api/github/student-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: submissionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.insight?.note) setNote(data.insight.note);
        else setFailed(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [submissionId, cachedNote]);

  const fallbackText =
    analyzedCount > 0
      ? `Average quality score across ${analyzedCount} analyzed repositor${analyzedCount === 1 ? 'y' : 'ies'}.`
      : 'Submit a repository to a project to see your analytics here.';

  return (
    <div className="p-6 bg-[var(--cl-surface-card)] border border-[var(--cl-primary)] rounded-[var(--cl-r-xl)]">
      <div className="flex justify-between items-end mb-4">
        <p className="text-[10px] font-semibold uppercase text-[var(--cl-primary)]">Quality Grade</p>
        <Sparkles className="text-[var(--cl-primary)] w-6 h-6" />
      </div>
      <p className="text-4xl font-semibold italic text-[var(--cl-on-dark)] mb-4">{grade ?? 'N/A'}</p>
      {loading ? (
        <div className="flex items-center gap-2 text-[11px] text-[var(--cl-muted-soft)]">
          <Loader2 className="w-3 h-3 animate-spin" />
          Generating a personal note…
        </div>
      ) : (
        <p className="text-[11px] leading-relaxed text-[var(--cl-muted-soft)] font-medium">
          {!failed && note ? note : fallbackText}
        </p>
      )}
    </div>
  );
}
