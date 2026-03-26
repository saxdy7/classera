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
  Loader2
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-2xl font-bold text-slate-900">Create Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Post Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPostType('normal')}
                className={`p-4 rounded-xl border-2 transition-all ${postType === 'normal'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <FileText className={`w-6 h-6 mx-auto mb-2 ${postType === 'normal' ? 'text-indigo-600' : 'text-slate-600'
                  }`} />
                <div className="text-sm font-semibold text-slate-900">Normal</div>
                <div className="text-xs text-slate-500">Share thoughts</div>
              </button>

              <button
                type="button"
                onClick={() => setPostType('question')}
                className={`p-4 rounded-xl border-2 transition-all ${postType === 'question'
                  ? 'border-green-500 bg-green-50'
                  : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <HelpCircle className={`w-6 h-6 mx-auto mb-2 ${postType === 'question' ? 'text-green-600' : 'text-slate-600'
                  }`} />
                <div className="text-sm font-semibold text-slate-900">Question</div>
                <div className="text-xs text-slate-500">Ask for help</div>
              </button>

              {userRole === 'mentor' && (
                <button
                  type="button"
                  onClick={() => setPostType('announcement')}
                  className={`p-4 rounded-xl border-2 transition-all ${postType === 'announcement'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <Megaphone className={`w-6 h-6 mx-auto mb-2 ${postType === 'announcement' ? 'text-amber-600' : 'text-slate-600'
                    }`} />
                  <div className="text-sm font-semibold text-slate-900">Announcement</div>
                  <div className="text-xs text-slate-500">Important info</div>
                </button>
              )}
            </div>
          </div>

          {/* Title (Optional for normal posts, required for questions) */}
          {(postType === 'question' || postType === 'announcement') && (
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
                {postType === 'question' ? 'Question Title' : 'Announcement Title'}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  postType === 'question'
                    ? 'e.g., How do I implement authentication in Next.js?'
                    : 'e.g., Important: Class Schedule Update'
                }
                required={postType === 'question' || postType === 'announcement'}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {postType === 'normal' && (
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
                Title <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your post a title..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-semibold text-slate-700 mb-2">
              {postType === 'question' ? 'Question Details' : 'Content'}{' '}
              <span className="text-red-500">*</span>
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
                    : 'What\'s on your mind?'
              }
              required
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-slate-500">
                {content.length} / 5000 characters
              </span>
              {postType === 'question' && (
                <span className="text-xs text-slate-500">
                  💡 Tip: Clear questions get better answers
                </span>
              )}
            </div>
          </div>

          {/* Media Attachments */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Attachments <span className="text-slate-400">(Optional)</span>
            </label>
            <FileUpload 
              onFilesChange={(newImages, newFiles) => {
                setImages(newImages);
                setFiles(newFiles);
              }} 
            />
          </div>

          {/* Guidelines */}
          {postType === 'announcement' && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2">📢 Announcement Guidelines</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Keep it clear and concise</li>
                <li>• Include important dates and deadlines</li>
                <li>• Use announcements sparingly for important updates only</li>
              </ul>
            </div>
          )}

          {postType === 'question' && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">❓ Question Tips</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Be specific and provide context</li>
                <li>• Include what you've already tried</li>
                <li>• Share any error messages or code snippets</li>
                <li>• Mark the best answer when you get help</li>
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !content.trim() || ((postType === 'question' || postType === 'announcement') && !title.trim())}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Post'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
