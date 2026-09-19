'use client';

import React, { useEffect, useState } from 'react';
import { Folder, File, GitBranch, Loader2, AlertCircle, Code } from 'lucide-react';

interface RepoNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  url?: string;
  children?: RepoNode[];
}

interface RoadmapItem {
  name: string;
  path: string;
  type: 'dir' | 'file';
  depth: number;
  fileCount?: number;
  keyFiles?: string[];
}

interface RepositoryRoadmapProps {
  userName: string;
  repoName: string;
  branch?: string;
}

const IMPORTANT_DIRS = ['src', 'components', 'lib', 'utils', 'pages', 'app', 'styles', 'public', 'config'];
const IMPORTANT_FILES = [
  'package.json',
  'tsconfig.json',
  'README.md',
  '.env.example',
  '.gitignore',
  'Dockerfile',
  'docker-compose.yml',
];

export function RepositoryRoadmap({
  userName,
  repoName,
  branch = 'main',
}: RepositoryRoadmapProps) {
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://api.github.com/repos/${userName}/${repoName}/git/trees/${branch}?recursive=1`,
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Build roadmap from tree
        const roadmapItems: RoadmapItem[] = [];
        const dirMap = new Map<string, { count: number; files: string[] }>();

        // Count files in each directory
        data.tree.forEach((item: any) => {
          if (item.type === 'tree') {
            const parts = item.path.split('/');
            const topDir = parts[0];

            if (!dirMap.has(topDir)) {
              dirMap.set(topDir, { count: 0, files: [] });
            }
          } else if (item.type === 'blob') {
            const parts = item.path.split('/');
            const topDir = parts[0];

            if (!dirMap.has(topDir)) {
              dirMap.set(topDir, { count: 0, files: [] });
            }

            const stats = dirMap.get(topDir)!;
            stats.count++;

            if (stats.files.length < 5) {
              stats.files.push(item.path);
            }
          }
        });

        // Create roadmap items
        const sortedDirs = Array.from(dirMap.entries())
          .sort((a, b) => {
            const aImportant = IMPORTANT_DIRS.includes(a[0]) ? 0 : 1;
            const bImportant = IMPORTANT_DIRS.includes(b[0]) ? 0 : 1;
            return aImportant - bImportant || a[0].localeCompare(b[0]);
          })
          .slice(0, 12); // Top 12 directories

        sortedDirs.forEach(([dirName, stats], index) => {
          roadmapItems.push({
            name: dirName,
            path: dirName,
            type: 'dir',
            depth: 0,
            fileCount: stats.count,
            keyFiles: stats.files.slice(0, 3),
          });
        });

        // Add important root files
        data.tree.forEach((item: any) => {
          if (item.type === 'blob' && !item.path.includes('/')) {
            if (IMPORTANT_FILES.includes(item.path)) {
              roadmapItems.push({
                name: item.path,
                path: item.path,
                type: 'file',
                depth: 0,
              });
            }
          }
        });

        setRoadmap(roadmapItems.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
          return a.name.localeCompare(b.name);
        }));
      } catch (err) {
        console.error('Error fetching roadmap:', err);
        setError(err instanceof Error ? err.message : 'Failed to load repository');
      } finally {
        setLoading(false);
      }
    };

    if (userName && repoName) {
      fetchRoadmap();
    }
  }, [userName, repoName, branch]);

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-[var(--cl-canvas-soft)] rounded-lg border border-[var(--cl-hairline)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[var(--cl-muted-soft)] animate-spin mx-auto mb-2" />
          <p className="text-sm text-[var(--cl-body)]">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-[var(--cl-canvas-soft)] rounded-lg border border-[var(--cl-hairline)]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-[var(--cl-error)] mx-auto mb-2" />
          <p className="text-sm text-[var(--cl-error)]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--cl-surface-card)] rounded-lg border border-[var(--cl-hairline)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--cl-hairline)] bg-[var(--cl-canvas-soft)]">
        <div className="flex items-center gap-2 mb-2">
          <Code className="w-5 h-5 text-[var(--cl-info)]" />
          <h3 className="text-lg font-semibold text-[var(--cl-ink)]">Project Structure Roadmap</h3>
        </div>
        <p className="text-sm text-[var(--cl-body)]">
          {userName}/{repoName} — {roadmap.length} items
        </p>
      </div>

      {/* Content */}
      <div className="divide-y divide-[var(--cl-hairline)]">
        {roadmap.map((item, index) => (
          <div
            key={`${item.path}-${index}`}
            className="px-6 py-4 hover:bg-gray-50 transition cursor-pointer"
            onClick={() => item.type === 'dir' && toggleExpand(item.path)}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="mt-1">
                {item.type === 'dir' ? (
                  <Folder className="w-5 h-5 text-[var(--cl-info)]" />
                ) : (
                  <File className="w-5 h-5 text-[var(--cl-muted-soft)]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[var(--cl-ink)]">{item.name}</p>
                  {item.type === 'dir' && item.fileCount !== undefined && (
                    <span className="inline-block px-2 py-1 bg-[rgba(13,116,206,0.12)] text-[var(--cl-info)] text-xs font-medium rounded">
                      {item.fileCount} files
                    </span>
                  )}
                </div>

                {/* Key Files Preview */}
                {item.type === 'dir' && expandedDirs.has(item.path) && item.keyFiles && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-[var(--cl-body)] font-medium uppercase tracking-wide">Key Files:</p>
                    <ul className="space-y-1">
                      {item.keyFiles.map((file) => (
                        <li key={file} className="text-xs text-[var(--cl-body)] flex items-center gap-2 ml-4">
                          <File className="w-3 h-3 text-[var(--cl-muted-soft)]" />
                          <code className="font-mono">{file.split('/').pop()}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Expand Button */}
              {item.type === 'dir' && (
                <div className="text-[var(--cl-muted-soft)] ml-2">
                  {expandedDirs.has(item.path) ? '−' : '+'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-[var(--cl-canvas-soft)] border-t border-[var(--cl-hairline)] text-xs text-[var(--cl-body)]">
        <p>💡 Click on directories to see key files. Open the full explorer to browse all files.</p>
      </div>
    </div>
  );
}
