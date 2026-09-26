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
    <div className="min-h-screen bg-card">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-foreground/80 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Communities
        </button>

        <div className="bg-card rounded-lg p-8 border border-border">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-primary">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">Create Community</h1>
              <p className="text-foreground/80">Build a learning space for your students</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community Avatar */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Community Avatar (Optional)
              </label>
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="Community" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
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
                    className="rounded-lg border border-border bg-card px-4 py-2 font-medium text-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {uploading ? 'Uploading…' : imageUrl ? 'Change Image' : 'Upload Image'}
                  </button>
                  {uploadError && (
                    <p role="alert" className="mt-1.5 text-[13px] text-destructive">{uploadError}</p>
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
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-accent-purple transition-colors"
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
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-accent-purple transition-colors resize-none"
              />
            </div>

            {/* Community Settings */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-semibold text-black">Community Settings</h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-accent-purple rounded focus:ring-ring"
                />
                <div>
                  <p className="font-medium text-black">Active Community</p>
                  <p className="text-sm text-foreground/80">Students can join and participate</p>
                </div>
              </label>

              <div className="bg-muted/40 rounded-lg p-4 border border-border">
                <h4 className="font-medium text-black mb-2">Join Approval</h4>
                <p className="text-sm text-foreground/80 mb-3">
                  All join requests will require your approval before students can access the community.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="manual"
                    name="approval"
                    value="manual"
                    defaultChecked
                    className="w-4 h-4 text-accent-purple"
                  />
                  <label htmlFor="manual" className="text-sm text-foreground/80">Manual Approval</label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-6">
              <button
                type="submit"
                disabled={loading || !formData.name || !formData.description}
                className="flex-1 px-6 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed bg-primary"
              >
                {loading ? 'Creating Community...' : 'Create Community'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="px-6 py-3 bg-muted text-foreground/80 rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Guidelines */}
        <div className="mt-6 bg-accent-purple/10 rounded-lg p-6 border border-accent-purple">
          <h3 className="font-semibold text-accent-purple mb-3">Community Guidelines</h3>
          <ul className="space-y-2 text-sm text-accent-purple">
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
