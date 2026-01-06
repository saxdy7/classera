'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useMessages } from './MessagesProvider';

export function SmartReplies() {
    const { activeConversation, sendMessage } = useMessages();
    const [replies, setReplies] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!activeConversation || !activeConversation.last_message) return;

        // Only generate if last message is NOT from me
        // (This check assumes we have access to currentUserId in context or logic, 
        // but here we might just check if last_message exists. 
        // Ideally we check sender but for hacking, just generate.)

        const element = document.getElementById('smart-replies-container');
        if (element) element.style.display = 'flex';

        const fetchReplies = async () => {
            setLoading(true);
            try {
                const response = await fetch('/api/ai/replies', {
                    method: 'POST',
                    body: JSON.stringify({
                        messages: [activeConversation.last_message] // Send last message for now
                    })
                });
                const data = await response.json();
                if (data.replies) setReplies(data.replies);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchReplies();
    }, [activeConversation?.last_message?.id]);

    if (replies.length === 0) return null;

    return (
        <div id="smart-replies-container" className="flex gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-fuchsia-500 to-indigo-500 text-white flex-shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4" />
            </div>
            {replies.map((reply, i) => (
                <button
                    key={i}
                    onClick={() => {
                        sendMessage(reply);
                        setReplies([]); // Clear after sending
                    }}
                    className="px-3 py-1.5 bg-white border border-indigo-100 rounded-full text-sm text-indigo-600 hover:bg-indigo-50 whitespace-nowrap shadow-sm transition-all"
                >
                    {reply}
                </button>
            ))}
        </div>
    );
}
