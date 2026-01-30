'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Notification {
    id: string;
    user_id: string;
    type: 'message' | 'connection_request' | 'connection_accepted' | 'test_assigned' | 'test_graded' | 'community_invite' | 'community_accepted' | 'mention' | 'system';
    title: string;
    message: string;
    related_id?: string;
    related_type?: string;
    action_url?: string;
    metadata?: Record<string, any>;
    read: boolean;
    read_at?: string;
    created_at: string;
    updated_at: string;
}

export function useNotifications(userId: string) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications');
            const data = await response.json();

            if (data.notifications) {
                setNotifications(data.notifications);
                const unread = data.notifications.filter((n: Notification) => !n.read).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId }),
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAllAsRead: true }),
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev =>
                    prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, []);

    const deleteNotification = useCallback(async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications?id=${notificationId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Update local state
                setNotifications(prev => {
                    const notification = prev.find(n => n.id === notificationId);
                    if (notification && !notification.read) {
                        setUnreadCount(count => Math.max(0, count - 1));
                    }
                    return prev.filter(n => n.id !== notificationId);
                });
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        const topic = `notifications:${userId}`;
        console.log('🔔 Subscribing to notifications topic:', topic);

        // Subscribe to broadcast events for notifications
        const channel: RealtimeChannel = supabase
            .channel(topic, {
                config: {
                    broadcast: { self: true },
                },
            })
            .on(
                'broadcast',
                {
                    event: 'INSERT',
                },
                (payload) => {
                    console.log('🔔 New notification received:', payload);
                    fetchNotifications(); // Refetch to get complete data

                    // Play notification sound (optional)
                    playNotificationSound();
                }
            )
            .on(
                'broadcast',
                {
                    event: 'UPDATE',
                },
                (payload) => {
                    console.log('🔔 Notification updated:', payload);
                    fetchNotifications();
                }
            )
            .on(
                'broadcast',
                {
                    event: 'DELETE',
                },
                (payload) => {
                    console.log('🔔 Notification deleted:', payload);
                    fetchNotifications();
                }
            )
            .subscribe((status) => {
                console.log('Notification subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchNotifications, supabase]);

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetch: fetchNotifications,
    };
}

// Helper function to play notification sound
function playNotificationSound() {
    try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch((error) => {
            console.log('Could not play notification sound:', error);
        });
    } catch (error) {
        console.log('Notification sound not available:', error);
    }
}
