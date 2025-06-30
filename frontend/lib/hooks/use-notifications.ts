import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationService } from "../api/services/notification-service";
import { toast } from "react-hot-toast";
import { useEffect, useRef } from "react";
import { Notification } from "../api/types";

export function useNotifications() {
  const queryClient = useQueryClient();
  const prevNotificationsRef = useRef<Notification[]>([]);

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: NotificationService.getNotifications,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: (query) => {
      // Check if we should poll more frequently for active simulations
      // We'll check the simulations cache to see if there are active ones
      const simulationsData = queryClient.getQueryData([
        "simulations",
        1,
        10,
      ]) as { simulations?: any[] } | undefined;

      // If we have simulations data, check for active ones
      if (simulationsData?.simulations) {
        const hasActiveSimulations = simulationsData.simulations.some(
          (sim: any) =>
            sim.status === "running" ||
            sim.enhanced_status === "analyzing" ||
            sim.enhanced_status === "waiting_for_games"
        );

        // Poll more frequently when there are active simulations
        if (hasActiveSimulations) {
          return 30 * 1000; // 30 seconds
        }
      }

      // Otherwise, poll every minute (default)
      return 60 * 1000; // 1 minute
    },
  });

  const notifications = data?.notifications || [];

  // Check for new simulation-related notifications and invalidate simulations list
  useEffect(() => {
    if (notifications.length > 0 && prevNotificationsRef.current.length > 0) {
      const newNotifications = notifications.filter(
        (notification) =>
          !prevNotificationsRef.current.some(
            (prev) => prev.id === notification.id
          )
      );

      // Check if any new notifications are simulation-related
      const hasSimulationNotifications = newNotifications.some(
        (notification) =>
          notification.type === "simulation_completed" ||
          notification.type === "simulation_failed"
      );

      if (hasSimulationNotifications) {
        // Invalidate simulations list to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ["simulations"] });
        queryClient.invalidateQueries({ queryKey: ["simulation"] });
      }
    }

    // Update the previous notifications reference
    prevNotificationsRef.current = notifications;
  }, [notifications, queryClient]);

  return {
    notifications,
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
