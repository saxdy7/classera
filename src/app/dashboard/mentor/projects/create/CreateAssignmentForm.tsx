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
  });

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
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Projects
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Project Assignment</h1>
        <p className="text-slate-500 text-sm mt-1">
          Assign a coding project and track student GitHub repositories
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: project details */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
            <h2 className="font-semibold text-slate-800">Project Details</h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Full-Stack Todo App"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What should the student build?"
                rows={3}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Requirements & Guidelines
              </label>
              <textarea
                value={form.requirements}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                placeholder="Specific requirements, grading criteria, tech stack constraints..."
                rows={4}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
                <input
                  type="datetime-local"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Score</label>
                <input
                  type="number"
                  value={form.max_score}
                  min={1}
                  max={1000}
                  onChange={(e) => setForm((f) => ({ ...f, max_score: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Technologies */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Required Technologies
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }}
                  placeholder="React, Node.js, Python..."
                  className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
                <button
                  type="button"
                  onClick={addTech}
                  className="px-3 py-2 bg-violet-100 text-violet-700 rounded-xl hover:bg-violet-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {form.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.technologies.map((t) => (
                    <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                      {t}
                      <button type="button" onClick={() => removeTech(t)} className="hover:text-violet-900">
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
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Assign to Students</h2>
            <span className="text-xs text-slate-500">{form.student_ids.length} selected</span>
          </div>

          {students.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No students in your university yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {students.map((s) => {
                const selected = form.student_ids.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      selected ? 'bg-violet-50 border border-violet-200' : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleStudent(s.id)}
                      className="w-4 h-4 text-violet-600 rounded accent-violet-600"
                    />
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt={s.full_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">
                        {s.full_name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{s.full_name}</p>
                      <p className="text-xs text-slate-400 truncate">{s.email}</p>
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
          className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create Assignment
        </button>
      </div>
    </form>
  );
}
