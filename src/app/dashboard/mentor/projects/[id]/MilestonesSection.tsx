'use client';

import { useEffect, useState } from 'react';
import { Flag, Plus, Loader2, X } from 'lucide-react';

interface Milestone {
  title: string;
  description: string | null;
  due_date: string | null;
  total: number;
  completed: number;
}

export default function MilestonesSection({ assignmentId }: { assignmentId: string }) {
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function load() {
    fetch(`/api/project-assignments/${assignmentId}/milestones`)
      .then((res) => res.json())
      .then((data) => setMilestones(data.milestones ?? []))
      .catch(() => setMilestones([]));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/project-assignments/${assignmentId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), due_date: dueDate || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add checkpoint');
      setTitle('');
      setDueDate('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add checkpoint');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Flag className="w-4 h-4 text-accent-purple" />
          Checkpoints
        </h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 text-sm font-medium text-accent-purple hover:opacity-80"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? 'Cancel' : 'Add checkpoint'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addMilestone} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Wire up the API"
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Add
          </button>
        </form>
      )}
      {error && <p className="text-xs text-destructive mb-3">{error}</p>}

      {milestones === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No checkpoints yet. Break this project into milestones so students get structure before the deadline.
        </p>
      ) : (
        <div className="space-y-2">
          {milestones.map((m) => (
            <div key={`${m.title}-${m.due_date}`} className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{m.title}</p>
                {m.due_date && (
                  <p className="text-xs text-muted-foreground">Due {new Date(m.due_date).toLocaleDateString()}</p>
                )}
              </div>
              <span className="text-xs font-semibold text-accent-purple flex-shrink-0">
                {m.completed}/{m.total} done
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
