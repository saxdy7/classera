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

    // Starred and archived conversations (stored in localStorage)
    const [starredConversations, setStarredConversations] = useState<Set<string>>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(`starred-${currentUserId}`);
            return new Set(stored ? JSON.parse(stored) : []);
        }
        return new Set();
    });

    const [archivedConversations, setArchivedConversations] = useState<Set<string>>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(`archived-${currentUserId}`);
            return new Set(stored ? JSON.parse(stored) : []);
        }
        return new Set();
    });

    // Helper functions for starred/archived
    const toggleStarred = (conversationId: string) => {
        const newStarred = new Set(starredConversations);
        if (newStarred.has(conversationId)) {
            newStarred.delete(conversationId);
        } else {
            newStarred.add(conversationId);
        }
        setStarredConversations(newStarred);
        localStorage.setItem(`starred-${currentUserId}`, JSON.stringify([...newStarred]));
    };

    const toggleArchived = (conversationId: string) => {
        const newArchived = new Set(archivedConversations);
        if (newArchived.has(conversationId)) {
            newArchived.delete(conversationId);
        } else {
            newArchived.add(conversationId);
        }
        setArchivedConversations(newArchived);
        localStorage.setItem(`archived-${currentUserId}`, JSON.stringify([...newArchived]));
    };

    // Collapsible sections
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

    const filtered = conversations.filter(c => {
        const otherUser = c.participants.find(p => p.user_id !== currentUserId)?.user;
        const matchesSearch = otherUser?.full_name.toLowerCase().includes(searchQuery.toLowerCase());

        // Apply filter
        if (selectedFilter === 'unread' && (!c.unread_count || c.unread_count === 0)) return false;
        if (selectedFilter === 'starred' && !starredConversations.has(c.id)) return false;
        if (selectedFilter === 'archived' && !archivedConversations.has(c.id)) return false;

        // Hide archived from 'all' and 'unread' views
        if (selectedFilter !== 'archived' && archivedConversations.has(c.id)) return false;

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
            <div className="p-4 border-b border-border flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-foreground">Chats</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowNewConversationModal(true)}
                        className="p-2 hover:bg-muted rounded-lg text-foreground/80 transition-colors"
                        title="Start new conversation"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-muted rounded-lg text-foreground/80">
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-muted/40 border-none rounded-lg text-sm focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground/70"
                    />
                </div>
            </div>

            {/* Filters Section */}
            <div className="px-4 pb-3 border-b border-border">
                {/* Filter Toggle */}
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center justify-between w-full text-left group py-2"
                >
                    <h4 className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                        Filters
                    </h4>
                    <motion.div
                        animate={{ rotate: isFilterOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
                                            ? 'bg-accent-purple/10 text-accent-purple'
                                            : 'text-foreground/80 hover:bg-muted/40'
                                        }`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>All Messages</span>
                                </button>
                                <button
                                    onClick={() => setSelectedFilter('unread')}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedFilter === 'unread'
                                            ? 'bg-accent-purple/10 text-accent-purple'
                                            : 'text-foreground/80 hover:bg-muted/40'
                                        }`}
                                >
                                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                                    <span>Unread</span>
                                </button>
                                <button
                                    onClick={() => setSelectedFilter('starred')}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedFilter === 'starred'
                                            ? 'bg-accent-purple/10 text-accent-purple'
                                            : 'text-foreground/80 hover:bg-muted/40'
                                        }`}
                                >
                                    <Star className="w-4 h-4" />
                                    <span>Starred</span>
                                </button>
                                <button
                                    onClick={() => setSelectedFilter('archived')}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedFilter === 'archived'
                                            ? 'bg-accent-purple/10 text-accent-purple'
                                            : 'text-foreground/80 hover:bg-muted/40'
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
                        <MessageSquare className="w-12 h-12 text-muted-foreground/70 mb-3" />
                        <p className="text-foreground/80 font-medium text-center">
                            {conversations.length === 0 ? 'No conversations yet' : 'No matches found'}
                        </p>
                        <p className="text-sm text-muted-foreground/70 mt-1 text-center">
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
                                className={`w-full p-4 flex gap-4 hover:bg-muted/40 transition-colors border-b border-border last:border-0 ${isActive ? 'bg-card hover:bg-card border-l-4 border-l-accent-purple' : 'border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
                                        {otherUser.avatar_url ? (
                                            <img src={otherUser.avatar_url} alt={otherUser.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-accent-purple/10 text-accent-purple font-semibold">
                                                {otherUser.full_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    {isOnline && (
                                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-600 border-2 border-white rounded-full"></span>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className={`font-semibold truncate ${isActive ? 'text-accent-purple' : 'text-foreground'}`}>
                                            {otherUser.full_name}
                                        </span>
                                        {conv.last_message_at && (
                                            <span className="text-xs text-muted-foreground/70 flex-shrink-0 ml-2">
                                                {format(new Date(conv.last_message_at), 'h:mm a')}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-muted-foreground truncate pr-2">
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
                                            <span className="min-w-[1.25rem] h-5 px-1.5 bg-primary text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
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
