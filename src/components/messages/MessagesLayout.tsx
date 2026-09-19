'use client';

import { useMessages } from './MessagesProvider';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import { MessageSquare } from 'lucide-react';

interface MessagesLayoutProps {
    currentUserId: string;
    currentUserRole: 'student' | 'mentor';
}

export function MessagesLayout({ currentUserId, currentUserRole }: MessagesLayoutProps) {
    const { activeConversation } = useMessages();

    return (
        <div className="bg-[var(--cl-surface-card)] rounded-[var(--cl-r-xl)] border border-[var(--cl-hairline)] overflow-hidden h-[calc(100vh-200px)] min-h-[650px]">
            <div className="flex h-full">
                {/* Sidebar - Hidden on mobile if chat is open */}
                <div
                    className={`${activeConversation ? 'hidden lg:flex' : 'flex'
                        } w-full lg:w-96 xl:w-[420px] border-r border-[var(--cl-hairline)] flex-col bg-[var(--cl-surface-card)]`}
                >
                    <ConversationList currentUserId={currentUserId} currentUserRole={currentUserRole} />
                </div>

                {/* Chat Window - Hidden on mobile if no chat selected */}
                <div
                    className={`${activeConversation ? 'flex' : 'hidden lg:flex'
                        } flex-1 flex-col bg-[rgba(250,250,247,0.5)] relative min-w-0`}
                >
                    {activeConversation ? (
                        <ChatWindow currentUserId={currentUserId} />
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[var(--cl-canvas)]">
            <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full flex items-center justify-center ring-8 ring-[var(--cl-hairline)] bg-[var(--cl-primary-soft)]">
                    <MessageSquare className="w-12 h-12 text-[var(--cl-primary)]" />
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-[var(--cl-primary-soft)] rounded-full animate-pulse"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-[var(--cl-primary-soft)] rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
            <h3 className="text-2xl font-semibold text-[var(--cl-ink)] mb-3">
                Welcome to Messages
            </h3>
            <p className="text-[var(--cl-muted)] max-w-sm leading-relaxed mb-6">
                Click the <strong className="text-[var(--cl-primary)]">+</strong> button in the sidebar to start a new conversation, or select an existing chat to continue messaging.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-[var(--cl-muted-soft)] items-center justify-center">
                <span className="flex items-center gap-2 bg-[var(--cl-surface-card)] px-3 py-1.5 rounded-lg">
                    🔒 Secure & Private
                </span>
                <span className="flex items-center gap-2 bg-[var(--cl-surface-card)] px-3 py-1.5 rounded-lg">
                    ⚡ Real-time Messaging
                </span>
            </div>
        </div>
    );
}
