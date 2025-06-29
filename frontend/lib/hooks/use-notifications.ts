import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationService } from "../api/services/notification-service";
import { toast } from "react-hot-toast";

export function useNotifications() {
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: NotificationService.getNotifications,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Poll every minute for new notifications
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unread_count || 0,
    total: data?.total || 0,
    loading,
    error: error?.message || null,
    refetch,
  };
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: NotificationService.markAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      toast.error(
        error.response?.data?.detail || "Failed to mark notification as read"
      );
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: NotificationService.markAllAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      toast.error(
        error.response?.data?.detail ||
          "Failed to mark all notifications as read"
      );
    },
  });

  return {
    markAsRead,
    markAllAsRead,
  };
}
