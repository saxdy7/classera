'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/app/providers';
import { createBrowserClient } from '@/lib/supabase/browser';
import { RepositoryExplorer } from '@/components/projects/RepositoryExplorer';
import { ArrowLeft, Code, GitBranch, Package, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface GitHubRepo {
  name: string;
  owner: string;
  branch: string;
  url: string;
}

export default function ProjectRepositoryPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useSession();
  const supabase = createBrowserClient();

  const projectId = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [githubRepo, setGithubRepo] = useState<GitHubRepo | null>(null);
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

        // Extract GitHub repo info from project
        if (data.github_repo_url) {
          const urlParts = data.github_repo_url
            .replace('https://github.com/', '')
            .replace('.git', '')
            .split('/');

          if (urlParts.length >= 2) {
            setGithubRepo({
              owner: urlParts[0],
              name: urlParts[1],
              branch: 'main', // Default to main, could be dynamic
              url: data.github_repo_url,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [user, projectId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading repository...</p>
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

  if (!githubRepo) {
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
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Code className="w-6 h-6 text-blue-600" />
                {project.title}
              </h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <GitBranch className="w-4 h-4" />
                  <span>
                    {githubRepo.owner}/{githubRepo.name}
                  </span>
                </div>
                <a
                  href={githubRepo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View on GitHub →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="max-w-7xl w-full mx-auto px-6 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Code className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Repository Explorer</p>
            <p className="text-xs text-blue-700 mt-1">
              Browse and view your project source files directly from GitHub. Click on any file to view its contents.
            </p>
          </div>
        </div>
      </div>

      {/* Repository Explorer */}
      <div className="max-w-7xl w-full mx-auto px-6 pb-6">
        <div style={{ height: '600px' }}>
          <RepositoryExplorer
            projectId={projectId}
            userName={githubRepo.owner}
            repoName={githubRepo.name}
            branch={githubRepo.branch}
          />
        </div>
      </div>

      {/* Project Stats */}
      <div className="max-w-7xl w-full mx-auto px-6 pb-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-600" />
            Project Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Description */}
            <div>
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Description</p>
              <p className="text-sm text-gray-900 mt-1">
                {project.description || 'No description provided'}
              </p>
            </div>

            {/* Tech Stack */}
            <div>
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Tech Stack</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {project.tech_stack?.split(',').map((tech: string) => (
                  <span
                    key={tech.trim()}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {tech.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Status</p>
              <div className="mt-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  project.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : project.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status?.replace('_', ' ').charAt(0).toUpperCase() + 
                   project.status?.replace('_', ' ').slice(1) || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
