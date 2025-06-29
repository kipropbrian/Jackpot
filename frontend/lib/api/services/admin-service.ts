import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";

// Types for admin functionality
export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface UserUpdateRequest {
  full_name?: string;
  role?: string;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UserStats {
  total_users: number;
  regular_users: number;
  superadmins: number;
  active_users: number;
  inactive_users: number;
  active_last_30_days: number;
  new_users_30_days: number;
}

export interface SimulationStats {
  total_simulations: number;
  completed_simulations: number;
  pending_simulations: number;
  running_simulations: number;
  simulations_last_30_days: number;
  total_simulation_cost: number;
  avg_simulation_cost: number;
}

export interface SystemStats {
  user_stats: UserStats;
  simulation_stats: SimulationStats;
}

export interface AdminSimulation {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  name: string;
  jackpot_id: string;
  combination_type: "single" | "double" | "triple" | "mixed";
  double_count: number;
  triple_count: number;
  effective_combinations: number;
  total_cost: number;
  status: "pending" | "running" | "completed" | "failed";
  created_at: string;
  completed_at?: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  is_active?: boolean;
}

export interface SimulationFilters {
  status?: string;
  user_email?: string;
}

export interface AdminPaginatedResponse<T> {
  data: T[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const adminService = {
  // User management
  async getUsers(
    page: number = 1,
    pageSize: number = 10,
    filters: UserFilters = {}
  ): Promise<AdminPaginatedResponse<UserProfile>> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (filters.search) params.append("search", filters.search);
    if (filters.role) params.append("role", filters.role);
    if (filters.is_active !== undefined)
      params.append("is_active", filters.is_active.toString());

    const response = await apiClient.get(
      `${API_ENDPOINTS.ADMIN_USERS}?${params}`
    );
    return {
      data: response.data.users || [],
      total_count: response.data.total_count || 0,
      page: response.data.page || page,
      page_size: response.data.page_size || pageSize,
      total_pages: response.data.total_pages || 1,
    };
  },

  async getUser(userId: string): Promise<UserProfile> {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN_USER(userId));
    return response.data;
  },

  async updateUser(
    userId: string,
    userData: UserUpdateRequest
  ): Promise<UserProfile> {
    const response = await apiClient.put(
      API_ENDPOINTS.ADMIN_USER(userId),
      userData
    );
    return response.data;
  },

  // System statistics
  async getSystemStats(): Promise<SystemStats> {
    const response = await apiClient.get(API_ENDPOINTS.ADMIN_STATS);
    return response.data;
  },

  // Simulation management
  async getAllSimulations(
    page: number = 1,
    pageSize: number = 10,
    filters: SimulationFilters = {}
  ): Promise<AdminPaginatedResponse<AdminSimulation>> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (filters.status) params.append("status", filters.status);
    if (filters.user_email) params.append("user_email", filters.user_email);

    const response = await apiClient.get(
      `${API_ENDPOINTS.ADMIN_SIMULATIONS}?${params}`
    );
    return {
      data: response.data.simulations || [],
      total_count: response.data.total_count || 0,
      page: response.data.page || page,
      page_size: response.data.page_size || pageSize,
      total_pages: response.data.total_pages || 1,
    };
  },

  async getSimulationDetails(simulationId: string) {
    const response = await apiClient.get(
      API_ENDPOINTS.ADMIN_SIMULATION(simulationId)
    );
    return response.data;
  },
};
