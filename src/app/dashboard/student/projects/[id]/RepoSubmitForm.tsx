'use client';

import { useState } from 'react';
import { Loader2, GitBranch, Send, ExternalLink, AlertCircle } from 'lucide-react';

interface RepoSubmitFormProps {
  assignmentId: string;
  existingUrl?: string | null;
}

export default function RepoSubmitForm({ assignmentId, existingUrl }: RepoSubmitFormProps) {
  const [url, setUrl] = useState(existingUrl ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/project-assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: url.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit');
      setSuccess(true);
      // Reload after a short delay
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
        <GitBranch className="w-5 h-5 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Repository submitted!</p>
          <p className="text-xs text-emerald-600 mt-0.5">Analysis will begin shortly…</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          GitHub Repository URL
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !url.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60 flex-shrink-0"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {existingUrl ? 'Update' : 'Submit'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          Public or private repositories are accepted. Make sure your GitHub account is connected.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </form>
  );
}
