'use client';

import { useState } from 'react';
import { Flag, X } from 'lucide-react';

interface ReportPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
  commentId?: string;
  communityId: string;
  contentType: 'post' | 'comment';
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or Bullying' },
  { value: 'inappropriate', label: 'Inappropriate Content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'hate_speech', label: 'Hate Speech' },
  { value: 'violence', label: 'Violence or Harm' },
  { value: 'other', label: 'Other' }
];

export function ReportPostModal({
  isOpen,
  onClose,
  postId,
  commentId,
  communityId,
  contentType
}: ReportPostModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/community-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          communityId,
          postId: contentType === 'post' ? postId : null,
          commentId: contentType === 'comment' ? commentId : null,
          reason,
          description: description || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit report');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setReason('');
        setDescription('');
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card dark:bg-neutral-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card dark:bg-neutral-900 border-b border-border dark:border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground dark:text-white">
              Report {contentType}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted dark:hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="bg-green-500/10 dark:bg-[rgba(22,163,74,0.2)] border border-green-600 dark:border-green-600 rounded-lg p-4 text-center">
              <p className="text-green-600 dark:text-green-600 font-medium">
                Thank you for your report. Our moderation team will review it shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 dark:text-muted-foreground/70 mb-2">
                  Reason for Report *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-border dark:border-border rounded-lg bg-card dark:bg-neutral-900 text-foreground dark:text-white focus:ring-2 focus:ring-[var(--cl-info)] focus:border-transparent transition-colors"
                >
                  <option value="">Select a reason...</option>
                  {REPORT_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground/80 dark:text-muted-foreground/70 mb-2">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide more context to help our moderation team..."
                  rows={4}
                  className="w-full px-4 py-2 border border-border dark:border-border rounded-lg bg-card dark:bg-neutral-900 text-foreground dark:text-white placeholder-muted-foreground dark:placeholder-muted-foreground focus:ring-2 focus:ring-[var(--cl-info)] focus:border-transparent transition-colors resize-none"
                />
                <p className="text-xs text-muted-foreground dark:text-muted-foreground/70 mt-1">
                  {description.length}/500 characters
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 dark:bg-[rgba(239,68,68,0.2)] border border-destructive dark:border-destructive rounded-lg p-3">
                  <p className="text-destructive dark:text-destructive text-sm">{error}</p>
                </div>
              )}

              {/* Info */}
              <div className="bg-accent-purple/10 dark:bg-[rgba(13,116,206,0.2)] border border-accent-purple dark:border-accent-purple rounded-lg p-3">
                <p className="text-accent-purple dark:text-accent-purple text-xs">
                  Your report will be reviewed by the community mentor. Thank you for helping keep our community safe.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-border dark:border-border rounded-lg text-foreground/80 dark:text-muted-foreground/70 hover:bg-muted/40 dark:hover:bg-neutral-900 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !reason}
                  className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive disabled:bg-muted text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
