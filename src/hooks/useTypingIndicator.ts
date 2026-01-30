'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useTypingIndicator(currentUserId: string, otherUserId: string) {
    const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
    const supabase = createClient();
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hideTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const setTyping = useCallback(async (isTyping: boolean) => {
        try {
            if (isTyping) {
                // Insert or update typing status
                await supabase
                    .from('typing_indicators')
                    .upsert({
                        user_id: currentUserId,
                        conversation_with: otherUserId,
                        is_typing: true,
                        created_at: new Date().toISOString(),
                    }, {
                        onConflict: 'user_id,conversation_with'
                    });
            } else {
                // Delete typing indicator
                await supabase
                    .from('typing_indicators')
                    .delete()
                    .eq('user_id', currentUserId)
                    .eq('conversation_with', otherUserId);
            }
        } catch (error) {
            console.error('Error updating typing status:', error);
        }
    }, [currentUserId, otherUserId, supabase]);

    const handleTyping = useCallback(() => {
        setTyping(true);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            setTyping(false);
        }, 3000);
    }, [setTyping]);

    useEffect(() => {
        // Create consistent topic format: typing:USER1:USER2
        const user1 = currentUserId < otherUserId ? currentUserId : otherUserId;
        const user2 = currentUserId < otherUserId ? otherUserId : currentUserId;
        const topic = `typing:${user1}:${user2}`;

        // Subscribe to broadcast events for typing indicators
        const channel = supabase
            .channel(topic, {
                config: {
                    broadcast: { self: false }, // Don't receive own typing events
                },
            })
            .on(
                'broadcast',
                {
                    event: 'INSERT',
                },
                (payload) => {
                    setIsOtherUserTyping(true);

                    // Clear existing hide timeout
                    if (hideTypingTimeoutRef.current) {
                        clearTimeout(hideTypingTimeoutRef.current);
                    }

                    // Auto-hide after 5 seconds
                    hideTypingTimeoutRef.current = setTimeout(() => {
                        setIsOtherUserTyping(false);
                    }, 5000);
                }
            )
            .on(
                'broadcast',
                {
                    event: 'DELETE',
                },
                (payload) => {
                    setIsOtherUserTyping(false);
                }
            )
            .subscribe((status) => {
            });

        return () => {
            setTyping(false);
            supabase.removeChannel(channel);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (hideTypingTimeoutRef.current) {
                clearTimeout(hideTypingTimeoutRef.current);
            }
        };
    }, [currentUserId, otherUserId, setTyping, supabase]);

    return { isOtherUserTyping, handleTyping, setTyping };
}
