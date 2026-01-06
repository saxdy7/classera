'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types
export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'file';
    created_at: string;
    is_edited: boolean;
    is_deleted: boolean;
    file_url?: string;
    file_name?: string;
    file_size?: number;
    file_type?: string;
    thumbnail_url?: string;
    reply_to?: string;
    sender?: {
        full_name: string;
        avatar_url: string;
    };
}

export interface Conversation {
    id: string;
    type: 'direct' | 'group';
    name?: string;
    image_url?: string;
    last_message_at: string;
    unread_count?: number;
    participants: {
        user_id: string;
        user: {
            id: string;
            full_name: string;
            avatar_url: string;
            last_seen: string;
            is_online?: boolean;  // Client-side mapping
        };
    }[];
    last_message?: Message;
}

interface MessagesContextType {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    setActiveConversation: (conv: Conversation | null) => void;
    loading: boolean;
    sendMessage: (content: string, type?: string, file?: any) => Promise<void>;
    markAsRead: (conversationId: string) => Promise<void>;
    onlineUsers: Set<string>;
    typingUsers: { [conversationId: string]: string[] }; // userIds typing
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children, userId }: { children: ReactNode; userId: string }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [typingUsers, setTypingUsers] = useState<{ [key: string]: string[] }>({});

    const supabase = createClient();

    // 1. Initial Fetch
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                // Use API endpoint that handles the simple messages schema
                const response = await fetch('/api/conversations');
                const data = await response.json();
                
                if (data.error) {
                    console.error('Error fetching conversations:', data.error);
                    setLoading(false);
                    return;
                }

                // Transform API response to match our Conversation type
                const transformed = (data.conversations || []).map((conv: any) => ({
                    id: conv.user.id, // Use user ID as conversation ID for direct messages
                    type: 'direct' as const,
                    last_message_at: conv.lastMessage.created_at,
                    unread_count: conv.unreadCount,
                    participants: [
                        {
                            user_id: conv.user.id,
                            user: {
                                id: conv.user.id,
                                full_name: conv.user.full_name,
                                avatar_url: conv.user.avatar_url,
                                last_seen: new Date().toISOString(),
                                is_online: false
                            }
                        }
                    ],
                    last_message: conv.lastMessage.content ? {
                        id: '',
                        conversation_id: conv.user.id,
                        sender_id: conv.lastMessage.isFromCurrentUser ? userId : conv.user.id,
                        content: conv.lastMessage.content,
                        type: 'text' as const,
                        created_at: conv.lastMessage.created_at,
                        is_edited: false,
                        is_deleted: false
                    } : undefined
                }));

                setConversations(transformed);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, [userId]);


    // 2. Realtime Subscription (Global Presence + New User Messages)
    useEffect(() => {
        const channel = supabase.channel('global_presence')
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const users = new Set<string>();
                Object.keys(newState).forEach(key => {
                    // @ts-ignore
                    newState[key].forEach((presence: any) => users.add(presence.user_id));
                });
                setOnlineUsers(users);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ user_id: userId, online_at: new Date().toISOString() });
                }
            });

        // Subscribe to NEW messages in any conversation I'm in
        // Note: RLS allows us to listen to 'messages' table directly for rows valid for us
        const msgChannel = supabase.channel('incoming_messages')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMsg = payload.new as Message;
                    // Update Conversation List Last Message
                    setConversations(prev => {
                        const convIndex = prev.findIndex(c => c.id === newMsg.conversation_id);
                        if (convIndex === -1) return prev; // New conversation handling needed separately

                        const updated = [...prev];
                        updated[convIndex] = {
                            ...updated[convIndex],
                            last_message: newMsg,
                            last_message_at: newMsg.created_at,
                            unread_count: (updated[convIndex].unread_count || 0) + 1
                        };
                        // Sort by recent
                        return updated.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(msgChannel);
        };
    }, [userId]);


    const sendMessage = async (content: string, type = 'text', file?: File) => {
        if (!activeConversation) return;

        try {
            // Get the other user's ID (receiver)
            const otherParticipant = activeConversation.participants.find(p => p.user_id !== userId);
            if (!otherParticipant) {
                console.error('No other participant found');
                return;
            }

            const receiverId = otherParticipant.user_id;

            // Send message via API (handles simple schema with sender_id/receiver_id)
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId,
                    content: content.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error sending message:', errorData);
                throw new Error(errorData.error || 'Failed to send message');
            }

            const data = await response.json();
            
            if (data.error) {
                console.error('Error sending message:', data.error);
                throw new Error(data.error);
            }

            // Message sent successfully
            console.log('Message sent successfully:', data.message);
            
            // Return the message so UI can update immediately
            return data.message;
        } catch (error) {
            console.error('Error in sendMessage:', error);
            throw error;
        }
    };

    const markAsRead = async (conversationId: string) => {
        // Update read receipt
    };

    return (
        <MessagesContext.Provider value={{
            conversations,
            activeConversation,
            setActiveConversation,
            loading,
            sendMessage,
            markAsRead,
            onlineUsers,
            typingUsers
        }}>
            {children}
        </MessagesContext.Provider>
    );
}

export const useMessages = () => {
    const context = useContext(MessagesContext);
    if (context === undefined) {
        throw new Error('useMessages must be used within a MessagesProvider');
    }
    return context;
};
