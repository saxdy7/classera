'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ThreadViewProps {
    parentMessage: any;
    channelId: string;
    onClose: () => void;
    currentUser: any;
}

export function ThreadView({ parentMessage, channelId, onClose, currentUser }: ThreadViewProps) {
    const [replies, setReplies] = useState<any[]>([]);
    const [newReply, setNewReply] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const repliesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchReplies();
        const subscription = setupRealtimeSubscription();
        return () => {
            subscription?.unsubscribe();
        };
    }, [parentMessage.id]);

    useEffect(() => {
        repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [replies]);

    const fetchReplies = async () => {
        try {
            const res = await fetch(`/api/community-messages?channelId=${channelId}&parentMessageId=${parentMessage.id}`);
            const data = await res.json();
            setReplies((data.messages || []).reverse());
        } catch (error) {
            console.error('Error fetching replies:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupRealtimeSubscription = () => {
        const channel = supabase
            .channel(`thread:${parentMessage.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'community_messages',
                    filter: `parent_message_id=eq.${parentMessage.id}`
                },
                async () => {
                    await fetchReplies();
                }
            )
            .subscribe();
        return channel;
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReply.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch('/api/community-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId,
                    content: newReply.trim(),
                    parentMessageId: parentMessage.id
                })
            });

            if (res.ok) {
                setNewReply('');
            }
        } catch (error) {
            console.error('Error sending reply:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="absolute top-0 right-0 w-96 h-full bg-white border-l border-slate-200 shadow-xl z-30 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <MessageCircle className="w-5 h-5" />
                    Thread
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Parent Message */}
                <div className="pb-4 border-b border-slate-100">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                            {parentMessage.sender.full_name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-semibold text-sm text-slate-900">{parentMessage.sender.full_name}</span>
                                <span className="text-xs text-slate-500">
                                    {new Date(parentMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-sm text-slate-700">{parentMessage.content}</p>
                        </div>
                    </div>
                </div>

                {/* Replies */}
                {loading ? (
                    <div className="flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                                    {reply.sender.full_name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="font-semibold text-sm text-slate-900">{reply.sender.full_name}</span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700">{reply.content}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={repliesEndRef} />
                    </div>
                )}
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t border-slate-200">
                <form onSubmit={handleSendReply} className="flex gap-2">
                    <input
                        type="text"
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        placeholder="Reply to thread..."
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newReply.trim() || sending}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
