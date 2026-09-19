'use client';

import { useEffect, useRef, useState } from 'react';
import { useMessages, Message } from './MessagesProvider';
import { MoreHorizontal, Search, ArrowLeft, Paperclip, Loader2, MessageSquare, Check, CheckCheck, Wifi, WifiOff } from 'lucide-react';
import { MessageInput } from './MessageInput';
import { format } from 'date-fns';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';

export function ChatWindow({ currentUserId }: { currentUserId: string }) {
    const { activeConversation, setActiveConversation, onlineUsers, messages, loading, refreshMessages } = useMessages();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isConnected, setIsConnected] = useState(true);

    const otherParticipant = activeConversation?.participants.find(p => p.user_id !== currentUserId);
    const otherUser = otherParticipant?.user;
    const isOnline = otherUser && onlineUsers.has(otherUser.id);

    // Typing indicator hook
    const { isOtherUserTyping, handleTyping } = useTypingIndicator(
        currentUserId,
        otherUser?.id || ''
    );

    // Monitor connection status
    useEffect(() => {
        const handleOnline = () => setIsConnected(true);
        const handleOffline = () => setIsConnected(false);
        
        setIsConnected(navigator.onLine);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOtherUserTyping]);

    // Load messages when conversation changes
    useEffect(() => {
        if (activeConversation && otherParticipant) {
            refreshMessages(otherParticipant.user_id);
        }
    }, [activeConversation?.id, otherParticipant?.user_id, refreshMessages]);

    if (!activeConversation || !otherUser) return null;

    return (
        <div className="flex flex-col h-full bg-[rgba(250,250,247,0.5)]">
            {/* Connection Status Banner */}
            {!isConnected && (
                <div className="bg-[var(--cl-warning)] text-[var(--cl-on-dark)] px-4 py-2 text-sm flex items-center justify-center gap-2">
                    <WifiOff className="w-4 h-4" />
                    <span>No internet connection. Messages will be sent when you're back online.</span>
                </div>
            )}

            {/* Header */}
            <div className="h-20 border-b border-[var(--cl-hairline)] bg-[var(--cl-surface-card)] px-6 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setActiveConversation(null)}
                        className="lg:hidden p-2 -ml-2 hover:bg-[var(--cl-surface-strong)] rounded-lg text-[var(--cl-body)] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full bg-[var(--cl-primary-soft)] flex items-center justify-center text-[var(--cl-primary)] font-semibold text-lg ring-2 ring-white">
                            {otherUser.avatar_url ? (
                                <img src={otherUser.avatar_url} alt={otherUser.full_name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                otherUser.full_name[0]
                            )}
                        </div>
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[var(--cl-success)] border-2 border-[var(--cl-on-dark)] rounded-full animate-pulse"></span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-[var(--cl-ink)] leading-tight truncate">
                            {otherUser.full_name}
                        </h3>
                        <p className="text-xs text-[var(--cl-muted)]">
                            {isOnline ? (
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-[var(--cl-success)] rounded-full"></span>
                                    Active now
                                </span>
                            ) : (
                                'Offline'
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-2.5 text-[var(--cl-muted-soft)] hover:text-[var(--cl-primary)] hover:bg-[var(--cl-primary-soft)] rounded-[var(--cl-r-lg)] transition-all">
                        <Search className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 text-[var(--cl-muted-soft)] hover:text-[var(--cl-primary)] hover:bg-[var(--cl-primary-soft)] rounded-[var(--cl-r-lg)] transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 text-[var(--cl-primary)] animate-spin mx-auto mb-3" />
                            <p className="text-sm text-[var(--cl-muted)]">Loading messages...</p>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 ring-8 ring-[var(--cl-hairline)] bg-[var(--cl-primary-soft)]">
                            <MessageSquare className="w-9 h-9 text-[var(--cl-primary)]" />
                        </div>
                        <p className="text-[var(--cl-body)] font-semibold text-lg mb-1">No messages yet</p>
                        <p className="text-sm text-[var(--cl-muted-soft)] max-w-xs">Start the conversation by sending a message below</p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender_id === currentUserId;
                            const prevMsg = messages[idx - 1];
                            const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                            const nextMsg = messages[idx + 1];
                            const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                            return (
                                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                    {!isMe && (
                                        <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                                            {showAvatar ? (
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-[var(--cl-primary)] ring-2 ring-white bg-[var(--cl-primary-soft)]">
                                                    {otherUser.full_name[0]}
                                                </div>
                                            ) : <div className="w-8" />}
                                        </div>
                                    )}

                                    <div className={`flex flex-col max-w-[70%] sm:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-4 py-2.5 rounded-[var(--cl-r-xl)] text-[15px] leading-relaxed relative group ${isMe
                                            ? 'bg-[var(--cl-primary)] text-[var(--cl-on-dark)] rounded-br-md'
                                            : 'bg-[var(--cl-surface-card)] text-[var(--cl-ink)] rounded-bl-md border border-[var(--cl-hairline)]'
                                            }`}>
                                            {msg.type === 'image' && msg.file_url && (
                                                <img
                                                    src={msg.file_url}
                                                    alt="Shared image"
                                                    className="rounded-lg max-w-full mb-2 cursor-pointer hover:opacity-95 transition-opacity max-h-96 object-cover"
                                                    onClick={() => window.open(msg.file_url, '_blank')}
                                                />
                                            )}

                                            {msg.type === 'file' && msg.file_url && (
                                                <a
                                                    href={msg.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex items-center gap-3 p-3 rounded-[var(--cl-r-lg)] mb-2 transition-colors ${isMe ? 'bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)]' : 'bg-[var(--cl-canvas-soft)] hover:bg-[var(--cl-surface-strong)]'
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 ${isMe ? 'bg-[rgba(255,255,255,0.2)]' : 'bg-[var(--cl-primary-soft)]'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                        <Paperclip className={`w-5 h-5 ${isMe ? 'text-[var(--cl-on-dark)]' : 'text-[var(--cl-primary)]'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate text-sm">{msg.file_name || 'Attached File'}</p>
                                                        <p className={`text-xs ${isMe ? 'text-[var(--cl-primary)]' : 'text-[var(--cl-muted)]'}`}>
                                                            {(msg.file_size ? (msg.file_size / 1024 / 1024).toFixed(2) : '0') + ' MB'}
                                                        </p>
                                                    </div>
                                                </a>
                                            )}

                                            <div className="pr-16">{msg.content}</div>
                                            
                                            {/* Timestamp and Read Receipt */}
                                            <div className={`flex items-center gap-1.5 absolute bottom-1.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                <span className={`text-[10px] ${isMe ? 'text-[var(--cl-primary)]' : 'text-[var(--cl-muted-soft)]'}`}>
                                                    {format(new Date(msg.created_at), 'h:mm a')}
                                                </span>
                                                {isMe && (
                                                    msg.read_at ? (
                                                        <CheckCheck className="w-3.5 h-3.5 text-[var(--cl-primary)]" />
                                                    ) : (
                                                        <Check className="w-3.5 h-3.5 text-[var(--cl-primary)]" />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing Indicator */}
                        {isOtherUserTyping && (
                            <div className="flex gap-3">
                                <div className="w-8 flex-shrink-0 flex flex-col justify-end">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-[var(--cl-primary)] ring-2 ring-white bg-[var(--cl-primary-soft)]">
                                        {otherUser.full_name[0]}
                                    </div>
                                </div>
                                <div className="px-5 py-3 rounded-[var(--cl-r-xl)] rounded-bl-md bg-[var(--cl-surface-card)] border border-[var(--cl-hairline)]">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-[var(--cl-surface-strong)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-[var(--cl-surface-strong)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-[var(--cl-surface-strong)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="bg-[var(--cl-surface-card)] border-t border-[var(--cl-hairline)] p-4 flex-shrink-0">
                <MessageInput onTyping={handleTyping} />
            </div>
        </div>
    );
}
