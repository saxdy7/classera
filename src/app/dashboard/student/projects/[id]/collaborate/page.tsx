'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from '@/app/providers';
import { createBrowserClient } from '@/lib/supabase/browser';
import { CollabEditor } from '@/components/collaboration/CollabEditor';
import { ArrowLeft, Share2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProjectCollaborationPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useSession();
  const supabase = createBrowserClient();

  const projectId = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

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

        // Check if user has access
        if (data.user_id !== user.id && data.type !== 'team') {
          setError('You do not have access to collaborate on this project');
          return;
        }

        setProject(data);
        setShareLink(`${window.location.origin}/collaboration/${projectId}`);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [user, projectId, supabase]);

  const handleSaveDocument = async (content: string) => {
    try {
      const { error } = await supabase
        .from('project_assignments')
        .update({
          description: content.substring(0, 5000), // Store first 5000 chars as preview
        })
        .eq('id', projectId);

      if (error) throw error;
    } catch (err) {
      console.error('Error saving document:', err);
      throw err;
    }
  };

  const handleCopyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert('Share link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading collaboration editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/dashboard/student/projects" className="text-blue-600 hover:underline">
            Back to Projects
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
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>

            <button
              onClick={() => setShowShareModal(!showShareModal)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project?.title || 'Untitled Project'}</h1>
            <p className="text-sm text-gray-600 mt-1">Real-time Collaboration</p>
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="border-t border-gray-200 bg-blue-50 px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Share Collaboration Link</span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={shareLink || ''}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 font-mono"
              />
              <button
                onClick={handleCopyShareLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Share this link with collaborators to work together in real-time
            </p>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6">
        <CollabEditor
          projectId={projectId}
          userId={user?.id || ''}
          userName={user?.user_metadata?.name || user?.email || 'Anonymous'}
          userAvatar={user?.user_metadata?.avatar_url || ''}
          initialContent={project?.description || ''}
          onSave={handleSaveDocument}
          readOnly={false}
        />
      </div>

      {/* Info Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 text-xs text-gray-600">
        <p>
          💡 <strong>Tip:</strong> Changes are saved automatically. Invite collaborators using the Share button above.
          All edits are tracked and can be restored from version history.
        </p>
      </div>
    </div>
  );
}
