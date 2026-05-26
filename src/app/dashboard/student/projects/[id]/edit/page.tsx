'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tech_stack: '',
    github_repo_url: '',
    live_url: '',
    additional_notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/projects/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/student/projects/${assignmentId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`/dashboard/student/projects/${assignmentId}`}
            className="p-2 hover:bg-slate-200 rounded-lg transition"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Edit Project</h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., E-Learning Platform"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your project, its purpose, and key features..."
                rows={5}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tech Stack */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tech Stack (comma-separated)
              </label>
              <input
                type="text"
                name="tech_stack"
                value={formData.tech_stack}
                onChange={handleChange}
                placeholder="e.g., Next.js, TypeScript, Tailwind CSS, PostgreSQL"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* GitHub Repo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                GitHub Repository URL
              </label>
              <input
                type="url"
                name="github_repo_url"
                value={formData.github_repo_url}
                onChange={handleChange}
                placeholder="https://github.com/username/repository"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Live URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Live Project URL (Optional)
              </label>
              <input
                type="url"
                name="live_url"
                value={formData.live_url}
                onChange={handleChange}
                placeholder="https://your-project.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleChange}
                placeholder="Any additional information about the project..."
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-emerald-700 text-sm font-medium">Project updated successfully! Redirecting...</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href={`/dashboard/student/projects/${assignmentId}`}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-2.5 rounded-lg transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
