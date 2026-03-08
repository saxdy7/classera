'use client';

import { useState } from 'react';
import { Eye, Loader2, RefreshCw } from 'lucide-react';

interface FileViewerProps {
  submissionId: string;
  repoUrl: string;
}

export default function FileViewer({ submissionId, repoUrl }: FileViewerProps) {
  const [path, setPath] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // This is called by parent RepoFileTree when a file is clicked
  async function loadFile(filePath: string) {
    setPath(filePath);
    setContent('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch(
        `/api/github/file?submission_id=${submissionId}&path=${encodeURIComponent(filePath)}`,
      );
      const data = await res.json() as { content?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load file');
      setContent(data.content ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  }

  // Expose loadFile for parent
  if (typeof window !== 'undefined') {
    (window as Window & { __loadFile?: typeof loadFile }).__loadFile = loadFile;
  }

  const ext = path.split('.').pop()?.toLowerCase() ?? '';

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      {path && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-sm border-b border-slate-700">
          <span className="text-slate-300 font-mono truncate flex-1">{path}</span>
          <a
            href={`${repoUrl}/blob/HEAD/${path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
            title="Open on GitHub"
          >
            <Eye className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-auto bg-slate-950">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => loadFile(path)} className="text-slate-400 hover:text-white">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
        {!loading && !error && !path && (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500 text-sm">Select a file from the tree to view its contents</p>
          </div>
        )}
        {!loading && !error && content && (
          <pre
            className={`text-xs font-mono text-slate-300 p-4 whitespace-pre-wrap break-words leading-relaxed`}
          >
            {content}
          </pre>
        )}
      </div>

      {/* File info */}
      {path && !loading && (
        <div className="px-4 py-1.5 bg-slate-900 text-xs text-slate-500 border-t border-slate-700 flex items-center gap-4">
          <span className="font-mono">{ext ? `.${ext}` : 'file'}</span>
          {content && <span>{content.split('\n').length} lines</span>}
          {content && <span>{new Blob([content]).size.toLocaleString()} bytes</span>}
        </div>
      )}
    </div>
  );
}

// Also export the loadFile trigger so RepoFileTree can call it
export { type FileViewerProps };
