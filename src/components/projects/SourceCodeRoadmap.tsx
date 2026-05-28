'use client';

import React, { useEffect, useState } from 'react';
import { Folder, File, GitBranch, Loader2, AlertCircle, Code, ChevronDown, ChevronRight } from 'lucide-react';

interface SrcNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: SrcNode[];
  fileCount?: number;
}

interface SourceRoadmapProps {
  userName: string;
  repoName: string;
  branch?: string;
}

const IMPORTANT_SRC_DIRS = [
  'app',
  'components',
  'lib',
  'hooks',
  'types',
  'utils',
  'styles',
  'constants',
];

export function SourceCodeRoadmap({
  userName,
  repoName,
  branch = 'main',
}: SourceRoadmapProps) {
  const [srcStructure, setSrcStructure] = useState<SrcNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['src']));

  useEffect(() => {
    const fetchSrcStructure = async () => {
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

        // Filter for src directory only
        const srcItems = data.tree.filter((item: any) => item.path.startsWith('src/'));

        // Build nested structure
        const srcRoot: SrcNode = {
          name: 'src',
          path: 'src',
          type: 'dir',
          children: [],
        };

        const nodeMap = new Map<string, SrcNode>();
        nodeMap.set('src', srcRoot);

        srcItems.forEach((item: any) => {
          const parts = item.path.split('/').slice(1); // Remove 'src'

          let current = srcRoot;

          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isFile = i === parts.length - 1 && item.type === 'blob';
            const currentPath = `src/${parts.slice(0, i + 1).join('/')}`;

            if (!nodeMap.has(currentPath)) {
              const newNode: SrcNode = {
                name: part,
                path: currentPath,
                type: isFile ? 'file' : 'dir',
                children: isFile ? undefined : [],
              };
              nodeMap.set(currentPath, newNode);

              if (!current.children) {
                current.children = [];
              }
              current.children.push(newNode);
            }

            if (!isFile) {
              current = nodeMap.get(currentPath)!;
            }
          }
        });

        // Count files in each directory
        const countFiles = (node: SrcNode): number => {
          if (node.type === 'file') return 1;
          if (!node.children) return 0;
          return node.children.reduce((sum, child) => sum + countFiles(child), 0);
        };

        const processNode = (node: SrcNode) => {
          if (node.type === 'dir' && node.children) {
            node.fileCount = countFiles(node);
            node.children.forEach(processNode);
          }
        };

        processNode(srcRoot);

        setSrcStructure(srcRoot.children || []);
      } catch (err) {
        console.error('Error fetching src structure:', err);
        setError(err instanceof Error ? err.message : 'Failed to load source structure');
      } finally {
        setLoading(false);
      }
    };

    if (userName && repoName) {
      fetchSrcStructure();
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

  const renderTree = (nodes: SrcNode[], depth = 0) => {
    return nodes
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        const aImportant = IMPORTANT_SRC_DIRS.includes(a.name) ? 0 : 1;
        const bImportant = IMPORTANT_SRC_DIRS.includes(b.name) ? 0 : 1;
        if (aImportant !== bImportant) return aImportant - bImportant;
        return a.name.localeCompare(b.name);
      })
      .map((node) => (
        <div key={node.path}>
          {/* Node Item */}
          <div
            className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 rounded-lg cursor-pointer transition group"
            style={{ paddingLeft: `${depth * 20 + 12}px` }}
            onClick={() => node.type === 'dir' && toggleExpand(node.path)}
          >
            {/* Expand Icon */}
            <div className="w-4 flex items-center justify-center">
              {node.type === 'dir' && (
                expandedDirs.has(node.path) ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )
              )}
            </div>

            {/* Icon */}
            {node.type === 'dir' ? (
              <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
            ) : (
              <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}

            {/* Name */}
            <span className="text-sm font-medium text-gray-900 truncate flex-1">
              {node.name}
            </span>

            {/* Count Badge */}
            {node.type === 'dir' && node.fileCount && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded whitespace-nowrap">
                {node.fileCount} file{node.fileCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Children */}
          {node.type === 'dir' && expandedDirs.has(node.path) && node.children && (
            <div>{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-center">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-blue-700">Loading src structure...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Source Code Structure</h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {userName}/{repoName} — src directory
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {srcStructure.length === 0 ? (
          <div className="text-center py-8">
            <Folder className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No src directory found</p>
          </div>
        ) : (
          <div className="space-y-1">{renderTree(srcStructure)}</div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-blue-50 border-t border-gray-200 text-xs text-blue-700 font-medium">
        💡 Click directories to expand and explore the source code structure
      </div>
    </div>
  );
}
