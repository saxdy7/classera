'use client';

import { useState } from 'react';
import { useMessages } from './MessagesProvider';
import { Search, Plus, MoreVertical, MessageSquare, ChevronDown, Users, Star, Archive, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { NewConversationModal } from './NewConversationModal';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationListProps {
    currentUserId: string;
    currentUserRole: 'student' | 'mentor';
}

export function ConversationList({ currentUserId, currentUserRole }: ConversationListProps) {
    const { conversations, activeConversation, setActiveConversation, onlineUsers } = useMessages();
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewConversationModal, setShowNewConversationModal] = useState(false);

    // Filter states
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');

    // Collapsible sections
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

    const filtered = conversations.filter(c => {
        const otherUser = c.participants.find(p => p.user_id !== currentUserId)?.user;
        const matchesSearch = otherUser?.full_name.toLowerCase().includes(searchQuery.toLowerCase());

        // Apply filter
        if (selectedFilter === 'unread' && (!c.unread_count || c.unread_count === 0)) return false;
        if (selectedFilter === 'starred') return false; // TODO: Add starred logic
        if (selectedFilter === 'archived') return false; // TODO: Add archived logic

        return matchesSearch;
    });

    const handleSelectUser = async (user: any) => {
        setShowNewConversationModal(false);

        // Create a temporary conversation object to display the chat
        const newConversation = {
            id: `temp-${user.id}`,
            type: 'direct' as const,
            last_message_at: new Date().toISOString(),
            participants: [
                {
                    user_id: user.id,
                    user: {
                        id: user.id,
                        full_name: user.full_name,
                        avatar_url: user.avatar_url || '',
                        role: user.role || 'student'
                    }
                }
            ]
        };

        setActiveConversation(newConversation);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900">Chats</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowNewConversationModal(true)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                        title="Start new conversation"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* New Conversation Modal */}
            {showNewConversationModal && (
                <NewConversationModal
                    currentUserRole={currentUserRole}
                    onClose={() => setShowNewConversationModal(false)}
                    onSelectUser={handleSelectUser}
                />
            )}

            {/* Search */}
            <div className="px-4 pb-3 pt-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 text-slate-900 placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Filters Section */}
            <div className="px-4 pb-3 border-b border-slate-100">
                {/* Filter Toggle */}
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center justify-between w-full text-left group py-2"
                >
                    <h4 className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                        Filters
                    </h4>
                    <motion.div
                        animate={{ rotate: isFilterOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                    </motion.div>
                </button>

                <AnimatePresence>
                    {isFilterOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-2 mt-2 mb-3">
                                <button
                                    onClick={() => setSelectedFilter('all')}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedFilter === 'all'
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>All Messages</span>
                                </button>
                                <button
                                    onClick={() => setSelectedFilter('unread')}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedFilter === 'unread'
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                    <span>Unread</span>
                                </button>
                                <button
                                    onClick={() => setSelectedFilter('starred')}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedFilter === 'starred'
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <Star className="w-4 h-4" />
                                    <span>Starred</span>
                                </button>
                                <button
                                    onClick={() => setSelectedFilter('archived')}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedFilter === 'archived'
                                            ? 'bg-indigo-50 text-indigo-700'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <Archive className="w-4 h-4" />
                                    <span>Archived</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-slate-600 font-medium text-center">
                            {conversations.length === 0 ? 'No conversations yet' : 'No matches found'}
                        </p>
                        <p className="text-sm text-slate-400 mt-1 text-center">
                            {conversations.length === 0
                                ? `Click the + button to start chatting with ${currentUserRole === 'mentor' ? 'students' : 'mentors'}`
                                : 'Try a different search term'}
                        </p>
                    </div>
                ) : (
                    filtered.map(conv => {
                        const otherParticipant = conv.participants.find(p => p.user_id !== currentUserId);
                        const otherUser = otherParticipant?.user;
                        const isOnline = otherUser && onlineUsers.has(otherUser.id);
                        const isActive = activeConversation?.id === conv.id;

                        if (!otherUser) return null;

                        return (
                            <button
                                key={conv.id}
                                onClick={() => setActiveConversation(conv)}
                                className={`w-full p-4 flex gap-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${isActive ? 'bg-indigo-50/50 hover:bg-indigo-50/80 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                                        {otherUser.avatar_url ? (
                                            <img src={otherUser.avatar_url} alt={otherUser.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold">
                                                {otherUser.full_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    {isOnline && (
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className={`font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-slate-900'}`}>
                                            {otherUser.full_name}
                                        </span>
                                        {conv.last_message_at && (
                                            <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                                                {format(new Date(conv.last_message_at), 'h:mm a')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-slate-500 truncate pr-2">
                                            {conv.last_message ? (
                                                <>
                                                    {conv.last_message.sender_id === currentUserId && 'You: '}
                                                    {conv.last_message.content}
                                                </>
                                            ) : (
                                                <span className="italic">No messages yet</span>
                                            )}
                                        </p>
                                        {conv.unread_count && conv.unread_count > 0 ? (
                                            <span className="min-w-[1.25rem] h-5 px-1.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                {conv.unread_count}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
