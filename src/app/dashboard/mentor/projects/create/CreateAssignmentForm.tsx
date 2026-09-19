'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Student {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface CreateAssignmentFormProps {
  students: Student[];
}

export default function CreateAssignmentForm({ students }: CreateAssignmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [techInput, setTechInput] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    technologies: [] as string[],
    deadline: '',
    max_score: 100,
    student_ids: [] as string[],
    submission_type: 'github' as 'github' | 'file_upload' | 'link' | 'written',
  });

  const SUBMISSION_TYPES: Array<{ value: typeof form.submission_type; label: string; hint: string }> = [
    { value: 'github', label: 'GitHub Repo', hint: 'Auto-analyzed: commits, code quality, AI review' },
    { value: 'file_upload', label: 'File Upload', hint: 'Student uploads a file directly' },
    { value: 'link', label: 'Link', hint: 'e.g. a deployed site or a doc' },
    { value: 'written', label: 'Written Response', hint: 'Free-text submission' },
  ];

  function addTech() {
    const t = techInput.trim();
    if (t && !form.technologies.includes(t)) {
      setForm((f) => ({ ...f, technologies: [...f.technologies, t] }));
    }
    setTechInput('');
  }

  function removeTech(t: string) {
    setForm((f) => ({ ...f, technologies: f.technologies.filter((x) => x !== t) }));
  }

  function toggleStudent(id: string) {
    setForm((f) => ({
      ...f,
      student_ids: f.student_ids.includes(id)
        ? f.student_ids.filter((s) => s !== id)
        : [...f.student_ids, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Title is required'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/project-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          deadline: form.deadline || null,
        }),
      });
      const data = await res.json() as { assignment?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to create');
      router.push(`/dashboard/mentor/projects/${data.assignment!.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Link
        href="/dashboard/mentor/projects"
        className="inline-flex items-center gap-2 text-sm text-[var(--cl-muted)] hover:text-[var(--cl-ink)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-[var(--cl-ink)]">Create Project Assignment</h1>
        <p className="text-[var(--cl-muted)] text-sm mt-1">
          Assign a coding project and track student GitHub repositories
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[rgba(239,68,68,0.12)] border border-[var(--cl-error)] rounded-[var(--cl-r-lg)] text-[var(--cl-error)] text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: project details */}
        <div className="space-y-5">
          <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-6 space-y-5">
            <h2 className="font-semibold text-[var(--cl-ink)]">Project Details</h2>

            <div>
              <label className="block text-sm font-medium text-[var(--cl-body)] mb-1.5">
                Title <span className="text-[var(--cl-error)]">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Full-Stack Todo App"
                className="w-full px-3.5 py-2.5 border border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--cl-body)] mb-1.5">How will students submit?</label>
              <div className="grid grid-cols-2 gap-2">
                {SUBMISSION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, submission_type: t.value }))}
                    className={`text-left p-3 rounded-[var(--cl-r-lg)] border transition-colors ${
                      form.submission_type === t.value
                        ? 'border-[var(--cl-primary)] bg-[var(--cl-primary-soft)]'
                        : 'border-[var(--cl-hairline)] hover:bg-[var(--cl-canvas-soft)]'
                    }`}
                  >
                    <p className="text-sm font-medium text-[var(--cl-ink)]">{t.label}</p>
                    <p className="text-xs text-[var(--cl-muted)] mt-0.5">{t.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--cl-body)] mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What should the student build?"
                rows={3}
                className="w-full px-3.5 py-2.5 border border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--cl-body)] mb-1.5">
                Requirements & Guidelines
              </label>
              <textarea
                value={form.requirements}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                placeholder="Specific requirements, grading criteria, tech stack constraints..."
                rows={4}
                className="w-full px-3.5 py-2.5 border border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--cl-body)] mb-1.5">Deadline</label>
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--cl-body)] mb-1.5">Max Score</label>
                <input
                  type="number"
                  value={form.max_score}
                  min={1}
                  max={1000}
                  onChange={(e) => setForm((f) => ({ ...f, max_score: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 border border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent"
                />
              </div>
            </div>

            {/* Technologies */}
            <div>
              <label className="block text-sm font-medium text-[var(--cl-body)] mb-1.5">
                Required Technologies
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }}
                  placeholder="React, Node.js, Python..."
                  className="flex-1 px-3.5 py-2.5 border border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)]"
                />
                <button
                  type="button"
                  onClick={addTech}
                  className="px-3 py-2 bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] rounded-[var(--cl-r-lg)] hover:bg-[var(--cl-primary)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {form.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.technologies.map((t) => (
                    <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-[var(--cl-primary-soft)] text-[var(--cl-primary)] rounded-full text-xs font-medium">
                      {t}
                      <button type="button" onClick={() => removeTech(t)} className="hover:text-[var(--cl-ink)]">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: assign students */}
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--cl-ink)]">Assign to Students</h2>
            <span className="text-xs text-[var(--cl-muted)]">{form.student_ids.length} selected</span>
          </div>

          {students.length === 0 ? (
            <p className="text-sm text-[var(--cl-muted)] text-center py-8">No students in your university yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((s) => {
                const selected = form.student_ids.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 p-3 rounded-[var(--cl-r-lg)] cursor-pointer transition-colors ${
                      selected ? 'bg-[var(--cl-primary-soft)] border border-[var(--cl-primary)]' : 'hover:bg-[var(--cl-canvas-soft)] border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleStudent(s.id)}
                      className="w-4 h-4 text-[var(--cl-primary)] rounded accent-[var(--cl-primary)]"
                    />
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.full_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--cl-primary-soft)] flex items-center justify-center text-xs font-semibold text-[var(--cl-primary)]">
                        {s.full_name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--cl-ink)] truncate">{s.full_name}</p>
                      <p className="text-xs text-[var(--cl-muted)] truncate">{s.email}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Link
          href="/dashboard/mentor/projects"
          className="px-5 py-2.5 border border-[var(--cl-hairline)] rounded-[var(--cl-r-lg)] text-sm font-medium text-[var(--cl-body)] hover:bg-[var(--cl-canvas-soft)] transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] text-sm font-medium transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create Assignment
        </button>
      </div>
    </form>
  );
}
