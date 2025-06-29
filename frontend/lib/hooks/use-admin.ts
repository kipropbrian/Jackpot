import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useAuth } from "./use-auth";
import {
  adminService,
  UserUpdateRequest,
  UserFilters,
  SimulationFilters,
} from "../api/services/admin-service";

// Query keys
export const adminKeys = {
  all: ["admin"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  user: (id: string) => [...adminKeys.users(), id] as const,
  usersList: (page: number, pageSize: number, filters: UserFilters) =>
    [...adminKeys.users(), "list", page, pageSize, filters] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  simulations: () => [...adminKeys.all, "simulations"] as const,
  simulationsList: (
    page: number,
    pageSize: number,
    filters: SimulationFilters
  ) => [...adminKeys.simulations(), "list", page, pageSize, filters] as const,
  simulation: (id: string) => [...adminKeys.simulations(), id] as const,
};

// Hooks for user management
export function useUsers(
  page: number = 1,
  pageSize: number = 10,
  filters: UserFilters = {}
) {
  return useQuery({
    queryKey: adminKeys.usersList(page, pageSize, filters),
    queryFn: () => adminService.getUsers(page, pageSize, filters),
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: adminKeys.user(userId),
    queryFn: () => adminService.getUser(userId),
    enabled: !!userId,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      userData,
    }: {
      userId: string;
      userData: UserUpdateRequest;
    }) => adminService.updateUser(userId, userData),
    onSuccess: (data, { userId }) => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: adminKeys.user(userId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });

      toast.success("User updated successfully");
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      toast.error(error.response?.data?.detail || "Failed to update user");
    },
  });
}

// Hooks for system statistics
export function useSystemStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => adminService.getSystemStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Hooks for simulation management
export function useAllSimulations(
  page: number = 1,
  pageSize: number = 10,
  filters: SimulationFilters = {}
) {
  return useQuery({
    queryKey: adminKeys.simulationsList(page, pageSize, filters),
    queryFn: () => adminService.getAllSimulations(page, pageSize, filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useSimulationDetails(simulationId: string) {
  return useQuery({
    queryKey: adminKeys.simulation(simulationId),
    queryFn: () => adminService.getSimulationDetails(simulationId),
    enabled: !!simulationId,
  });
}

// Helper hook to check if current user is admin
export function useIsAdmin() {
  const { profile, loading } = useAuth();

  const isAdmin = profile?.role === "superadmin";

  return { isAdmin, isLoading: loading };
}
