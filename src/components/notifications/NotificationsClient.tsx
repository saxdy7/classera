'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { Bell, CheckCircle, AlertCircle, Info, MessageSquare, UserPlus, FileText, Award, Users, Megaphone } from 'lucide-react';

interface NotificationsClientProps {
    userId: string;
}

export function NotificationsClient({ userId }: NotificationsClientProps) {
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications(userId);

    const getIcon = (type: string) => {
        switch (type) {
            case 'message':
                return <MessageSquare className="w-5 h-5 text-blue-600" />;
            case 'connection_request':
                return <UserPlus className="w-5 h-5 text-purple-600" />;
            case 'connection_accepted':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'test_assigned':
                return <FileText className="w-5 h-5 text-orange-600" />;
            case 'test_graded':
                return <Award className="w-5 h-5 text-green-600" />;
            case 'community_invite':
                return <Users className="w-5 h-5 text-indigo-600" />;
            case 'community_accepted':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'mention':
                return <Megaphone className="w-5 h-5 text-pink-600" />;
            case 'system':
                return <Info className="w-5 h-5 text-slate-600" />;
            default:
                return <Info className="w-5 h-5 text-blue-600" />;
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case 'message':
                return 'bg-blue-100';
            case 'connection_request':
            case 'connection_accepted':
                return 'bg-purple-100';
            case 'test_assigned':
                return 'bg-orange-100';
            case 'test_graded':
                return 'bg-green-100';
            case 'community_invite':
            case 'community_accepted':
                return 'bg-indigo-100';
            case 'mention':
                return 'bg-pink-100';
            case 'system':
                return 'bg-slate-100';
            default:
                return 'bg-blue-100';
        }
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (seconds < 60) return 'just now';

            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `${minutes}m ago`;

            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h ago`;

            const days = Math.floor(hours / 24);
            if (days < 7) return `${days}d ago`;

            const weeks = Math.floor(days / 7);
            if (weeks < 4) return `${weeks}w ago`;

            const months = Math.floor(days / 30);
            if (months < 12) return `${months}mo ago`;

            const years = Math.floor(days / 365);
            return `${years}y ago`;
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-3xl font-bold text-black flex items-center gap-3">
                        <Bell className="w-8 h-8 text-purple-600" />
                        Notifications
                        {unreadCount > 0 && (
                            <span className="bg-purple-600 text-white text-sm font-semibold px-3 py-1 rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h2>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
                <p className="text-slate-600">Stay updated with your latest activities</p>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                        className={`bg-white rounded-xl border border-slate-200 p-5 transition-all hover:shadow-md cursor-pointer ${!notification.read ? 'border-l-4 border-l-purple-500' : ''
                            }`}
                    >
                        <div className="flex gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getIconBg(notification.type)}`}>
                                {getIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-semibold text-black">{notification.title}</h3>
                                    <div className="flex items-center gap-2">
                                        {!notification.read && (
                                            <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                            className="text-slate-400 hover:text-red-600 transition-colors"
                                            title="Delete notification"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm mb-2">{notification.message}</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-slate-400">{formatTime(notification.created_at)}</p>
                                    {notification.action_url && (
                                        <a
                                            href={notification.action_url}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                                        >
                                            View →
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State (if no notifications) */}
            {notifications.length === 0 && (
                <div className="text-center py-16">
                    <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">No notifications yet</h3>
                    <p className="text-slate-500">You're all caught up! Check back later for updates.</p>
                </div>
            )}
        </div>
    );
}
