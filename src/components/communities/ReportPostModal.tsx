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
      <div className="bg-[var(--cl-surface-card)] dark:bg-[var(--cl-surface-inverse)] rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--cl-surface-card)] dark:bg-[var(--cl-surface-inverse)] border-b border-[var(--cl-hairline)] dark:border-[var(--cl-hairline-strong)] p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-[var(--cl-error)]" />
            <h2 className="text-lg font-semibold text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)]">
              Report {contentType}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--cl-surface-strong)] dark:hover:bg-[var(--cl-surface-inverse)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="bg-[rgba(22,163,74,0.12)] dark:bg-[rgba(22,163,74,0.2)] border border-[var(--cl-success)] dark:border-[var(--cl-success)] rounded-lg p-4 text-center">
              <p className="text-[var(--cl-success)] dark:text-[var(--cl-success)] font-medium">
                Thank you for your report. Our moderation team will review it shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] mb-2">
                  Reason for Report *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--cl-hairline-strong)] dark:border-[var(--cl-hairline-strong)] rounded-lg bg-[var(--cl-surface-card)] dark:bg-[var(--cl-surface-inverse)] text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)] focus:ring-2 focus:ring-[var(--cl-info)] focus:border-transparent transition-colors"
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
                <label className="block text-sm font-medium text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] mb-2">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide more context to help our moderation team..."
                  rows={4}
                  className="w-full px-4 py-2 border border-[var(--cl-hairline-strong)] dark:border-[var(--cl-hairline-strong)] rounded-lg bg-[var(--cl-surface-card)] dark:bg-[var(--cl-surface-inverse)] text-[var(--cl-ink)] dark:text-[var(--cl-on-dark)] placeholder-[var(--cl-muted-soft)] dark:placeholder-[var(--cl-muted-soft)] focus:ring-2 focus:ring-[var(--cl-info)] focus:border-transparent transition-colors resize-none"
                />
                <p className="text-xs text-[var(--cl-muted)] dark:text-[var(--cl-muted-soft)] mt-1">
                  {description.length}/500 characters
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-[rgba(239,68,68,0.12)] dark:bg-[rgba(239,68,68,0.2)] border border-[var(--cl-error)] dark:border-[var(--cl-error)] rounded-lg p-3">
                  <p className="text-[var(--cl-error)] dark:text-[var(--cl-error)] text-sm">{error}</p>
                </div>
              )}

              {/* Info */}
              <div className="bg-[rgba(13,116,206,0.12)] dark:bg-[rgba(13,116,206,0.2)] border border-[var(--cl-info)] dark:border-[var(--cl-info)] rounded-lg p-3">
                <p className="text-[var(--cl-info)] dark:text-[var(--cl-info)] text-xs">
                  Your report will be reviewed by the community mentor. Thank you for helping keep our community safe.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-[var(--cl-hairline-strong)] dark:border-[var(--cl-hairline-strong)] rounded-lg text-[var(--cl-body)] dark:text-[var(--cl-muted-soft)] hover:bg-[var(--cl-canvas-soft)] dark:hover:bg-[var(--cl-surface-inverse)] font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !reason}
                  className="flex-1 px-4 py-2 bg-[var(--cl-error)] hover:bg-[var(--cl-error)] disabled:bg-[var(--cl-surface-strong)] text-[var(--cl-on-dark)] rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
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
