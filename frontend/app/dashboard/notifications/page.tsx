"use client";

import {
  useNotifications,
  useNotificationMutations,
} from "@/lib/hooks/use-notifications";
import { Notification } from "@/lib/api/types";
import Link from "next/link";

export default function NotificationsPage() {
  const { notifications, unreadCount, loading } = useNotifications();
  const { markAsRead, markAllAsRead } = useNotificationMutations();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllAsRead.mutate();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "simulation_completed":
        return "✅";
      case "simulation_failed":
        return "❌";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    const baseClasses = read ? "bg-white" : "bg-blue-50";
    switch (type) {
      case "simulation_completed":
        return `${baseClasses} border-l-4 border-green-400`;
      case "simulation_failed":
        return `${baseClasses} border-l-4 border-red-400`;
      default:
        return `${baseClasses} border-l-4 border-blue-400`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500">
          Loading notifications...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-medium text-gray-900">Notifications</h1>
            <p className="mt-1 text-sm text-gray-500">
              {notifications.length === 0
                ? "No notifications yet"
                : `${notifications.length} total notifications`}
              {unreadCount > 0 && (
                <span className="ml-2 text-blue-600">
                  ({unreadCount} unread)
                </span>
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markAllAsRead.isPending}
              className="px-4 py-2 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 disabled:opacity-50"
            >
              {markAllAsRead.isPending ? "Marking..." : "Mark all as read"}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-500 mb-4">
              You&apos;ll receive notifications when your simulations complete
              or encounter issues.
            </p>
            <Link
              href="/dashboard/simulations/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Run your first simulation
            </Link>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${getNotificationColor(
                notification.type,
                notification.read
              )}`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <span className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-sm font-medium ${
                        notification.read
                          ? "text-gray-900"
                          : "text-gray-900 font-semibold"
                      }`}
                    >
                      {notification.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatTime(notification.created_at)}
                      </span>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {notification.message}
                  </p>
                  {(() => {
                    const simulationId = notification.data?.simulation_id;
                    return simulationId && typeof simulationId === "string" ? (
                      <div className="mt-3">
                        <Link
                          href={`/dashboard/simulations/${simulationId}`}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View simulation details →
                        </Link>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Notifications are automatically deleted after 30 days
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
