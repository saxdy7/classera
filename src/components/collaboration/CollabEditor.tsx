'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRealtimeCollaboration, type CursorPosition, type Presence } from '@/hooks/useRealtimeCollaboration';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Copy, History, Save, Users, Wifi, WifiOff } from 'lucide-react';

interface CollabEditorProps {
  projectId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  initialContent?: string;
  onSave?: (content: string) => Promise<void>;
  readOnly?: boolean;
}

export function CollabEditor({
  projectId,
  userId,
  userName,
  userAvatar,
  initialContent = '',
  onSave,
  readOnly = false,
}: CollabEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedText, setSelectedText] = useState<{ start: number; end: number } | null>(null);

  const {
    cursors,
    presenceUsers,
    versions,
    currentContent,
    isSynced,
    broadcastCursor,
    broadcastDocument,
    saveVersion,
    updatePresenceStatus,
    restoreVersion,
    getActiveCollaborators,
  } = useRealtimeCollaboration({
    projectId,
    userId,
    userName,
    userAvatar,
  });

  // Handle content changes
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (readOnly) return;

      const newContent = e.currentTarget.value;
      setContent(newContent);
      broadcastDocument(newContent);
      updatePresenceStatus('editing');
    },
    [broadcastDocument, updatePresenceStatus, readOnly]
  );

  // Handle cursor position
  const handleCursorMove = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!editorRef.current) return;

      const textarea = editorRef.current;
      const position = textarea.selectionStart;

      const textBeforeCursor = content.substring(0, position);
      const line = textBeforeCursor.split('\n').length;
      const column = textBeforeCursor.split('\n').pop()?.length || 0;

      broadcastCursor(line, column);
    },
    [content, broadcastCursor]
  );

  // Handle save
  const handleSave = async () => {
    if (readOnly) return;

    setIsSaving(true);
    try {
      await saveVersion();

      if (onSave) {
        await onSave(content);
      }

      setSaveMessage({ type: 'success', text: 'Saved successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save' });
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setSaveMessage({ type: 'success', text: 'Copied to clipboard!' });
    setTimeout(() => setSaveMessage(null), 2000);
  };

  // Get cursor render position
  const getCursorStyle = (cursor: CursorPosition) => {
    if (!editorRef.current) return {};

    const lines = content.split('\n');
    let charIndex = 0;

    for (let i = 0; i < Math.min(cursor.line - 1, lines.length); i++) {
      charIndex += lines[i].length + 1;
    }
    charIndex += cursor.column;

    return {
      left: `${cursor.column * 8.4}px`,
      top: `${cursor.line * 24}px`,
    };
  };

  const activeCollaborators = getActiveCollaborators();

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {isSynced ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {isSynced ? 'Synced' : 'Syncing...'}
              </span>
            </div>

            {/* Active Collaborators */}
            {activeCollaborators.length > 0 && (
              <div className="flex items-center gap-2 ml-4">
                <Users className="w-4 h-4 text-gray-600" />
                <div className="flex -space-x-2">
                  {activeCollaborators.map((collab) => (
                    <div
                      key={collab.userId}
                      title={collab.userName}
                      className="w-6 h-6 rounded-full bg-gray-300 border border-white flex items-center justify-center text-xs font-bold text-gray-700 overflow-hidden"
                    >
                      {collab.userAvatar ? (
                        <img src={collab.userAvatar} alt={collab.userName} className="w-full h-full object-cover" />
                      ) : (
                        collab.userName.charAt(0)
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-600">{activeCollaborators.length} editing</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCopy}
            variant="ghost"
            size="sm"
            title="Copy content"
            disabled={!content}
          >
            <Copy className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            variant="ghost"
            size="sm"
            title="Version history"
          >
            <History className="w-4 h-4" />
            {versions.length > 0 && <span className="ml-1 text-xs">{versions.length}</span>}
          </Button>

          {!readOnly && (
            <Button
              onClick={handleSave}
              disabled={isSaving || !content}
              size="sm"
              className="gap-1"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {saveMessage && (
        <div className={`px-6 py-2 flex items-center gap-2 text-sm ${
          saveMessage.type === 'success'
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {saveMessage.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {saveMessage.text}
        </div>
      )}

      {/* Editor Container */}
      <div className="flex-1 relative overflow-hidden">
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleContentChange}
          onMouseMove={handleCursorMove}
          onKeyDown={handleCursorMove}
          readOnly={readOnly}
          placeholder={readOnly ? 'Document is read-only' : 'Start typing here...'}
          className={`w-full h-full p-6 font-mono text-sm resize-none border-none outline-none bg-white ${
            readOnly ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''
          }`}
          style={{
            lineHeight: '1.5',
            fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
          }}
        />

        {/* Cursor Indicators */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from(cursors.values())
            .filter((cursor) => cursor.userId !== userId)
            .map((cursor) => (
              <div key={cursor.userId} className="absolute">
                {/* Cursor Line */}
                <div
                  style={{
                    ...getCursorStyle(cursor),
                    width: '2px',
                    height: '20px',
                    backgroundColor: cursor.color,
                    opacity: 0.8,
                  }}
                />
                {/* Name Badge */}
                <div
                  style={{
                    ...getCursorStyle(cursor),
                    marginTop: '20px',
                  }}
                  className="text-xs font-medium px-2 py-1 rounded bg-gray-800 text-white whitespace-nowrap"
                >
                  {cursor.userName}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Version History Panel */}
      {showVersionHistory && versions.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 max-h-64 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Version History</h3>
          <div className="space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:border-gray-300 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {version.userName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(version.timestamp).toLocaleTimeString()}
                  </p>
                  {version.description && (
                    <p className="text-xs text-gray-600 mt-1">{version.description}</p>
                  )}
                </div>
                <Button
                  onClick={() => restoreVersion(version.id)}
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
