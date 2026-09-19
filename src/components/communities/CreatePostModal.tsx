'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileUpload } from './FileUpload';
import {
  X,
  Image as ImageIcon,
  FileText,
  HelpCircle,
  Megaphone,
  Loader2,
  Sparkles
} from 'lucide-react';

interface CreatePostModalProps {
  communityId: string;
  userId: string;
  userRole: 'student' | 'mentor';
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePostModal({
  communityId,
  userId,
  userRole,
  onClose,
  onSuccess
}: CreatePostModalProps) {
  const supabase = createClient();
  const [postType, setPostType] = useState<'normal' | 'question' | 'announcement'>('normal');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      // Use API endpoint for proper validation and mention processing
      const response = await fetch('/api/community-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          community_id: communityId,
          title: title.trim() || null,
          content: content.trim(),
          type: postType,
          images: images.length > 0 ? images : null,
          files: files.length > 0 ? files : null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create post');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating post:', error);
      alert(error.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(10,10,10,0.4)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--cl-surface-card)] rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--cl-hairline)]">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-[var(--cl-hairline)] sticky top-0 bg-[rgba(255,255,255,0.8)] backdrop-blur-md z-30">
          <h2 className="text-3xl font-semibold text-[var(--cl-ink)] tracking-tight uppercase">Create <span className="text-[var(--cl-primary)]">Post</span></h2>
          <button
            onClick={onClose}
            className="p-3 hover:bg-[var(--cl-surface-strong)] text-[var(--cl-muted-soft)] hover:text-[var(--cl-ink)] rounded-[var(--cl-r-xl)] transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Post Type Selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--cl-muted-soft)] uppercase tracking-[0.2em] mb-4">
              Post Type
            </label>
            <div className={`grid ${userRole === 'mentor' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
              <button
                type="button"
                onClick={() => setPostType('normal')}
                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center group ${postType === 'normal'
                  ? 'border-[var(--cl-primary)] bg-[var(--cl-surface-card)]'
                  : 'border-[var(--cl-hairline)] hover:border-[var(--cl-hairline-strong)] bg-[rgba(250,250,247,0.5)]'
                  }`}
              >
                <div className={`w-12 h-12 rounded-[var(--cl-r-xl)] flex items-center justify-center mb-3 transition-colors ${postType === 'normal' ? 'bg-[var(--cl-primary)] text-[var(--cl-on-dark)]' : 'bg-[var(--cl-surface-card)] text-[var(--cl-muted-soft)] group-hover:text-[var(--cl-body)]'}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-[var(--cl-ink)] uppercase tracking-tight">Normal</div>
                <div className="text-[10px] text-[var(--cl-muted)] font-semibold uppercase tracking-widest mt-1">Share thoughts</div>
              </button>

              <button
                type="button"
                onClick={() => setPostType('question')}
                className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center group ${postType === 'question'
                  ? 'border-[var(--cl-success)] bg-[rgba(22,163,74,0.5)]'
                  : 'border-[var(--cl-hairline)] hover:border-[var(--cl-hairline-strong)] bg-[rgba(250,250,247,0.5)]'
                  }`}
              >
                <div className={`w-12 h-12 rounded-[var(--cl-r-xl)] flex items-center justify-center mb-3 transition-colors ${postType === 'question' ? 'bg-[var(--cl-success)] text-[var(--cl-on-dark)]' : 'bg-[var(--cl-surface-card)] text-[var(--cl-muted-soft)] group-hover:text-[var(--cl-body)]'}`}>
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-[var(--cl-ink)] uppercase tracking-tight">Question</div>
                <div className="text-[10px] text-[var(--cl-muted)] font-semibold uppercase tracking-widest mt-1">Ask for help</div>
              </button>

              {userRole === 'mentor' && (
                <button
                  type="button"
                  onClick={() => setPostType('announcement')}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center text-center group ${postType === 'announcement'
                    ? 'border-[var(--cl-warning)] bg-[rgba(171,100,0,0.5)]'
                    : 'border-[var(--cl-hairline)] hover:border-[var(--cl-hairline-strong)] bg-[rgba(250,250,247,0.5)]'
                    }`}
                >
                  <div className={`w-12 h-12 rounded-[var(--cl-r-xl)] flex items-center justify-center mb-3 transition-colors ${postType === 'announcement' ? 'bg-[var(--cl-warning)] text-[var(--cl-on-dark)]' : 'bg-[var(--cl-surface-card)] text-[var(--cl-muted-soft)] group-hover:text-[var(--cl-body)]'}`}>
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-[var(--cl-ink)] uppercase tracking-tight">Alert</div>
                  <div className="text-[10px] text-[var(--cl-muted)] font-semibold uppercase tracking-widest mt-1">Official</div>
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-xs font-semibold text-[var(--cl-muted-soft)] uppercase tracking-[0.2em] mb-3">
              Title {(postType === 'question' || postType === 'announcement') ? <span className="text-[var(--cl-error)]">*</span> : <span className="italic opacity-60">(Optional)</span>}
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                postType === 'question'
                  ? 'e.g., How do I implement authentication in Next.js?'
                  : postType === 'announcement'
                    ? 'e.g., Important: Class Schedule Update'
                    : 'Give your post a catchy title...'
              }
              required={postType === 'question' || postType === 'announcement'}
              className="w-full px-6 py-4 rounded-[var(--cl-r-xl)] bg-[var(--cl-canvas-soft)] border border-[var(--cl-hairline)] focus:outline-none focus:ring-4 focus:ring-[var(--cl-primary)] focus:border-[var(--cl-primary)] transition-all font-semibold text-[var(--cl-body)] placeholder:text-[var(--cl-muted-soft)]"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-xs font-semibold text-[var(--cl-muted-soft)] uppercase tracking-[0.2em] mb-3">
              {postType === 'question' ? 'Question Details' : 'Description'} <span className="text-[var(--cl-error)]">*</span>
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                postType === 'question'
                  ? 'Describe your question in detail. Include what you\'ve tried and any error messages...'
                  : postType === 'announcement'
                    ? 'Write your announcement here...'
                    : 'What\'s on your mind? Share something amazing...'
              }
              required
              rows={6}
              className="w-full px-6 py-5 rounded-[1.5rem] bg-[var(--cl-canvas-soft)] border border-[var(--cl-hairline)] focus:outline-none focus:ring-4 focus:ring-[var(--cl-primary)] focus:border-[var(--cl-primary)] transition-all font-medium text-[var(--cl-body)] placeholder:text-[var(--cl-muted-soft)] leading-relaxed resize-none"
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-[10px] font-semibold text-[var(--cl-muted-soft)] uppercase tracking-widest">
                {content.length} / 5000
              </span>
              {postType === 'question' && (
                <span className="text-[10px] font-semibold text-[var(--cl-primary)] uppercase tracking-widest flex items-center gap-1.5 bg-[var(--cl-primary-soft)] px-2 py-1 rounded-lg">
                  <Sparkles size={10} /> Clear questions get better answers
                </span>
              )}
            </div>
          </div>

          {/* Media Attachments */}
          <div>
            <label className="block text-xs font-semibold text-[var(--cl-muted-soft)] uppercase tracking-[0.2em] mb-4">
              Attachments <span className="italic opacity-60">(Optional)</span>
            </label>
            <FileUpload 
              onFilesChange={(newImages, newFiles) => {
                setImages(newImages);
                setFiles(newFiles);
              }} 
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 sticky bottom-0 bg-[var(--cl-surface-card)]">
            <button
              type="submit"
              disabled={loading || !content.trim() || ((postType === 'question' || postType === 'announcement') && !title.trim())}
              className="flex-1 px-8 py-5 text-[var(--cl-on-dark)] rounded-[var(--cl-r-xl)] font-semibold text-sm uppercase tracking-[0.15em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98] bg-[var(--cl-primary)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                'Create Post'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-8 py-5 bg-[var(--cl-surface-strong)] hover:bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-[var(--cl-r-xl)] font-semibold text-sm uppercase tracking-[0.15em] transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
