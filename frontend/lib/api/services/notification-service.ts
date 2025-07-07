import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { Notification, NotificationListResponse } from "../types";

export const NotificationService = {
  /**
   * Fetch notifications for the current user
   * @param unreadOnly - If true, only fetch unread notifications
   */
  getNotifications: async (unreadOnly: boolean = false): Promise<NotificationListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS, {
      params: { unread_only: unreadOnly }
    });
    return response.data;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.MARK_NOTIFICATION_READ(id));
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch(API_ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ);
  },

  /**
   * Get a single notification by ID
   */
  getNotification: async (id: string): Promise<Notification> => {
    const response = await apiClient.get(API_ENDPOINTS.NOTIFICATION(id));
    return response.data;
  },
};
