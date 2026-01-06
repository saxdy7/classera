'use client';

import { useState } from 'react';
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
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-black transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Communities
        </button>

        <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">Create Community</h1>
              <p className="text-slate-600">Build a learning space for your students</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Community Avatar */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Community Avatar (Optional)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  Upload Image
                </button>
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
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors"
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
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
            </div>

            {/* Community Settings */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="font-bold text-black">Community Settings</h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <p className="font-medium text-black">Active Community</p>
                  <p className="text-sm text-slate-600">Students can join and participate</p>
                </div>
              </label>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <h4 className="font-medium text-black mb-2">Join Approval</h4>
                <p className="text-sm text-slate-600 mb-3">
                  All join requests will require your approval before students can access the community.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="manual"
                    name="approval"
                    value="manual"
                    defaultChecked
                    className="w-4 h-4 text-purple-600"
                  />
                  <label htmlFor="manual" className="text-sm text-slate-700">Manual Approval</label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-6">
              <button
                type="submit"
                disabled={loading || !formData.name || !formData.description}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Community...' : 'Create Community'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Guidelines */}
        <div className="mt-6 bg-blue-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3">Community Guidelines</h3>
          <ul className="space-y-2 text-sm text-blue-800">
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
