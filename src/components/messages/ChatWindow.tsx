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
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Connection Status Banner */}
            {!isConnected && (
                <div className="bg-amber-500 text-white px-4 py-2 text-sm flex items-center justify-center gap-2">
                    <WifiOff className="w-4 h-4" />
                    <span>No internet connection. Messages will be sent when you're back online.</span>
                </div>
            )}

            {/* Header */}
            <div className="h-20 border-b border-slate-200 bg-white px-6 flex items-center justify-between shadow-sm flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setActiveConversation(null)}
                        className="lg:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="relative flex-shrink-0">
                        <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg ring-2 ring-white">
                            {otherUser.avatar_url ? (
                                <img src={otherUser.avatar_url} alt={otherUser.full_name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                                otherUser.full_name[0]
                            )}
                        </div>
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 leading-tight truncate">
                            {otherUser.full_name}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {isOnline ? (
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    Active now
                                </span>
                            ) : (
                                'Offline'
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <Search className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                            <p className="text-sm text-slate-500">Loading messages...</p>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-slate-50">
                            <MessageSquare className="w-9 h-9 text-indigo-400" />
                        </div>
                        <p className="text-slate-700 font-semibold text-lg mb-1">No messages yet</p>
                        <p className="text-sm text-slate-400 max-w-xs">Start the conversation by sending a message below</p>
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
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-bold text-indigo-700 ring-2 ring-white shadow-sm">
                                                    {otherUser.full_name[0]}
                                                </div>
                                            ) : <div className="w-8" />}
                                        </div>
                                    )}

                                    <div className={`flex flex-col max-w-[70%] sm:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-[15px] leading-relaxed relative group ${isMe
                                            ? 'bg-indigo-600 text-white rounded-br-md'
                                            : 'bg-white text-slate-800 rounded-bl-md border border-slate-100'
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
                                                    className={`flex items-center gap-3 p-3 rounded-xl mb-2 transition-colors ${isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-50 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 ${isMe ? 'bg-white/20' : 'bg-indigo-100'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                                        <Paperclip className={`w-5 h-5 ${isMe ? 'text-white' : 'text-indigo-600'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium truncate text-sm">{msg.file_name || 'Attached File'}</p>
                                                        <p className={`text-xs ${isMe ? 'text-indigo-100' : 'text-slate-500'}`}>
                                                            {(msg.file_size ? (msg.file_size / 1024 / 1024).toFixed(2) : '0') + ' MB'}
                                                        </p>
                                                    </div>
                                                </a>
                                            )}

                                            <div className="pr-16">{msg.content}</div>
                                            
                                            {/* Timestamp and Read Receipt */}
                                            <div className={`flex items-center gap-1.5 absolute bottom-1.5 right-3 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                <span className={`text-[10px] ${isMe ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                    {format(new Date(msg.created_at), 'h:mm a')}
                                                </span>
                                                {isMe && (
                                                    msg.read_at ? (
                                                        <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />
                                                    ) : (
                                                        <Check className="w-3.5 h-3.5 text-indigo-200" />
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
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-bold text-indigo-700 ring-2 ring-white shadow-sm">
                                        {otherUser.full_name[0]}
                                    </div>
                                </div>
                                <div className="px-5 py-3 rounded-2xl rounded-bl-md bg-white border border-slate-100 shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 p-4 flex-shrink-0">
                <MessageInput onTyping={handleTyping} />
            </div>
        </div>
    );
}
