'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useMessages } from './MessagesProvider';
import { createClient } from '@/lib/supabase/client';

export function SmartReplies() {
    const { activeConversation, sendMessage } = useMessages();
    const [replies, setReplies] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Get current user ID
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUserId(data.user?.id || null);
        });
    }, []);

    useEffect(() => {
        if (!activeConversation || !activeConversation.last_message || !currentUserId) return;
        // Captured locally: the guard above does not narrow inside the async
        // callback below, so the optional field reads as possibly-undefined.
        const lastMessage = activeConversation.last_message;

        // Only generate replies if last message is NOT from current user
        if (activeConversation.last_message.sender_id === currentUserId) {
            setReplies([]);
            return;
        }

        const element = document.getElementById('smart-replies-container');
        if (element) element.style.display = 'flex';

        const fetchReplies = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/ai/replies', {
                    method: 'POST',
                    body: JSON.stringify({
                        message: lastMessage,
                        conversationContext: {
                            senderName: lastMessage.sender?.full_name,
                            senderRole: lastMessage.sender?.role
                        }
                    })
                });
                const data = await response.json();
                if (data.replies) setReplies(data.replies);
            } catch (e) {
                // Silently fail for smart replies
                setReplies([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReplies();
    }, [activeConversation?.last_message?.id, currentUserId]);

    if (replies.length === 0) return null;

    return (
        <div id="smart-replies-container" className="flex gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-center w-8 h-8 rounded-full text-white flex-shrink-0 animate-pulse bg-primary">
                <Sparkles className="w-4 h-4" />
            </div>
            {replies.map((reply, i) => (
                <button
                    key={i}
                    onClick={() => {
                        sendMessage(reply);
                        setReplies([]); // Clear after sending
                    }}
                    className="px-3 py-1.5 bg-card border border-accent-purple rounded-full text-sm text-accent-purple hover:bg-accent-purple/10 whitespace-nowrap transition-all"
                >
                    {reply}
                </button>
            ))}
        </div>
    );
}
