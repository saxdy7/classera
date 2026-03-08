'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText, File } from 'lucide-react';

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  sha: string;
  children?: TreeNode[];
}

interface RepoFileTreeProps {
  tree: TreeNode[];
  onFileClick?: (path: string) => void;
  selectedPath?: string;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  const codeExts = new Set(['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'rb', 'php', 'cs', 'swift', 'kt']);
  const docExts = new Set(['md', 'txt', 'pdf', 'doc', 'docx', 'rst']);
  if (ext && codeExts.has(ext)) return <span className="text-purple-400 text-xs font-mono">{`.${ext}`}</span>;
  if (ext && docExts.has(ext)) return <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
  return <File className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />;
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function TreeNodeItem({
  node,
  depth,
  onFileClick,
  selectedPath,
}: {
  node: TreeNode;
  depth: number;
  onFileClick?: (path: string) => void;
  selectedPath?: string;
}) {
  const [open, setOpen] = useState(depth === 0);

  const isSelected = selectedPath === node.path;

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={`flex items-center gap-1.5 w-full text-left px-2 py-0.5 rounded hover:bg-slate-100 transition-colors text-sm`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {open ? (
            <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
          )}
          {open ? (
            <FolderOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          )}
          <span className="text-slate-700 truncate">{node.name}</span>
          {node.children && (
            <span className="ml-auto text-xs text-slate-400 flex-shrink-0">
              {node.children.length}
            </span>
          )}
        </button>
        {open && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                onFileClick={onFileClick}
                selectedPath={selectedPath}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileClick?.(node.path)}
      className={`flex items-center gap-1.5 w-full text-left px-2 py-0.5 rounded transition-colors text-sm group ${
        isSelected ? 'bg-violet-100 text-violet-700' : 'hover:bg-slate-100 text-slate-600'
      }`}
      style={{ paddingLeft: `${8 + depth * 16}px` }}
    >
      <span className="w-3 flex-shrink-0" />
      {getFileIcon(node.name)}
      <span className="truncate flex-1">{node.name}</span>
      {node.size !== undefined && (
        <span className="text-xs text-slate-400 flex-shrink-0 opacity-0 group-hover:opacity-100">
          {formatBytes(node.size)}
        </span>
      )}
    </button>
  );
}

export default function RepoFileTree({ tree, onFileClick, selectedPath }: RepoFileTreeProps) {
  const [search, setSearch] = useState('');

  if (!tree || tree.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No files found in this repository.
      </div>
    );
  }

  // Filter tree if searching
  function filterTree(nodes: TreeNode[], q: string): TreeNode[] {
    if (!q) return nodes;
    const result: TreeNode[] = [];
    for (const node of nodes) {
      if (node.type === 'folder' && node.children) {
        const filtered = filterTree(node.children, q);
        if (filtered.length > 0) result.push({ ...node, children: filtered });
      } else if (node.name.toLowerCase().includes(q.toLowerCase())) {
        result.push(node);
      }
    }
    return result;
  }

  const displayTree = search ? filterTree(tree, search) : tree;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pb-2">
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-400"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {displayTree.map((node) => (
          <TreeNodeItem
            key={node.path}
            node={node}
            depth={0}
            onFileClick={onFileClick}
            selectedPath={selectedPath}
          />
        ))}
      </div>
    </div>
  );
}
