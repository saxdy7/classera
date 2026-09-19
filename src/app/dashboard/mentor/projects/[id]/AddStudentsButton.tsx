'use client';

import { useState } from 'react';
import { UserPlus, X, Loader2, Check } from 'lucide-react';

interface EligibleStudent {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

export default function AddStudentsButton({
  assignmentId,
  eligibleStudents,
}: {
  assignmentId: string;
  eligibleStudents: EligibleStudent[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/project-assignments/${assignmentId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_ids: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add students');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add students');
      setSubmitting(false);
    }
  }

  if (eligibleStudents.length === 0 && !open) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)] text-[var(--cl-body)] text-sm font-medium rounded-[var(--cl-r-lg)] hover:bg-[var(--cl-canvas-soft)] transition-colors"
      >
        <UserPlus size={15} className="text-[var(--cl-primary)]" />
        Add Students
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--cl-scrim)] p-4">
          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[var(--cl-hairline)]">
              <h3 className="font-semibold text-[var(--cl-ink)]">Add students to this project</h3>
              <button onClick={() => setOpen(false)} className="text-[var(--cl-muted)] hover:text-[var(--cl-ink)]">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {eligibleStudents.length === 0 ? (
                <p className="text-sm text-[var(--cl-muted)] p-4 text-center">
                  Everyone at your university is already assigned to this project.
                </p>
              ) : (
                eligibleStudents.map((student) => {
                  const isSelected = selected.has(student.id);
                  return (
                    <button
                      key={student.id}
                      onClick={() => toggle(student.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-[var(--cl-r-lg)] transition-colors text-left ${
                        isSelected ? 'bg-[var(--cl-primary-soft)]' : 'hover:bg-[var(--cl-canvas-soft)]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-[var(--cl-r-xs)] border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-[var(--cl-primary)] border-[var(--cl-primary)]' : 'border-[var(--cl-hairline-strong)]'
                        }`}
                      >
                        {isSelected && <Check size={12} className="text-[var(--cl-on-primary)]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--cl-ink)] truncate">{student.full_name}</p>
                        <p className="text-xs text-[var(--cl-muted)] truncate">{student.email}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {error && <p className="px-5 pb-2 text-xs text-[var(--cl-error)]">{error}</p>}

            <div className="p-4 border-t border-[var(--cl-hairline)] flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--cl-body)] rounded-[var(--cl-r-lg)] hover:bg-[var(--cl-canvas-soft)]"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={selected.size === 0 || submitting}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--cl-primary)] text-[var(--cl-on-primary)] text-sm font-semibold rounded-[var(--cl-r-lg)] disabled:opacity-50"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Add {selected.size > 0 ? `(${selected.size})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
