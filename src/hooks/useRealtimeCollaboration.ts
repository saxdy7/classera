import { useEffect, useRef, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/browser';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface CursorPosition {
  userId: string;
  userName: string;
  userAvatar: string;
  line: number;
  column: number;
  color: string;
}

export interface Presence {
  userId: string;
  userName: string;
  userAvatar: string;
  status: 'editing' | 'viewing' | 'idle';
  lastActive: number;
}

export interface DocumentVersion {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  description?: string;
}

interface UseRealtimeCollaborationProps {
  projectId: string;
  userId: string;
  userName: string;
  userAvatar: string;
}

interface CollaborationState {
  cursors: Map<string, CursorPosition>;
  presenceUsers: Map<string, Presence>;
  versions: DocumentVersion[];
  currentContent: string;
  isSynced: boolean;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
];

export function useRealtimeCollaboration({
  projectId,
  userId,
  userName,
  userAvatar,
}: UseRealtimeCollaborationProps) {
  const supabase = createBrowserClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [state, setState] = useState<CollaborationState>({
    cursors: new Map(),
    presenceUsers: new Map(),
    versions: [],
    currentContent: '',
    isSynced: false,
  });

  const userColor = COLORS[Math.abs(userId.charCodeAt(0)) % COLORS.length];

  // Subscribe to real-time changes
  useEffect(() => {
    if (!projectId || !userId) return;

    // Initialize channel
    const channel = supabase.channel(`project:${projectId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    // Handle cursor updates
    channel.on('broadcast', { event: 'cursor' }, (payload) => {
      setState((prev) => {
        const newCursors = new Map(prev.cursors);
        if (payload.payload.userId !== userId) {
          newCursors.set(payload.payload.userId, {
            ...payload.payload,
            color: userColor,
          });
        }
        return { ...prev, cursors: newCursors };
      });
    });

    // Handle document updates
    channel.on('broadcast', { event: 'document' }, (payload) => {
      setState((prev) => ({
        ...prev,
        currentContent: payload.payload.content,
        isSynced: true,
      }));
    });

    // Handle version saves
    channel.on('broadcast', { event: 'version-saved' }, (payload) => {
      setState((prev) => ({
        ...prev,
        versions: [...prev.versions, payload.payload],
      }));
    });

    // Handle presence updates
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const presenceUsers = new Map<string, Presence>();

      Object.entries(state).forEach(([key, presences]: [string, any]) => {
        if (Array.isArray(presences) && presences.length > 0) {
          const presence = presences[0];
          presenceUsers.set(key, {
            userId: presence.userId,
            userName: presence.userName,
            userAvatar: presence.userAvatar,
            status: presence.status || 'viewing',
            lastActive: presence.lastActive || Date.now(),
          });
        }
      });

      setState((prev) => ({
        ...prev,
        presenceUsers,
      }));
    });

    // Subscribe
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Broadcast presence
        channel.track({
          userId,
          userName,
          userAvatar,
          status: 'viewing',
          lastActive: Date.now(),
        });

        setState((prev) => ({
          ...prev,
          isSynced: true,
        }));
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, userId, userName, userAvatar, supabase, userColor]);

  // Broadcast cursor position
  const broadcastCursor = useCallback(
    (line: number, column: number) => {
      if (!channelRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor',
        payload: {
          userId,
          userName,
          userAvatar,
          line,
          column,
          color: userColor,
        },
      });
    },
    [userId, userName, userAvatar, userColor]
  );

  // Broadcast document update
  const broadcastDocument = useCallback(
    (content: string) => {
      if (!channelRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'document',
        payload: {
          userId,
          content,
          timestamp: Date.now(),
        },
      });

      setState((prev) => ({
        ...prev,
        currentContent: content,
      }));
    },
    [userId]
  );

  // Save document version
  const saveVersion = useCallback(
    async (description?: string) => {
      if (!channelRef.current || !state.currentContent) return;

      const version: DocumentVersion = {
        id: `${projectId}-${Date.now()}`,
        userId,
        userName,
        content: state.currentContent,
        timestamp: Date.now(),
        description,
      };

      // Broadcast version save
      channelRef.current.send({
        type: 'broadcast',
        event: 'version-saved',
        payload: version,
      });

      // Save to database
      try {
        await supabase.from('collaboration_versions').insert({
          project_id: projectId,
          user_id: userId,
          user_name: userName,
          content: state.currentContent,
          description,
        });
      } catch (error) {
        console.error('Error saving version:', error);
      }
    },
    [projectId, userId, userName, state.currentContent, supabase]
  );

  // Update presence status
  const updatePresenceStatus = useCallback(
    (status: 'editing' | 'viewing' | 'idle') => {
      if (!channelRef.current) return;

      channelRef.current.track({
        userId,
        userName,
        userAvatar,
        status,
        lastActive: Date.now(),
      });
    },
    [userId, userName, userAvatar]
  );

  // Restore from version
  const restoreVersion = useCallback(
    async (versionId: string) => {
      try {
        const { data, error } = await supabase
          .from('collaboration_versions')
          .select('content')
          .eq('id', versionId)
          .single();

        if (error) throw error;

        broadcastDocument(data.content);
        return data.content;
      } catch (error) {
        console.error('Error restoring version:', error);
        return null;
      }
    },
    [supabase, broadcastDocument]
  );

  // Get active collaborators
  const getActiveCollaborators = useCallback(() => {
    const now = Date.now();
    return Array.from(state.presenceUsers.values()).filter(
      (presence) => now - presence.lastActive < 60000 // 1 minute
    );
  }, [state.presenceUsers]);

  return {
    // State
    cursors: state.cursors,
    presenceUsers: state.presenceUsers,
    versions: state.versions,
    currentContent: state.currentContent,
    isSynced: state.isSynced,

    // Actions
    broadcastCursor,
    broadcastDocument,
    saveVersion,
    updatePresenceStatus,
    restoreVersion,
    getActiveCollaborators,
  };
}
