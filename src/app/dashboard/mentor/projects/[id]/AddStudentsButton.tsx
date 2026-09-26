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
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground/80 text-sm font-medium rounded-lg hover:bg-muted/40 transition-colors"
      >
        <UserPlus size={15} className="text-accent-purple" />
        Add Students
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-semibold text-foreground">Add students to this project</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {eligibleStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  Everyone at your university is already assigned to this project.
                </p>
              ) : (
                eligibleStudents.map((student) => {
                  const isSelected = selected.has(student.id);
                  return (
                    <button
                      key={student.id}
                      onClick={() => toggle(student.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        isSelected ? 'bg-accent-purple/10' : 'hover:bg-muted/40'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-primary border-accent-purple' : 'border-border'
                        }`}
                      >
                        {isSelected && <Check size={12} className="text-primary-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {error && <p className="px-5 pb-2 text-xs text-destructive">{error}</p>}

            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-foreground/80 rounded-lg hover:bg-muted/40"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={selected.size === 0 || submitting}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg disabled:opacity-50"
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
