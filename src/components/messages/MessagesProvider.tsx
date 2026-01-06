'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// Message type
export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    type: 'text' | 'image' | 'file';
    file_url?: string;
    file_name?: string;
    file_size?: number;
    created_at: string;
    read_at?: string;
    is_edited: boolean;
    is_deleted: boolean;
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string;
        role: string;
    };
    receiver?: {
        id: string;
        full_name: string;
        avatar_url: string;
        role: string;
    };
}

// Conversation type
export interface Conversation {
    id: string;
    type: 'direct' | 'group';
    participants: Array<{
        user_id: string;
        user: {
            id: string;
            full_name: string;
            avatar_url: string;
            role: string;
        };
    }>;
    last_message?: {
        id: string;
        sender_id: string;
        content: string;
        type: string;
        created_at: string;
    };
    last_message_at?: string;
    unread_count?: number;
}

interface MessagesContextType {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    setActiveConversation: (conversation: Conversation | null) => void;
    messages: Message[];
    loading: boolean;
    sendMessage: (content: string, type?: string, file?: File) => Promise<Message>;
    refreshMessages: (otherUserId: string) => Promise<void>;
    onlineUsers: Set<string>;
    typingUsers: Set<string>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children, userId }: { children: ReactNode; userId: string }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [typingUsers] = useState<Set<string>>(new Set());
    const [supabase] = useState(() => createClient());

    // 1. Fetch conversations on mount
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await fetch('/api/conversations');
                const data = await response.json();

                if (data.error) {
                    console.error('Error loading conversations:', data.error);
                    return;
                }

                const transformed = (data.conversations || []).map((conv: any) => ({
                    id: conv.user.id,
                    type: 'direct' as const,
                    participants: [
                        {
                            user_id: userId,
                            user: { id: userId, full_name: '', avatar_url: '', role: '' }
                        },
                        {
                            user_id: conv.user.id,
                            user: {
                                id: conv.user.id,
                                full_name: conv.user.full_name,
                                avatar_url: conv.user.avatar_url,
                                role: conv.user.role
                            }
                        }
                    ],
                    last_message: conv.lastMessage.content ? {
                        id: '',
                        sender_id: conv.lastMessage.isFromCurrentUser ? userId : conv.user.id,
                        content: conv.lastMessage.content,
                        type: 'text' as const,
                        created_at: conv.lastMessage.created_at
                    } : undefined
                }));

                setConversations(transformed);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            }
        };

        fetchConversations();
    }, [userId]);

    // 2. Real-time: Presence tracking
    useEffect(() => {
        const channel = supabase.channel('global_presence')
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const users = new Set<string>();
                Object.keys(newState).forEach(key => {
                    newState[key].forEach((presence: any) => users.add(presence.user_id));
                });
                setOnlineUsers(users);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ user_id: userId, online_at: new Date().toISOString() });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    // 3. Real-time: Subscribe to new messages
    useEffect(() => {
        if (!activeConversation) return;

        const otherUserId = activeConversation.participants.find(p => p.user_id !== userId)?.user_id;
        if (!otherUserId) return;

        console.log('📡 Setting up real-time subscription for:', { userId, otherUserId });

        // Subscribe to messages where we are the receiver
        const msgChannel = supabase
            .channel(`messages:${userId}:${otherUserId}`, {
                config: {
                    broadcast: { self: false }
                }
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${userId}`
                },
                async (payload) => {
                    const newMsg = payload.new as any;
                    console.log('📨 Real-time message received:', newMsg);
                    
                    // Check if this message is from the other user in this conversation
                    if (newMsg.sender_id === otherUserId) {
                        console.log('✅ Message is from current conversation partner');
                        
                        // Add the new message to existing messages
                        try {
                            // Fetch the enriched message with user data
                            const response = await fetch(`/api/messages?otherUserId=${otherUserId}`);
                            const data = await response.json();
                            
                            if (!data.error && data.messages) {
                                console.log('📥 Updating messages, new count:', data.messages.length);
                                setMessages(data.messages);
                            }
                        } catch (error) {
                            console.error('❌ Error fetching messages:', error);
                        }
                    } else {
                        console.log('⏭️ Message is from different conversation');
                    }
                }
            )
            .subscribe((status) => {
                console.log('📡 Subscription status:', status);
            });

        return () => {
            console.log('🔌 Unsubscribing from messages channel');
            supabase.removeChannel(msgChannel);
        };
    }, [activeConversation?.id, userId, supabase]);

    // 4. Function to refresh messages
    const refreshMessages = useCallback(async (otherUserId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/messages?otherUserId=${otherUserId}`);
            const data = await response.json();
            
            if (data.error) {
                console.error('Error loading messages:', data.error);
                setMessages([]);
            } else {
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // 5. Function to send message
    const sendMessage = useCallback(async (content: string, type = 'text', file?: File): Promise<Message> => {
        console.log('🔵 sendMessage called with:', { content, type, activeConversation: activeConversation?.id });
        
        if (!activeConversation) {
            console.error('❌ No active conversation');
            throw new Error('No active conversation');
        }

        const otherParticipant = activeConversation.participants.find(p => p.user_id !== userId);
        if (!otherParticipant) {
            console.error('❌ No other participant found');
            throw new Error('No other participant found');
        }

        const receiverId = otherParticipant.user_id;
        console.log('🔵 Sending to receiverId:', receiverId);

        try {
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
                console.error('❌ API error:', errorData);
                throw new Error(errorData.error || 'Failed to send message');
            }

            const data = await response.json();
            console.log('✅ Message sent successfully:', data.message);
            
            // Immediately add the sent message to the state (optimistic update for sender)
            if (data.message) {
                setMessages(prev => {
                    console.log('📝 Current messages count:', prev.length);
                    // Check if message already exists (avoid duplicates)
                    const exists = prev.some(msg => msg.id === data.message.id);
                    if (exists) {
                        console.log('⚠️ Message already exists, skipping');
                        return prev;
                    }
                    const newMessages = [...prev, data.message];
                    console.log('✅ Added message to state. New count:', newMessages.length);
                    return newMessages;
                });
                
                // Also update the conversation's last message
                setConversations(prevConvs => prevConvs.map(conv => {
                    if (conv.id === receiverId) {
                        return {
                            ...conv,
                            last_message: {
                                id: data.message.id,
                                sender_id: data.message.sender_id,
                                content: data.message.content,
                                type: data.message.type,
                                created_at: data.message.created_at
                            },
                            last_message_at: data.message.created_at
                        };
                    }
                    return conv;
                }));
            }
            
            return data.message;
        } catch (error) {
            console.error('❌ Error sending message:', error);
            throw error;
        }
    }, [activeConversation, userId]);

    return (
        <MessagesContext.Provider value={{
            conversations,
            activeConversation,
            setActiveConversation,
            messages,
            loading,
            sendMessage,
            refreshMessages,
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
