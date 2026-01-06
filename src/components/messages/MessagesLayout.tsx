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
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg h-[calc(100vh-200px)] min-h-[650px]">
            <div className="flex h-full">
                {/* Sidebar - Hidden on mobile if chat is open */}
                <div
                    className={`${activeConversation ? 'hidden lg:flex' : 'flex'
                        } w-full lg:w-96 xl:w-[420px] border-r border-slate-200 flex-col bg-white`}
                >
                    <ConversationList currentUserId={currentUserId} currentUserRole={currentUserRole} />
                </div>

                {/* Chat Window - Hidden on mobile if no chat selected */}
                <div
                    className={`${activeConversation ? 'flex' : 'hidden lg:flex'
                        } flex-1 flex-col bg-slate-50/50 relative min-w-0`}
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
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/20">
            <div className="relative mb-6">
                <div className="w-28 h-28 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center ring-8 ring-slate-50 shadow-lg">
                    <MessageSquare className="w-12 h-12 text-indigo-400" />
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-100 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-indigo-100 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Welcome to Messages
            </h3>
            <p className="text-slate-500 max-w-sm leading-relaxed mb-6">
                Click the <strong className="text-indigo-600">+</strong> button in the sidebar to start a new conversation, or select an existing chat to continue messaging.
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400 items-center justify-center">
                <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg">
                    🔒 Secure & Private
                </span>
                <span className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg">
                    ⚡ Real-time Messaging
                </span>
            </div>
        </div>
    );
}
