'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EditPostModalProps {
  post: {
    id: string;
    title: string | null;
    content: string;
    type: string;
    created_at: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function EditPostModal({ post, onClose, onSuccess }: EditPostModalProps) {
  const supabase = createClient();
  const [title, setTitle] = useState(post.title || '');
  const [content, setContent] = useState(post.content);
  const [loading, setLoading] = useState(false);
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    // Check if post is within 3-hour edit window
    const createdAt = new Date(post.created_at);
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    
    if (createdAt < threeHoursAgo) {
      setCanEdit(false);
    }
  }, [post.created_at]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !canEdit) return;

    setLoading(true);
    try {
      const response = await fetch('/api/community-posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          title: title.trim() || null,
          content: content.trim(),
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update post');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      alert(error instanceof Error ? error.message : 'Failed to update post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] max-w-md w-full p-6">
          <h3 className="text-xl font-semibold text-[var(--cl-ink)] mb-4">Cannot Edit Post</h3>
          <p className="text-[var(--cl-body)] mb-6">
            Posts can only be edited within 3 hours of creation. This post is too old to edit.
          </p>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-[var(--cl-surface-strong)] hover:bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-[var(--cl-r-lg)] font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--cl-hairline)] sticky top-0 bg-[var(--cl-surface-card)] rounded-t-2xl">
          <h2 className="text-2xl font-semibold text-[var(--cl-ink)]">Edit Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--cl-surface-strong)] rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-[var(--cl-body)]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title (if question or announcement) */}
          {(post.type === 'question' || post.type === 'announcement') && (
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-[var(--cl-body)] mb-2">
                Title <span className="text-[var(--cl-error)]">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent"
              />
            </div>
          )}

          {post.type === 'normal' && (
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-[var(--cl-body)] mb-2">
                Title <span className="text-[var(--cl-muted-soft)]">(Optional)</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent"
              />
            </div>
          )}

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-semibold text-[var(--cl-body)] mb-2">
              Content <span className="text-[var(--cl-error)]">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={8}
              className="w-full px-4 py-3 rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] focus:border-transparent resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-[var(--cl-muted)]">
                {content.length} / 5000 characters
              </span>
            </div>
          </div>

          {/* Edit Notice */}
          <div className="bg-[rgba(171,100,0,0.12)] rounded-[var(--cl-r-lg)] p-4 border border-[var(--cl-warning)]">
            <p className="text-sm text-[var(--cl-warning)]">
              ℹ️ Edited posts will show an "edited" indicator. You can only edit within 3 hours of posting.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex-1 px-6 py-3 bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-[var(--cl-r-lg)] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-[var(--cl-surface-strong)] hover:bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-[var(--cl-r-lg)] font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
