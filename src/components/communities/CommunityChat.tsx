'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Lock, Loader2, Trash2, Search, Pin, PinOff, FileIcon, Download, Pencil, Settings, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MessageSearch } from './MessageSearch';
import { PinnedMessages } from './PinnedMessages';
import { FileUpload } from './FileUpload';
import { ThreadView } from './ThreadView';
import { TypingIndicator } from './TypingIndicator';
import { PreferencesModal } from './PreferencesModal';

interface Message {
    id: string;
    content: string;
    created_at: string;
    sender: {
        id: string;
        full_name: string;
        avatar_url: string | null;
        role: string;
    };
    message_reactions: Array<{
        id: string;
        reaction: string;
        user_id: string;
        user: { full_name: string };
    }>;
    message_attachments?: Array<{
        id: string;
        file_name: string;
        file_url: string;
        file_type: string;
        file_size: number;
    }>;
    thread_count?: number;
    edited_at?: string;
}

interface Channel {
    id: string;
    name: string;
    type: 'announcement' | 'discussion';
    is_locked: boolean;
}

interface CommunityChatProps {
    communityId: string;
    userRole: 'student' | 'mentor';
    userId: string;
    isMuted: boolean;
}

export function CommunityChat({ communityId, userRole, userId, isMuted }: CommunityChatProps) {
    const router = useRouter();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [activeThread, setActiveThread] = useState<Message | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchChannels();
    }, [communityId]);

    useEffect(() => {
        if (activeChannel) {
            fetchMessages();
            // Set up Supabase Realtime subscription
            const subscription = setupRealtimeSubscription();
            return () => {
                subscription?.unsubscribe();
            };
        }
    }, [activeChannel]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchChannels = async () => {
        try {
            const res = await fetch(`/api/community-channels?communityId=${communityId}`);
            const data = await res.json();
            setChannels(data.channels || []);
            if (data.channels?.length > 0) {
                setActiveChannel(data.channels[0]); // Default to announcement channel
            }
        } catch (error) {
            console.error('Error fetching channels:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!activeChannel) return;

        try {
            const res = await fetch(`/api/community-messages?channelId=${activeChannel.id}&limit=50`);
            const data = await res.json();
            // Ensure we fetch attachments too - assuming the API returns them or we need to update the API
            // For now, let's assume the API routes update will include attachments in the select query
            setMessages((data.messages || []).reverse());
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const setupRealtimeSubscription = () => {
        if (!activeChannel) return null;

        const channel = supabase
            .channel(`community-messages:${activeChannel.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'community_messages',
                    filter: `channel_id=eq.${activeChannel.id}`
                },
                async () => {
                    // Refetch messages to get the new one with full data
                    await fetchMessages();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'community_messages',
                    filter: `channel_id=eq.${activeChannel.id}`
                },
                (payload: any) => {
                    // Handle message updates (e.g., deletion)
                    if (payload.new.is_deleted) {
                        setMessages(prev => prev.filter(m => m.id !== payload.new.id));
                    }
                }
            )
            .subscribe();

        return channel;
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingMessageId) {
            handleUpdateMessage();
            return;
        }

        if ((!newMessage.trim() && !selectedFile) || !activeChannel || sending) return;

        // Check permissions
        if (activeChannel.type === 'announcement' && userRole !== 'mentor') {
            alert('Only mentors can post announcements');
            return;
        }

        if (activeChannel.is_locked) {
            alert('This channel is currently locked');
            return;
        }

        if (isMuted) {
            alert('You are muted in this community');
            return;
        }

        setSending(true);
        try {
            // 1. Send the text message first
            const res = await fetch('/api/community-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: activeChannel.id,
                    content: newMessage.trim(),
                    parentMessageId: activeThread?.id
                })
            });

            if (res.ok) {
                const data = await res.json();

                // 2. Upload file if selected
                if (selectedFile && data.message?.id) {
                    const formData = new FormData();
                    formData.append('file', selectedFile);
                    formData.append('messageId', data.message.id);

                    const uploadRes = await fetch('/api/community-messages/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (!uploadRes.ok) {
                        console.error('Failed to upload file');
                        alert('Message sent but file upload failed');
                    }
                }

                setNewMessage('');
                setSelectedFile(null);
                // Message will appear via Realtime subscription
                router.refresh();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleUpdateMessage = async () => {
        if (!editingMessageId || !newMessage.trim()) return;

        try {
            const res = await fetch('/api/community-messages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId: editingMessageId,
                    content: newMessage.trim(),
                    action: 'edit'
                })
            });

            if (res.ok) {
                setEditingMessageId(null);
                setNewMessage('');
                fetchMessages();
            } else {
                alert('Failed to update message');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const startEditing = (message: Message) => {
        setEditingMessageId(message.id);
        setNewMessage(message.content);
        // Focus input
    };

    const handleTyping = () => {
        if (!activeChannel) return;

        // Update presence (debounced)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Broadcast typing
        supabase.channel(`presence:${activeChannel.id}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId }
        });

        // Call API endpoint for persistence if needed, but broadcast is better
        // We implemented Table-based presence in TypingIndicator, so let's update that
        fetch('/api/presence', {
            method: 'POST',
            body: JSON.stringify({ typing: true, channelId: activeChannel.id })
        });

        typingTimeoutRef.current = setTimeout(() => {
            fetch('/api/presence', {
                method: 'POST',
                body: JSON.stringify({ typing: false, channelId: activeChannel.id })
            });
        }, 2000);
    };

    const handleReaction = async (messageId: string, reaction: string) => {
        try {
            await fetch('/api/community-messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'react',
                    messageId,
                    reaction
                })
            });
            fetchMessages(); // Refresh to show updated reactions
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return;

        try {
            const res = await fetch('/api/community-messages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId,
                    reason: 'Inappropriate content'
                })
            });

            if (res.ok) {
                setMessages(prev => prev.filter(m => m.id !== messageId));
                router.refresh();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to delete message');
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            alert('Failed to delete message');
        }
    };

    const handlePinMessage = async (messageId: string) => {
        try {
            const res = await fetch('/api/community-messages/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId,
                    communityId,
                    action: 'pin'
                })
            });

            if (res.ok) {
                // Refresh pinned messages by re-rendering PinnedMessages component
                // For now, we rely on the component's internal fetch or a parent re-render
                // A better approach would be to have a refresh callback
                router.refresh();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to pin message');
            }
        } catch (error) {
            console.error('Error pinning message:', error);
            alert('Failed to pin message');
        }
    };

    const handleUnpinMessage = async (messageId: string) => {
        try {
            const res = await fetch('/api/community-messages/pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messageId,
                    communityId,
                    action: 'unpin'
                })
            });

            if (!res.ok) {
                const error = await res.json();
                alert(error.error || 'Failed to unpin message');
            }
        } catch (error) {
            console.error('Error unpinning message:', error);
            alert('Failed to unpin message');
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInHours * 60);
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const canPost = () => {
        if (!activeChannel) return false;
        if (activeChannel.is_locked) return false;
        if (isMuted) return false;
        if (activeChannel.type === 'announcement' && userRole !== 'mentor') return false;
        return true;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
            {/* Thread View */}
            {activeThread && (
                <ThreadView
                    parentMessage={activeThread}
                    channelId={activeChannel?.id || ''} // Assuming activeChannel is not null here
                    onClose={() => setActiveThread(null)}
                    currentUser={{ id: userId, role: userRole }}
                />
            )}

            {/* Channel Tabs & Search */}
            <div className="flex border-b border-slate-200 relative">
                <div className="flex-1 flex">
                    {channels.map((channel) => (
                        <button
                            key={channel.id}
                            onClick={() => setActiveChannel(channel)}
                            className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeChannel?.id === channel.id
                                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                {channel.type === 'announcement' ? '📢' : '💬'} {channel.name}
                                {channel.is_locked && <Lock className="w-4 h-4 text-amber-600" />}
                            </div>
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowSearch(!showSearch)}
                    className="px-4 border-l border-slate-200 hover:bg-slate-50 transition-colors"
                    title="Search messages"
                >
                    <Search className="w-5 h-5 text-slate-500" />
                </button>
                <button
                    onClick={() => setShowPreferences(true)}
                    className="px-4 border-l border-slate-200 hover:bg-slate-50 transition-colors"
                    title="Chat settings"
                >
                    <Settings className="w-5 h-5 text-slate-500" />
                </button>

                {showSearch && activeChannel && (
                    <MessageSearch
                        channelId={activeChannel.id}
                        onClose={() => setShowSearch(false)}
                    />
                )}
            </div>

            {/* Preferences Modal */}
            {showPreferences && (
                <PreferencesModal
                    communityId={communityId}
                    onClose={() => setShowPreferences(false)}
                />
            )}

            {/* Pinned Messages */}
            <PinnedMessages
                communityId={communityId}
                isMentor={userRole === 'mentor'}
                onUnpin={handleUnpinMessage}
            />

            {/* Messages Area */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg font-semibold">No messages yet</p>
                        <p className="text-sm">Be the first to start the conversation!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id} className="flex gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                {message.sender.full_name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-semibold text-slate-900">{message.sender.full_name}</span>
                                    {message.sender.role === 'mentor' && (
                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                            Mentor
                                        </span>
                                    )}
                                    <span className="text-xs text-slate-500">{formatTime(message.created_at)}</span>

                                    {/* Actions (Mentor Only & Owner) */}
                                    <div className="ml-auto opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                                        {message.sender.id === userId && (
                                            <button
                                                onClick={() => startEditing(message)}
                                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"
                                                title="Edit message"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        )}
                                        {userRole === 'mentor' && (
                                            <>
                                                <button
                                                    onClick={() => handlePinMessage(message.id)}
                                                    className="p-1 hover:bg-indigo-100 rounded text-slate-400 hover:text-indigo-600"
                                                    title="Pin message"
                                                >
                                                    <Pin className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteMessage(message.id)}
                                                    className="p-1 hover:bg-red-100 rounded text-slate-400 hover:text-red-600"
                                                    title="Delete message"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <p className="text-slate-700 whitespace-pre-wrap">
                                    {message.content}
                                    {message.edited_at && <span className="text-xs text-slate-400 ml-2">(edited)</span>}
                                </p>

                                {/* Attachments */}
                                {message.message_attachments && message.message_attachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {message.message_attachments.map((attachment) => (
                                            <div key={attachment.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg max-w-sm">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <FileIcon className="w-5 h-5 text-indigo-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">
                                                        {attachment.file_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                                <a
                                                    href={attachment.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4 text-slate-600" />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Reactions & Thread */}
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={() => setActiveThread(message)}
                                        className="px-2 py-1 rounded-lg text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        {message.thread_count ? `${message.thread_count} Replies` : 'Reply'}
                                    </button>

                                    {['👍', '❤️', '🔥'].map((emoji) => {
                                        const reactions = message.message_reactions.filter(r => r.reaction === emoji);
                                        const hasReacted = reactions.some(r => r.user_id === userId);
                                        return (
                                            <button
                                                key={emoji}
                                                onClick={() => handleReaction(message.id, emoji)}
                                                className={`px-2 py-1 rounded-lg text-sm transition-colors ${hasReacted
                                                    ? 'bg-indigo-100 text-indigo-700'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {emoji} {reactions.length > 0 && reactions.length}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-slate-200 p-4">
                {activeChannel?.is_locked ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-amber-600">
                        <Lock className="w-5 h-5" />
                        <span className="font-semibold">This channel is locked</span>
                    </div>
                ) : isMuted ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-red-600">
                        <span className="font-semibold">You are muted in this community</span>
                    </div>
                ) : activeChannel?.type === 'announcement' && userRole !== 'mentor' ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-slate-500">
                        <span className="font-semibold">Only mentors can post announcements</span>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                        <FileUpload
                            selectedFile={selectedFile}
                            onFileSelect={setSelectedFile}
                            onClear={() => setSelectedFile(null)}
                            disabled={!canPost() || sending}
                        />
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                handleTyping();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape' && editingMessageId) {
                                    setEditingMessageId(null);
                                    setNewMessage('');
                                }
                            }}
                            placeholder={editingMessageId ? "Edit your message... (Esc to cancel)" : (selectedFile ? "Add a caption..." : "Type a message...")}
                            disabled={!canPost() || sending}
                            className={`flex-1 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed ${editingMessageId ? 'border-amber-400 bg-amber-50' : 'border-slate-200'
                                }`}
                        />
                        {editingMessageId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingMessageId(null);
                                    setNewMessage('');
                                }}
                                className="p-2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={(!newMessage.trim() && !selectedFile) || !canPost() || sending}
                            className={`px-6 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${editingMessageId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                        >
                            {sending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                editingMessageId ? <Pencil className="w-5 h-5" /> : <Send className="w-5 h-5" />
                            )}
                            {editingMessageId ? 'Save' : 'Send'}
                        </button>
                    </form>
                )}
                {activeChannel && <TypingIndicator channelId={activeChannel.id} supabase={supabase} />}
            </div>
        </div>
    );
}
