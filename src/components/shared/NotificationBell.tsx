'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationBellProps {
    userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications(userId);

    // Track if component is mounted (client-side only)
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        // Navigate to action URL if provided
        if (notification.action_url) {
            router.push(notification.action_url);
            setIsOpen(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        await deleteNotification(notificationId);
    };

    const getNotificationIcon = (type: Notification['type']) => {
        const iconMap = {
            message: '💬',
            connection_request: '🤝',
            connection_accepted: '✅',
            test_assigned: '📝',
            test_graded: '📊',
            community_invite: '👥',
            community_accepted: '🎉',
            mention: '@',
            system: '⚙️',
        };
        return iconMap[type] || '🔔';
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
                title="Notifications"
                className="relative flex size-8 cursor-pointer items-center justify-center rounded-md border bg-neutral-100 text-foreground transition-all hover:text-accent-purple focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 group"
                suppressHydrationWarning
            >
                <Bell className="size-4 transition-colors" />

                {/* Unread Badge - Only render on client */}
                {isMounted && unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-purple px-1 text-[10px] font-semibold text-white ring-2 ring-background"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}

                {/* Tooltip */}
                <span className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-neutral-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Notifications
                </span>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-96 bg-card rounded-lg border border-border overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border bg-accent-purple/10">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-accent-purple" />
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.5 bg-primary text-white text-xs font-semibold rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </h3>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllAsRead}
                                            className="text-xs text-accent-purple hover:text-accent-purple font-medium flex items-center gap-1"
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                            Mark all read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-muted rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4 text-foreground/80" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Bell className="w-8 h-8 text-muted-foreground/70" />
                                    </div>
                                    <p className="text-sm text-foreground/80 font-medium">No notifications yet</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">We'll notify you when something happens</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {notifications.map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer group ${!notification.read ? 'bg-card' : ''
                                                }`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className="flex gap-3">
                                                {/* Icon */}
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-lg bg-primary">
                                                    {getNotificationIcon(notification.type)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className={`text-sm font-semibold ${!notification.read ? 'text-foreground' : 'text-foreground/80'
                                                            }`}>
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.read && (
                                                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-foreground/80 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-xs text-muted-foreground/70">
                                                            {formatTime(notification.created_at)}
                                                        </span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {!notification.read && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        markAsRead(notification.id);
                                                                    }}
                                                                    className="p-1 hover:bg-accent-purple/10 rounded text-accent-purple"
                                                                    title="Mark as read"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => handleDelete(e, notification.id)}
                                                                className="p-1 hover:bg-destructive/10 rounded text-destructive"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-border bg-muted/40">
                                <button
                                    onClick={() => {
                                        router.push(`/dashboard/${notifications[0]?.metadata?.role || 'student'}/notifications`);
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-center text-sm text-accent-purple hover:text-accent-purple font-medium"
                                >
                                    View all notifications
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
