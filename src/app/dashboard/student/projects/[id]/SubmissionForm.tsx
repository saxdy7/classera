'use client';

import { useState } from 'react';
import { Loader2, GitBranch, Send, Link as LinkIcon, FileText, Upload } from 'lucide-react';

type SubmissionType = 'github' | 'file_upload' | 'link' | 'written';

interface SubmissionFormProps {
  assignmentId: string;
  submissionType: SubmissionType;
  existing?: {
    repo_url?: string | null;
    submission_url?: string | null;
    submission_text?: string | null;
    file_name?: string | null;
    deploy_url?: string | null;
  };
}

export default function SubmissionForm({ assignmentId, submissionType, existing }: SubmissionFormProps) {
  const [repoUrl, setRepoUrl] = useState(existing?.repo_url ?? '');
  const [submissionUrl, setSubmissionUrl] = useState(existing?.submission_url ?? '');
  const [submissionText, setSubmissionText] = useState(existing?.submission_text ?? '');
  const [deployUrl, setDeployUrl] = useState(existing?.deploy_url ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [existingFileName] = useState(existing?.file_name ?? null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { deploy_url: deployUrl.trim() || undefined };

      if (submissionType === 'github') {
        if (!repoUrl.trim()) throw new Error('Repository URL is required');
        body.repo_url = repoUrl.trim();
      } else if (submissionType === 'link') {
        if (!submissionUrl.trim()) throw new Error('A link is required');
        body.submission_url = submissionUrl.trim();
      } else if (submissionType === 'written') {
        if (!submissionText.trim()) throw new Error('A response is required');
        body.submission_text = submissionText.trim();
      } else if (submissionType === 'file_upload') {
        if (!file && !existingFileName) throw new Error('Choose a file to upload');
        if (file) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'file');
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error ?? 'File upload failed');
          body.file_url = uploadData.url;
          body.file_name = uploadData.name;
        }
      }

      const res = await fetch(`/api/project-assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to submit');
      setSuccess(true);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-600">
        <Send className="w-5 h-5 text-green-600" />
        <div>
          <p className="text-sm font-semibold text-green-600">Submitted!</p>
          <p className="text-xs text-green-600 mt-0.5">
            {submissionType === 'github' ? 'Analysis will begin shortly…' : 'Your mentor has been notified.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {submissionType === 'github' && (
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">GitHub Repository URL</label>
          <div className="relative">
            <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground/70 mt-1.5">
            Public repositories work immediately. Private repositories also work as long as your GitHub account is connected above.
          </p>
        </div>
      )}

      {submissionType === 'link' && (
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">Submission Link</label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <input
              type="url"
              value={submissionUrl}
              onChange={(e) => setSubmissionUrl(e.target.value)}
              placeholder="https://…"
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </div>
      )}

      {submissionType === 'written' && (
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">Your Response</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/70" />
            <textarea
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              rows={6}
              placeholder="Write your response…"
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              required
            />
          </div>
        </div>
      )}

      {submissionType === 'file_upload' && (
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">Upload File</label>
          <label className="flex items-center gap-3 p-3.5 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/40 transition-colors">
            <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground/80 truncate">
              {file?.name ?? existingFileName ?? 'Choose a file (max 10MB)'}
            </span>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground/80 mb-2">
          Live preview link <span className="text-muted-foreground/70 font-normal">(optional)</span>
        </label>
        <input
          type="url"
          value={deployUrl}
          onChange={(e) => setDeployUrl(e.target.value)}
          placeholder="https://your-project.vercel.app"
          className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {existing ? 'Update Submission' : 'Submit'}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </form>
  );
}
