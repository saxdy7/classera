'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/browser';
import { ChevronDown, ChevronRight, File, Folder, GitBranch, Code2, Loader2, AlertCircle } from 'lucide-react';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  url?: string;
  children?: FileNode[];
  language?: string;
}

interface RepositoryExplorerProps {
  projectId: string;
  userName: string;
  repoName: string;
  branch?: string;
}

interface TreeNode extends FileNode {
  expanded: boolean;
}

export function RepositoryExplorer({
  projectId,
  userName,
  repoName,
  branch = 'main',
}: RepositoryExplorerProps) {
  const supabase = createBrowserClient();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);

  // Fetch repository structure
  useEffect(() => {
    const fetchRepoStructure = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://api.github.com/repos/${userName}/${repoName}/git/trees/${branch}?recursive=1`,
          {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              // Add GITHUB_TOKEN from environment if available
            },
          }
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Build tree structure from flat list
        const root: { [key: string]: TreeNode } = {};

        data.tree.forEach((item: any) => {
          const parts = item.path.split('/');
          let current = root;

          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isFile = i === parts.length - 1 && item.type === 'blob';

            if (!current[part]) {
              current[part] = {
                name: part,
                path: item.path,
                type: isFile ? 'file' : 'dir',
                size: item.size,
                url: item.url,
                children: [],
                expanded: false,
              };
            }

            if (!isFile && !current[part].children) {
              current[part].children = [];
            }

            if (i < parts.length - 1) {
              if (!current[part].children) {
                current[part].children = [];
              }
              current = current[part].children as any;
            }
          }
        });

        const treeArray = Object.values(root);
        setTree(treeArray);
      } catch (err) {
        console.error('Error fetching repo structure:', err);
        setError(err instanceof Error ? err.message : 'Failed to load repository');
      } finally {
        setLoading(false);
      }
    };

    if (userName && repoName) {
      fetchRepoStructure();
    }
  }, [userName, repoName, branch]);

  // Fetch file content
  const handleFileClick = useCallback(async (file: FileNode) => {
    if (file.type !== 'file') return;

    try {
      setLoadingContent(true);
      setSelectedFile(file);

      const response = await fetch(
        `https://raw.githubusercontent.com/${userName}/${repoName}/${branch}/${file.path}`
      );

      if (!response.ok) {
        throw new Error('Failed to load file');
      }

      const content = await response.text();
      setFileContent(content);
    } catch (err) {
      setFileContent('Failed to load file content');
      console.error('Error loading file:', err);
    } finally {
      setLoadingContent(false);
    }
  }, [userName, repoName, branch]);

  // Toggle folder expansion
  const toggleExpand = (node: TreeNode) => {
    node.expanded = !node.expanded;
    setTree([...tree]);
  };

  // Recursive file tree renderer
  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer rounded ${
            selectedFile?.path === node.path ? 'bg-blue-50 text-blue-700' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => {
            if (node.type === 'dir') {
              toggleExpand(node);
            } else {
              handleFileClick(node);
            }
          }}
        >
          {node.type === 'dir' ? (
            <>
              {node.expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Folder className="w-4 h-4 text-yellow-600" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <File className="w-4 h-4 text-gray-500" />
            </>
          )}
          <span className="text-sm font-medium">{node.name}</span>
          {node.type === 'file' && node.size && (
            <span className="ml-auto text-xs text-gray-500">
              {(node.size / 1024).toFixed(1)}KB
            </span>
          )}
        </div>

        {node.type === 'dir' && node.expanded && node.children && (
          <div>{renderTree(node.children as TreeNode[], depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* File Tree Sidebar */}
      <div className="w-64 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch className="w-4 h-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-600">Repository Files</span>
          </div>
          <div className="text-xs text-gray-500 truncate">
            {userName}/{repoName}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-600">Loading files...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* File Tree */}
        {!loading && !error && (
          <div className="flex-1 overflow-y-auto p-2">
            {tree.length === 0 ? (
              <p className="text-xs text-gray-500 p-4">No files found</p>
            ) : (
              renderTree(tree)
            )}
          </div>
        )}
      </div>

      {/* Code Viewer */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedFile ? (
          <>
            {/* File Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-3">
              <Code2 className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{selectedFile.path}</p>
              </div>
            </div>

            {/* File Content */}
            <div className="flex-1 overflow-auto">
              {loadingContent ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : (
                <pre className="p-6 font-mono text-xs text-gray-800 bg-white overflow-auto max-w-full">
                  <code>{fileContent}</code>
                </pre>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p className="text-sm">Select a file to view contents</p>
          </div>
        )}
      </div>
    </div>
  );
}
