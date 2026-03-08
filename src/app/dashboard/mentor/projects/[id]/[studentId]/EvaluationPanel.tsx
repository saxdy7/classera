'use client';

import { useState } from 'react';
import { Loader2, Save, MessageSquare, Star } from 'lucide-react';

interface EvaluationPanelProps {
  assignmentId: string;
  submissionId: string;
  studentId: string;
  maxScore: number;
  initial: {
    score: number | null;
    feedback: string | null;
    comments: Array<{ text: string; created_at: string }>;
  } | null;
}

export default function EvaluationPanel({
  assignmentId,
  submissionId,
  studentId,
  maxScore,
  initial,
}: EvaluationPanelProps) {
  const [score, setScore] = useState<string>(initial?.score?.toString() ?? '');
  const [feedback, setFeedback] = useState(initial?.feedback ?? '');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Array<{ text: string; created_at: string }>>(
    initial?.comments ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function save(opts: { withComment?: boolean } = {}) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/project-assignments/${assignmentId}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          student_id: studentId,
          score: score !== '' ? Number(score) : undefined,
          feedback: feedback || undefined,
          comment: opts.withComment ? comment : undefined,
        }),
      });
      const data = await res.json() as {
        evaluation?: { comments: Array<{ text: string; created_at: string }> };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Failed to save');
      if (data.evaluation?.comments) setComments(data.evaluation.comments);
      if (opts.withComment) setComment('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Score */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" />
          Score (out of {maxScore})
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={score}
            min={0}
            max={maxScore}
            onChange={(e) => setScore(e.target.value)}
            placeholder="—"
            className="w-24 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 text-center font-bold text-lg"
          />
          <span className="text-slate-400 text-sm">/ {maxScore}</span>
          {score !== '' && (
            <span className="text-sm text-violet-600 font-medium">
              {Math.round((Number(score) / maxScore) * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Feedback */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Written Feedback
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Provide detailed feedback on code quality, structure, collaboration, and areas for improvement..."
          rows={5}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={() => save()}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60 w-full justify-center"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save Evaluation'}
      </button>

      {/* Comments thread */}
      <div className="pt-2 border-t border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          Comments ({comments.length})
        </h3>

        {comments.length > 0 && (
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {comments.map((c, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3">
                <p className="text-sm text-slate-700">{c.text}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(c.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && comment.trim()) { e.preventDefault(); save({ withComment: true }); } }}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <button
            onClick={() => save({ withComment: true })}
            disabled={saving || !comment.trim()}
            className="px-3 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
