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
        <div className="absolute top-0 right-0 w-96 h-full bg-[var(--cl-surface-card)] border-l border-[var(--cl-hairline)] z-30 flex flex-col">
            <div className="p-4 border-b border-[var(--cl-hairline)] flex items-center justify-between bg-[var(--cl-canvas-soft)]">
                <div className="flex items-center gap-2 font-semibold text-[var(--cl-ink)]">
                    <MessageCircle className="w-5 h-5" />
                    Thread
                </div>
                <button onClick={onClose} className="p-1 hover:bg-[var(--cl-surface-strong)] rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Parent Message */}
                <div className="pb-4 border-b border-[var(--cl-hairline)]">
                    <div className="flex gap-3">
                        <div className="w-8 h-8 bg-[var(--cl-primary-soft)] rounded-full flex items-center justify-center text-xs font-semibold text-[var(--cl-primary)] flex-shrink-0">
                            {parentMessage.sender.full_name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-semibold text-sm text-[var(--cl-ink)]">{parentMessage.sender.full_name}</span>
                                <span className="text-xs text-[var(--cl-muted)]">
                                    {new Date(parentMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-sm text-[var(--cl-body)]">{parentMessage.content}</p>
                        </div>
                    </div>
                </div>

                {/* Replies */}
                {loading ? (
                    <div className="flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--cl-primary)]" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {replies.map((reply) => (
                            <div key={reply.id} className="flex gap-3">
                                <div className="w-8 h-8 bg-[var(--cl-surface-strong)] rounded-full flex items-center justify-center text-xs font-semibold text-[var(--cl-body)] flex-shrink-0">
                                    {reply.sender.full_name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="font-semibold text-sm text-[var(--cl-ink)]">{reply.sender.full_name}</span>
                                        <span className="text-xs text-[var(--cl-muted)]">
                                            {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--cl-body)]">{reply.content}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={repliesEndRef} />
                    </div>
                )}
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t border-[var(--cl-hairline)]">
                <form onSubmit={handleSendReply} className="flex gap-2">
                    <input
                        type="text"
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        placeholder="Reply to thread..."
                        className="flex-1 px-3 py-2 rounded-lg border border-[var(--cl-hairline)] focus:outline-none focus:ring-2 focus:ring-[var(--cl-primary)] text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newReply.trim() || sending}
                        className="p-2 bg-[var(--cl-primary)] hover:bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-lg transition-colors disabled:opacity-50"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
