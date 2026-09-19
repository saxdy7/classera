'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Users, ArrowLeft, Image as ImageIcon } from 'lucide-react';

export default function CreateCommunityPage() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);

  // "Upload Image" was a button with no handler at all - it looked interactive
  // and did nothing. /api/upload already existed and was simply never called.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('type', 'image');
      const res = await fetch('/api/upload', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      setImageUrl(data.url);
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      // allow re-selecting the same file
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active
        })
      });

      if (res.ok) {
        router.push('/dashboard/mentor/communities');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create community. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--cl-surface-card)]">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[var(--cl-body)] hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Communities
        </button>

        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] p-8 border border-[var(--cl-hairline)]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-[var(--cl-r-lg)] flex items-center justify-center bg-[var(--cl-primary)]">
              <Users className="w-8 h-8 text-[var(--cl-on-dark)]" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-black">Create Community</h1>
              <p className="text-[var(--cl-body)]">Build a learning space for your students</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community Avatar */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Community Avatar (Optional)
              </label>
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[var(--cl-r-lg)] border-2 border-dashed border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-strong)]">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="Community" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-[var(--cl-muted)]" />
                  )}
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-[var(--cl-r-md)] border border-[var(--cl-hairline-strong)] bg-[var(--cl-surface-card)] px-4 py-2 font-medium text-[var(--cl-ink)] transition-colors hover:bg-[var(--cl-canvas-soft)] disabled:cursor-not-allowed disabled:bg-[var(--cl-surface-strong)] disabled:text-[var(--cl-muted)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(10,10,10,0.12)]"
                  >
                    {uploading ? 'Uploading…' : imageUrl ? 'Change Image' : 'Upload Image'}
                  </button>
                  {uploadError && (
                    <p role="alert" className="mt-1.5 text-[13px] text-[var(--cl-error)]">{uploadError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Community Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                Community Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Computer Science Hub"
                required
                className="w-full px-4 py-3 border border-[var(--cl-hairline)] rounded-lg focus:outline-none focus:border-[var(--cl-primary)] transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this community is about..."
                required
                rows={5}
                className="w-full px-4 py-3 border border-[var(--cl-hairline)] rounded-lg focus:outline-none focus:border-[var(--cl-primary)] transition-colors resize-none"
              />
            </div>

            {/* Community Settings */}
            <div className="space-y-4 pt-4 border-t border-[var(--cl-hairline)]">
              <h3 className="font-semibold text-black">Community Settings</h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-[var(--cl-primary)] rounded focus:ring-[var(--cl-primary)]"
                />
                <div>
                  <p className="font-medium text-black">Active Community</p>
                  <p className="text-sm text-[var(--cl-body)]">Students can join and participate</p>
                </div>
              </label>

              <div className="bg-[var(--cl-canvas-soft)] rounded-lg p-4 border border-[var(--cl-hairline)]">
                <h4 className="font-medium text-black mb-2">Join Approval</h4>
                <p className="text-sm text-[var(--cl-body)] mb-3">
                  All join requests will require your approval before students can access the community.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="manual"
                    name="approval"
                    value="manual"
                    defaultChecked
                    className="w-4 h-4 text-[var(--cl-primary)]"
                  />
                  <label htmlFor="manual" className="text-sm text-[var(--cl-body)]">Manual Approval</label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-6">
              <button
                type="submit"
                disabled={loading || !formData.name || !formData.description}
                className="flex-1 px-6 py-3 text-[var(--cl-on-dark)] rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--cl-primary)]"
              >
                {loading ? 'Creating Community...' : 'Create Community'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="px-6 py-3 bg-[var(--cl-surface-strong)] text-[var(--cl-body)] rounded-lg font-medium hover:bg-[var(--cl-surface-strong)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Guidelines */}
        <div className="mt-6 bg-[rgba(13,116,206,0.12)] rounded-[var(--cl-r-lg)] p-6 border border-[var(--cl-info)]">
          <h3 className="font-semibold text-[var(--cl-info)] mb-3">Community Guidelines</h3>
          <ul className="space-y-2 text-sm text-[var(--cl-info)]">
            <li>• Choose a clear and descriptive name that reflects the community's purpose</li>
            <li>• Write a detailed description to help students understand what to expect</li>
            <li>• Review and approve join requests to maintain quality discussions</li>
            <li>• Keep the community active by regularly posting updates and resources</li>
            <li>• Moderate discussions to ensure a respectful and productive environment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
