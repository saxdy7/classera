"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function NotificationCenter() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/community-notifications");
      const data = await response.json();
      setNotifications(data.notifications || []);
      const unread = (data.notifications || []).filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await fetch("/api/community-notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId, read: true }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    []
  );

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await Promise.all(
        notifications
          .filter((n) => !n.read)
          .map((n) =>
            fetch("/api/community-notifications", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notificationId: n.id, read: true }),
            })
          )
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "mention":
        return "🏷️";
      case "reply":
        return "💬";
      case "like":
        return "❤️";
      case "announcement":
        return "📢";
      default:
        return "🔔";
    }
  };

  const getNotificationLink = (notification: any) => {
    if (notification.post_id) {
      return `/dashboard/student/communities/${notification.community?.id}?postId=${notification.post_id}`;
    }
    return `/dashboard/student/communities/${notification.community?.id}`;
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-[var(--cl-surface-strong)] rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-[var(--cl-body)]" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-[var(--cl-error)] text-[var(--cl-on-dark)] text-xs rounded-full flex items-center justify-center font-semibold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-[var(--cl-surface-card)] rounded-[var(--cl-r-lg)] border border-[var(--cl-hairline)] z-50 max-h-96 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[var(--cl-hairline)] flex items-center justify-between sticky top-0 bg-[var(--cl-surface-card)]">
              <div>
                <h3 className="font-semibold text-[var(--cl-ink)]">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-[var(--cl-body)]">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="p-1 hover:bg-[var(--cl-surface-strong)] rounded transition-colors disabled:opacity-50"
                    title="Mark all as read"
                  >
                    <Check className="w-5 h-5 text-[var(--cl-body)]" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-[var(--cl-surface-strong)] rounded transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--cl-body)]" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length > 0 ? (
                <div className="divide-y divide-[var(--cl-hairline)]">
                  {notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={getNotificationLink(notification)}
                      onClick={() => {
                        markAsRead(notification.id);
                        setIsOpen(false);
                      }}
                      className={`p-4 hover:bg-slate-50 transition-colors block ${
                        !notification.read ? "bg-[var(--cl-primary-soft)]" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--cl-ink)] truncate">
                            {notification.sender?.full_name || "Someone"}
                          </p>
                          <p className="text-xs text-[var(--cl-body)] line-clamp-2">
                            {notification.type === "mention" && "mentioned you"}
                            {notification.type === "reply" && "replied to your comment"}
                            {notification.type === "like" && "liked your post"}
                            {notification.type === "announcement" && "posted an announcement"}
                            {notification.content && `: ${notification.content}`}
                          </p>
                          <p className="text-xs text-[var(--cl-muted)] mt-1">
                            {new Date(notification.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-[var(--cl-primary)] rounded-full mt-2"></div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-[var(--cl-body)]">
                  <Bell className="w-8 h-8 text-[var(--cl-muted-soft)] mx-auto mb-2" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
