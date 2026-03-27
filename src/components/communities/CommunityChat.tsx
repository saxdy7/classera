'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    MessageCircle, Send, Lock, Loader2, Trash2, Search,
    Pin, Pencil, X, Hash, Megaphone, MessageSquareOff, AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Message {
    id: string;
    content: string;
    created_at: string;
    edited_at?: string | null;
    user_id?: string;
    sender_id?: string;
    sender?: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        role: string;
    };
    message_reactions?: Array<{
        id: string;
        reaction: string;
        user_id: string;
    }>;
    thread_count?: number;
}

interface Channel {
    id: string;
    name: string;
    type: 'announcement' | 'discussion' | string;
    is_locked: boolean;
}

interface CommunityChatProps {
    communityId: string;
    userRole: 'student' | 'mentor';
    userId: string;
    isMuted: boolean;
    messagingEnabled: boolean;
    onToggleMessaging?: (enabled: boolean) => Promise<void>;
}

export function CommunityChat({
    communityId,
    userRole,
    userId,
    isMuted,
    messagingEnabled,
    onToggleMessaging,
}: CommunityChatProps) {
    const router = useRouter();
    const supabase = createClient();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [togglingMsg, setTogglingMsg] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ─── data fetching ──────────────────────────────────────────────────────

    const fetchChannels = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch(`/api/community-channels?communityId=${communityId}`);
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            const ch: Channel[] = data.channels || [];
            setChannels(ch);
            if (ch.length > 0 && !activeChannel) setActiveChannel(ch[0]);
        } catch (e: any) {
            setError('Failed to load channels — ' + e.message);
        } finally {
            setLoading(false);
        }
    }, [communityId]);

    const fetchMessages = useCallback(async () => {
        if (!activeChannel) return;
        try {
            const res = await fetch(`/api/community-messages?channelId=${activeChannel.id}&limit=60`);
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            setMessages((data.messages || []).reverse());
        } catch (e: any) {
            console.error('Fetch messages:', e);
        }
    }, [activeChannel]);

    useEffect(() => { fetchChannels(); }, [fetchChannels]);
    useEffect(() => {
        if (!activeChannel) return;
        fetchMessages();

        // Realtime subscription
        const sub = supabase
            .channel(`chat:${activeChannel.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'community_messages',
                filter: `channel_id=eq.${activeChannel.id}`,
            }, () => fetchMessages())
            .subscribe();

        return () => { sub.unsubscribe(); };
    }, [activeChannel]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ─── permissions ────────────────────────────────────────────────────────

    const canPost = () => {
        if (!activeChannel) return false;
        if (!messagingEnabled && userRole !== 'mentor') return false;
        if (activeChannel.is_locked) return false;
        if (isMuted) return false;
        if (activeChannel.type === 'announcement' && userRole !== 'mentor') return false;
        return true;
    };

    const reasonCannotPost = (): string | null => {
        if (!activeChannel) return null;
        if (!messagingEnabled && userRole !== 'mentor') return 'Messaging is disabled by the mentor';
        if (activeChannel.is_locked) return 'This channel is locked';
        if (isMuted) return 'You are muted in this community';
        if (activeChannel.type === 'announcement' && userRole !== 'mentor') return 'Only the mentor can post announcements';
        return null;
    };

    // ─── send / edit ─────────────────────────────────────────────────────────

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChannel || sending) return;

        if (editingId) {
            // Edit mode
            setSending(true);
            try {
                const res = await fetch('/api/community-messages', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messageId: editingId, content: newMessage.trim(), action: 'edit' }),
                });
                if (res.ok) {
                    setEditingId(null);
                    setEditContent('');
                    setNewMessage('');
                    fetchMessages();
                } else {
                    const d = await res.json();
                    alert(d.error || 'Failed to edit message');
                }
            } finally { setSending(false); }
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/community-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channelId: activeChannel.id, content: newMessage.trim() }),
            });
            if (res.ok) {
                setNewMessage('');
                // realtime will pick it up; also force refresh
                await fetchMessages();
            } else {
                const d = await res.json();
                alert(d.error || 'Failed to send message');
            }
        } catch (e) {
            alert('Network error — please try again');
        } finally {
            setSending(false);
        }
    };

    const startEdit = (msg: Message) => {
        setEditingId(msg.id);
        setNewMessage(msg.content);
        inputRef.current?.focus();
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewMessage('');
    };

    const handleDelete = async (msgId: string) => {
        if (!confirm('Delete this message?')) return;
        const res = await fetch('/api/community-messages', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: msgId }),
        });
        if (res.ok) fetchMessages();
        else { const d = await res.json(); alert(d.error || 'Failed'); }
    };

    const handleReact = async (msgId: string, emoji: string) => {
        await fetch('/api/community-messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'react', messageId: msgId, reaction: emoji }),
        });
        fetchMessages();
    };

    // ─── messaging toggle ────────────────────────────────────────────────────

    const handleToggleMessaging = async () => {
        if (!onToggleMessaging) return;
        setTogglingMsg(true);
        try {
            await onToggleMessaging(!messagingEnabled);
            router.refresh(); // Refresh page data
        } finally {
            setTogglingMsg(false);
        }
    };

    // ─── helpers ─────────────────────────────────────────────────────────────

    const fmtTime = (s: string) => {
        const d = new Date(s), now = new Date();
        const diff = (now.getTime() - d.getTime()) / 60000;
        if (diff < 1) return 'just now';
        if (diff < 60) return `${Math.floor(diff)}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const filteredMessages = searchQuery
        ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.sender?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages;

    // ─── render ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-3xl border border-red-200 shadow-sm flex flex-col items-center justify-center h-64 gap-3 text-red-600">
                <AlertCircle className="w-10 h-10" />
                <p className="font-semibold">{error}</p>
                <button onClick={fetchChannels} className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

            {/* ── Top bar ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-indigo-600" />
                    <h2 className="font-bold text-slate-900">Community Chat</h2>
                    {!messagingEnabled && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                            <MessageSquareOff className="w-3 h-3" /> Messaging Off
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Search toggle */}
                    <button
                        onClick={() => { setShowSearch(s => !s); setSearchQuery(''); }}
                        className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'}`}
                        title="Search messages"
                    >
                        <Search className="w-4 h-4" />
                    </button>

                    {/* Mentor: messaging toggle */}
                    {userRole === 'mentor' && onToggleMessaging && (
                        <button
                            onClick={handleToggleMessaging}
                            disabled={togglingMsg}
                            title={messagingEnabled ? 'Disable student messaging' : 'Enable student messaging'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${messagingEnabled
                                ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300'
                                } disabled:opacity-60`}
                        >
                            {togglingMsg
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : messagingEnabled
                                    ? <MessageCircle className="w-4 h-4" />
                                    : <MessageSquareOff className="w-4 h-4" />
                            }
                            {messagingEnabled ? 'Messaging On' : 'Messaging Off'}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Channel tabs ── */}
            {channels.length > 0 && (
                <div className="flex border-b border-slate-200 bg-slate-50">
                    {channels.map(ch => (
                        <button
                            key={ch.id}
                            onClick={() => setActiveChannel(ch)}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${activeChannel?.id === ch.id
                                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                                : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                                }`}
                        >
                            {ch.type === 'announcement'
                                ? <Megaphone className="w-4 h-4" />
                                : <Hash className="w-4 h-4" />}
                            {ch.name}
                            {ch.is_locked && <Lock className="w-3 h-3 text-amber-500" />}
                        </button>
                    ))}
                </div>
            )}

            {channels.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Hash className="w-12 h-12 mb-3 opacity-40" />
                    <p className="font-semibold">No channels yet</p>
                    <p className="text-sm">Channels will appear here once the community is set up</p>
                </div>
            )}

            {/* ── Search bar ── */}
            {showSearch && (
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search messages…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p className="text-xs text-slate-500 mt-1">{filteredMessages.length} result(s)</p>
                    )}
                </div>
            )}

            {/* ── Messages ── */}
            {activeChannel && (
                <div className="flex-1 h-[460px] overflow-y-auto p-5 space-y-4">
                    {filteredMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                            <MessageCircle className="w-14 h-14 opacity-30" />
                            <p className="font-semibold text-lg">
                                {searchQuery ? 'No messages match your search' : 'No messages yet'}
                            </p>
                            {!searchQuery && canPost() && (
                                <p className="text-sm">Be the first to say something! 👋</p>
                            )}
                        </div>
                    ) : (
                        filteredMessages.map(msg => {
                            const messageOwnerId = msg.user_id || msg.sender_id || msg.sender?.id;
                            const isOwn = messageOwnerId === userId;
                            const isMentor = msg.sender?.role === 'mentor';
                            return (
                                <div key={msg.id} className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}>
                                    {/* Avatar */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${isMentor ? 'bg-gradient-to-br from-indigo-600 to-purple-600' : 'bg-gradient-to-br from-slate-400 to-slate-600'
                                        }`}>
                                        {(msg.sender?.full_name || '?').charAt(0).toUpperCase()}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                        {/* Meta */}
                                        <div className={`flex items-center gap-3 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                            <span className="font-black text-xs text-slate-800 tracking-tight uppercase">{msg.sender?.full_name}</span>
                                            {isMentor && (
                                                <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm shadow-indigo-600/10">Mentor</span>
                                            )}
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{fmtTime(msg.created_at)}</span>
                                            {msg.edited_at && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">(edited)</span>}
                                        </div>

                                        {/* Message */}
                                        <div className={`relative px-5 py-4 rounded-[1.5rem] text-sm leading-relaxed font-medium shadow-sm border ${isOwn
                                            ? 'bg-indigo-600 text-white border-indigo-700 rounded-tr-sm self-end'
                                            : 'bg-white text-slate-700 border-slate-100 rounded-tl-sm self-start'
                                            }`}>
                                            {msg.content}
                                        </div>

                                        {/* Actions bar */}
                                        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'flex-row-reverse' : ''}`}>
                                            {/* Reactions */}
                                            {['👍', '❤️', '🔥', '😂'].map(emoji => {
                                                const reacted = msg.message_reactions?.some(r => r.reaction === emoji && r.user_id === userId);
                                                const count = msg.message_reactions?.filter(r => r.reaction === emoji).length || 0;
                                                return (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleReact(msg.id, emoji)}
                                                        className={`px-2 py-0.5 rounded-full text-xs transition-colors ${reacted ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                            }`}
                                                    >
                                                        {emoji}{count > 0 ? ` ${count}` : ''}
                                                    </button>
                                                );
                                            })}

                                            {/* Edit (own messages) */}
                                            {isOwn && (
                                                <button onClick={() => startEdit(msg)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors" title="Edit">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                            )}

                                            {/* Delete (mentor only) */}
                                            {userRole === 'mentor' && (
                                                <button onClick={() => handleDelete(msg.id)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}

                                            {/* Pin (mentor only) */}
                                            {userRole === 'mentor' && (
                                                <button className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors" title="Pin message">
                                                    <Pin className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}

            {/* ── Input ── */}
            {activeChannel && (
                <div className="border-t border-slate-200 p-4">
                    {(() => {
                        const reason = reasonCannotPost();
                        if (reason) {
                            return (
                                <div className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 rounded-xl text-slate-500">
                                    {reason.includes('disabled') ? <MessageSquareOff className="w-5 h-5 text-amber-500" /> : <Lock className="w-5 h-5" />}
                                    <span className="font-medium text-sm">{reason}</span>
                                </div>
                            );
                        }
                        return (
                            <form onSubmit={handleSend} className="flex gap-2 items-center">
                                {editingId && (
                                    <button type="button" onClick={cancelEdit} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0">
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); }}
                                    placeholder={editingId ? 'Edit your message… (Esc to cancel)' : 'Type a message…'}
                                    disabled={sending}
                                    className={`flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-60 ${editingId ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'
                                        }`}
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    className={`px-5 py-3 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
                                        }`}
                                >
                                    {sending
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : editingId
                                            ? <Pencil className="w-4 h-4" />
                                            : <Send className="w-4 h-4" />
                                    }
                                    {editingId ? 'Save' : 'Send'}
                                </button>
                            </form>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
