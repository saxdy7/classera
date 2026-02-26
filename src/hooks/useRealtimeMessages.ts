'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    read_by: string[];
    created_at: string;
    sender?: {
        id: string;
        full_name: string;
        avatar_url?: string;
        role: string;
    };
}

export function useRealtimeMessages(currentUserId: string, otherUserId: string) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchMessages = useCallback(async () => {
        try {
            const response = await fetch(`/api/messages?otherUserId=${otherUserId}`);
            const data = await response.json();
            if (data.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    }, [otherUserId]);

    useEffect(() => {
        fetchMessages();

        // Create consistent topic format: dm:USER1:USER2:messages
        // Always order user IDs consistently (smaller UUID first)
        const user1 = currentUserId < otherUserId ? currentUserId : otherUserId;
        const user2 = currentUserId < otherUserId ? otherUserId : currentUserId;
        const topic = `dm:${user1}:${user2}:messages`;

        // Subscribe to broadcast events on this topic
        const channel: RealtimeChannel = supabase
            .channel(topic, {
                config: {
                    broadcast: { self: true }, // Receive own messages too
                },
            })
            .on(
                'broadcast',
                {
                    event: 'INSERT',
                },
                () => {
                    fetchMessages(); // Refetch to get complete data with joins
                }
            )
            .on(
                'broadcast',
                {
                    event: 'UPDATE',
                },
                () => {
                    fetchMessages();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId, otherUserId, fetchMessages, supabase]);

    return { messages, loading, refetch: fetchMessages };
}
