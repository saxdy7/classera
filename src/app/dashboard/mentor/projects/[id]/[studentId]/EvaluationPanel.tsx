'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, MessageSquare, Star, Award } from 'lucide-react';

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  max_points: number;
  weight: number;
}

interface Rubric {
  id: string;
  criteria: RubricCriterion[];
}

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

  // Rubric state
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [criterionScores, setCriterionScores] = useState<Record<string, { score: number; comment: string }>>({});

  // Fetch rubric on mount
  useEffect(() => {
    async function fetchRubric() {
      try {
        const res = await fetch(
          `/api/projects/rubrics?assignment_id=${assignmentId}&submission_id=${submissionId}`,
        );
        if (!res.ok) return;
        const data = await res.json() as {
          rubric: Rubric | null;
          scores: Record<string, { score: number; comment: string }> | null;
        };
        if (data.rubric) {
          setRubric(data.rubric);
          // Initialize scores from existing data or default to 0
          const init: Record<string, { score: number; comment: string }> = {};
          for (const c of data.rubric.criteria) {
            init[c.id] = data.scores?.[c.id] ?? { score: 0, comment: '' };
          }
          setCriterionScores(init);
        }
      } catch {
        // silently ignore — rubric is optional
      }
    }
    fetchRubric();
  }, [assignmentId, submissionId]);

  // Compute weighted score from rubric
  function computeRubricScore(): number {
    if (!rubric) return 0;
    const weighted = rubric.criteria.reduce((sum, c) => {
      const s = criterionScores[c.id]?.score ?? 0;
      return sum + (s / c.max_points) * c.weight;
    }, 0);
    // weighted is 0-100 (% of max), convert to maxScore points
    return Math.round((weighted / 100) * maxScore);
  }

  function applyRubricScore() {
    setScore(computeRubricScore().toString());
  }

  async function save(opts: { withComment?: boolean } = {}) {
    setSaving(true);
    setError('');
    try {
      // Save rubric scores first if applicable
      if (rubric) {
        const scores = rubric.criteria.map((c) => ({
          criterion_id: c.id,
          score: criterionScores[c.id]?.score ?? 0,
          comment: criterionScores[c.id]?.comment ?? '',
        }));
        await fetch('/api/projects/rubrics/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submission_id: submissionId, rubric_id: rubric.id, scores }),
        });
      }

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
      {/* Rubric scoring section */}
      {rubric && rubric.criteria.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--cl-body)] flex items-center gap-2">
              <Award className="w-4 h-4 text-[var(--cl-primary)]" />
              Rubric Scoring
            </h3>
            <button
              onClick={applyRubricScore}
              className="text-xs text-[var(--cl-primary)] font-medium hover:underline"
            >
              Apply score ({computeRubricScore()}/{maxScore})
            </button>
          </div>

          {rubric.criteria.map((c) => {
            const cs = criterionScores[c.id] ?? { score: 0, comment: '' };
            const pct = c.max_points > 0 ? Math.round((cs.score / c.max_points) * 100) : 0;
            return (
              <div key={c.id} className="bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-lg)] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--cl-ink)]">{c.name}</p>
                    {c.description && (
                      <p className="text-xs text-[var(--cl-muted)]">{c.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-[var(--cl-muted)]">
                    weight: <span className="font-medium">{c.weight}%</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={c.max_points}
                    step={1}
                    value={cs.score}
                    onChange={(e) =>
                      setCriterionScores((prev) => ({
                        ...prev,
                        [c.id]: { ...prev[c.id], score: Number(e.target.value) },
                      }))
                    }
                    className="flex-1 accent-[var(--cl-primary)]"
                  />
                  <span className="text-sm font-semibold text-[var(--cl-primary)] w-16 text-right">
                    {cs.score}/{c.max_points}
                    <span className="font-normal text-[var(--cl-muted)] ml-1">({pct}%)</span>
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Comment for this criterion (optional)"
                  value={cs.comment}
                  onChange={(e) =>
                    setCriterionScores((prev) => ({
                      ...prev,
                      [c.id]: { ...prev[c.id], comment: e.target.value },
                    }))
                  }
                  className="w-full text-xs border border-[var(--cl-hairline)] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] placeholder-[var(--cl-muted-soft)]"
                />
              </div>
            );
          })}

          <div className="flex items-center justify-between bg-[var(--cl-primary-soft)] border border-[var(--cl-primary)] rounded-[var(--cl-r-lg)] px-3 py-2">
            <span className="text-sm text-[var(--cl-primary)] font-medium">Rubric computed score</span>
            <span className="text-sm font-semibold text-[var(--cl-primary)]">
              {computeRubricScore()} / {maxScore}
            </span>
          </div>
        </div>
      )}

      {/* Score */}
      <div>
        <label className="block text-sm font-semibold text-[var(--cl-body)] mb-2 flex items-center gap-2">
          <Star className="w-4 h-4 text-[var(--cl-warning)]" />
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
            className="w-24 px-3 py-2.5 border border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] text-center font-semibold text-lg"
          />
          <span className="text-[var(--cl-muted)] text-sm">/ {maxScore}</span>
          {score !== '' && (
            <span className="text-sm text-[var(--cl-primary)] font-medium">
              {Math.round((Number(score) / maxScore) * 100)}%
            </span>
          )}
        </div>
      </div>

      {/* Feedback */}
      <div>
        <label className="block text-sm font-semibold text-[var(--cl-body)] mb-2">
          Written Feedback
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Provide detailed feedback on code quality, structure, collaboration, and areas for improvement..."
          rows={5}
          className="w-full px-3.5 py-2.5 border border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] resize-none"
        />
      </div>

      {error && <p className="text-sm text-[var(--cl-error)]">{error}</p>}

      <button
        onClick={() => save()}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] text-sm font-medium transition-colors disabled:opacity-60 w-full justify-center"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save Evaluation'}
      </button>

      {/* Comments thread */}
      <div className="pt-2 border-t border-[var(--cl-hairline)]">
        <h3 className="text-sm font-semibold text-[var(--cl-body)] mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[var(--cl-muted-soft)]" />
          Comments ({comments.length})
        </h3>

        {comments.length > 0 && (
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {comments.map((c, i) => (
              <div key={i} className="bg-[var(--cl-canvas-soft)] rounded-[var(--cl-r-lg)] p-3">
                <p className="text-sm text-[var(--cl-body)]">{c.text}</p>
                <p className="text-xs text-[var(--cl-muted)] mt-1">
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
            className="flex-1 px-3 py-2 border border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)]"
          />
          <button
            onClick={() => save({ withComment: true })}
            disabled={saving || !comment.trim()}
            className="px-3 py-2 bg-[var(--cl-primary-soft)] hover:bg-[var(--cl-primary)] text-[var(--cl-primary)] rounded-[var(--cl-r-lg)] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
