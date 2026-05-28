'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/app/providers';
import { createBrowserClient } from '@/lib/supabase/browser';
import { SourceCodeRoadmap } from '@/components/projects/SourceCodeRoadmap';
import { ArrowLeft, AlertCircle, Loader2, Code, GitBranch, Package } from 'lucide-react';
import Link from 'next/link';

export default function ProjectSourceExplorerPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useSession();
  const supabase = createBrowserClient();

  const projectId = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !projectId) return;

    const fetchProject = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('project_assignments')
          .select('*')
          .eq('id', projectId)
          .single();

        if (fetchError) throw fetchError;

        setProject(data);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [user, projectId, supabase]);

  const getRepoInfo = (url?: string) => {
    if (!url) return null;
    const parts = url.replace('https://github.com/', '').replace('.git', '').split('/');
    return { owner: parts[0], name: parts[1] };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-gray-600 mb-6">{error || 'Project not found'}</p>
          <Link href="/dashboard/student/projects" className="text-blue-600 hover:underline">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const repo = getRepoInfo(project.github_repo_url);

  if (!repo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md">
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">No Repository</h2>
          </div>
          <p className="text-gray-600 mb-6">
            This project doesn't have a linked GitHub repository yet.
          </p>
          <Link href={`/dashboard/student/projects/${projectId}/edit`} className="text-blue-600 hover:underline">
            Add GitHub Repository
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <Code className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    {repo.owner}/{repo.name}
                  </p>
                </div>
              </div>
            </div>

            <a
              href={project.github_repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Info Banner */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Code className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Source Code Structure</p>
            <p className="text-xs text-blue-700 mt-1">
              Navigate through your project's src directory. Click any folder to expand and explore the structure.
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Roadmap (takes 2 columns on large screens) */}
          <div className="lg:col-span-2">
            <SourceCodeRoadmap
              userName={repo.owner}
              repoName={repo.name}
              branch="main"
            />
          </div>

          {/* Project Info Sidebar */}
          <div className="space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Description
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {project.description || 'No description provided'}
              </p>
            </div>

            {/* Tech Stack Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.tech_stack ? (
                  project.tech_stack.split(',').map((tech: string) => (
                    <span
                      key={tech.trim()}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                    >
                      {tech.trim()}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No tech stack specified</p>
                )}
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Status
              </h3>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    project.status === 'completed'
                      ? 'bg-green-500'
                      : project.status === 'in_progress'
                      ? 'bg-blue-500'
                      : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {project.status?.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Links Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">
                Quick Links
              </h3>
              <div className="space-y-2">
                <Link
                  href={`/dashboard/student/projects/${projectId}/repository`}
                  className="block w-full px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-center"
                >
                  Full Repository Explorer
                </Link>
                <Link
                  href={`/dashboard/student/projects/${projectId}/edit`}
                  className="block w-full px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-center"
                >
                  Edit Project
                </Link>
                {project.github_repo_url && (
                  <a
                    href={project.github_repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition text-center"
                  >
                    Open on GitHub
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto text-xs text-gray-600">
          <p>
            💡 <strong>Tip:</strong> This view shows the src directory structure from your GitHub repository.
            Use the full repository explorer for complete file browsing and code viewing.
          </p>
        </div>
      </div>
    </div>
  );
}
