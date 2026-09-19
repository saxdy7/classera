'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Search, Users } from 'lucide-react';
import { ChatInterface } from '@/components/shared/ChatInterface';
import { useSearchParams } from 'next/navigation';

interface Conversation {
  user: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
  lastMessage: {
    content: string;
    created_at: string;
    isFromCurrentUser: boolean;
    read: boolean;
  };
  unreadCount: number;
}

interface MessagesClientProps {
  currentUserId: string;
  currentUserName: string;
}

export function MessagesClient({ currentUserId, currentUserName }: MessagesClientProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();

      if (data.conversations) {
        setConversations(data.conversations);

        // Check if there's a userId in URL params to start conversation
        const userIdParam = searchParams?.get('userId');
        if (userIdParam && !selectedConversation) {
          // Find if conversation already exists
          const existingConv = data.conversations.find(
            (conv: Conversation) => conv.user.id === userIdParam
          );

          if (existingConv) {
            setSelectedConversation(existingConv);
          } else {
            // Start new conversation
            startNewConversation(userIdParam);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = async (userId: string) => {
    try {
      const response = await fetch('/api/start-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: userId }),
      });

      const data = await response.json();

      if (data.user) {
        const newConversation: Conversation = {
          user: data.user,
          lastMessage: {
            content: '',
            created_at: new Date().toISOString(),
            isFromCurrentUser: false,
            read: true,
          },
          unreadCount: 0,
        };
        setSelectedConversation(newConversation);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Poll for new conversations every 5 seconds
    const interval = setInterval(fetchConversations, 5000);

    return () => clearInterval(interval);
  }, [searchParams]);

  const filteredConversations = conversations.filter((conv) =>
    conv.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] h-[calc(100vh-250px)] flex">
      {/* Conversations List */}
      <div
        className={`${selectedConversation ? 'hidden lg:flex' : 'flex'
          } w-full lg:w-80 border-r border-[var(--cl-hairline)] flex-col`}
      >
        <div className="p-4 border-b border-[var(--cl-hairline)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--cl-muted-soft)]" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--cl-hairline)] rounded-lg focus:outline-none focus:border-[var(--cl-primary)] transition-colors text-[var(--cl-ink)] placeholder:text-[var(--cl-muted-soft)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--cl-primary)]"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 bg-[var(--cl-surface-strong)] rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-[var(--cl-muted-soft)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--cl-ink)] mb-2">
                {searchQuery ? 'No results found' : 'No messages yet'}
              </h3>
              <p className="text-sm text-[var(--cl-muted)]">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start a conversation with your mentors'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.user.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full p-4 hover:bg-[var(--cl-canvas-soft)] transition-colors border-b border-[var(--cl-hairline)] text-left ${selectedConversation?.user.id === conversation.user.id ? 'bg-[var(--cl-primary-soft)]' : ''
                  }`}
              >
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-[var(--cl-on-dark)] font-semibold flex-shrink-0 bg-[var(--cl-primary)]">
                    {getInitials(conversation.user.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-[var(--cl-ink)] truncate">
                        {conversation.user.full_name}
                      </h3>
                      <span className="text-xs text-[var(--cl-muted)] flex-shrink-0 ml-2">
                        {formatTime(conversation.lastMessage.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm truncate ${conversation.unreadCount > 0 && !conversation.lastMessage.isFromCurrentUser
                            ? 'text-[var(--cl-ink)] font-medium'
                            : 'text-[var(--cl-muted)]'
                          }`}
                      >
                        {conversation.lastMessage.isFromCurrentUser ? 'You: ' : ''}
                        {conversation.lastMessage.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-[var(--cl-primary)] text-[var(--cl-on-dark)] text-xs font-semibold rounded-full flex-shrink-0">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col`}>
        {selectedConversation ? (
          <ChatInterface
            currentUserId={currentUserId}
            otherUser={selectedConversation.user}
            onBack={() => setSelectedConversation(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-20 h-20 bg-[var(--cl-surface-strong)] rounded-full flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-[var(--cl-muted-soft)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--cl-ink)] mb-2">Select a conversation</h3>
            <p className="text-[var(--cl-muted)]">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
