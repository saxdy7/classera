'use client';

import { useState } from 'react';
import { Eye, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

/** Map from file extension to Prism language identifier */
const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
  py: 'python', rb: 'ruby', java: 'java', go: 'go',
  rs: 'rust', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', c: 'c',
  cs: 'csharp', php: 'php', swift: 'swift', kt: 'kotlin',
  scala: 'scala', sh: 'bash', bash: 'bash', zsh: 'bash',
  sql: 'sql', html: 'html', htm: 'html', css: 'css',
  scss: 'scss', json: 'json', yaml: 'yaml', yml: 'yaml',
  toml: 'toml', md: 'markdown', xml: 'xml', graphql: 'graphql',
  dockerfile: 'docker', tf: 'hcl',
};

export interface FileViewerProps {
  submissionId: string;
  repoUrl: string;
  onReviewWithAI?: (path: string) => void;
}

export default function FileViewer({ submissionId, repoUrl, onReviewWithAI }: FileViewerProps) {
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

  // Expose loadFile for parent (RepoFileTree calls window.__loadFile)
  if (typeof window !== 'undefined') {
    (window as Window & { __loadFile?: typeof loadFile }).__loadFile = loadFile;
  }

  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const lang = EXT_TO_LANG[ext] ?? 'text';

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      {path && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-sm border-b border-slate-700">
          <span className="text-slate-300 font-mono truncate flex-1">{path}</span>
          {onReviewWithAI && content && (
            <button
              onClick={() => onReviewWithAI(path)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-600/20 text-violet-300 hover:bg-violet-600/40 text-xs font-medium transition-colors flex-shrink-0"
              title="Review this file with AI"
            >
              <Sparkles size={12} />
              AI Review
            </button>
          )}
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
          <SyntaxHighlighter
            language={lang}
            style={vscDarkPlus}
            showLineNumbers
            wrapLongLines={false}
            customStyle={{
              margin: 0,
              borderRadius: 0,
              fontSize: '0.72rem',
              lineHeight: '1.6',
              background: 'transparent',
              padding: '1rem',
            }}
            lineNumberStyle={{ color: '#4a5568', minWidth: '2.5em', paddingRight: '1em' }}
          >
            {content}
          </SyntaxHighlighter>
        )}
      </div>

      {/* VS Code-style status bar */}
      {path && !loading && (
        <div className="px-4 py-1 bg-slate-900 text-[11px] text-slate-500 border-t border-slate-700 flex items-center gap-4">
          <span className="font-mono uppercase tracking-wide text-slate-400">{lang}</span>
          {content && <span>{content.split('\n').length} lines</span>}
          {content && <span>{(new Blob([content]).size / 1024).toFixed(1)} KB</span>}
          <span className="ml-auto font-mono">{ext ? `.${ext}` : 'file'}</span>
        </div>
      )}
    </div>
  );
}
