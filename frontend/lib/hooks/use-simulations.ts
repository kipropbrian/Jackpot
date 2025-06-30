"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SimulationService } from "../api/services/simulation-service";
import {
  SimulationWithSpecification,
  SimulationCreate,
  SimulationUpdate,
} from "../api/types";

interface UseSimulationsOptions {
  page?: number;
  pageSize?: number;
  enablePolling?: boolean;
}

export function useSimulations(options: UseSimulationsOptions = {}) {
  const { page = 1, pageSize = 10, enablePolling = true } = options;
  const queryClient = useQueryClient();

  // Fetch simulations with React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["simulations", page, pageSize],
    queryFn: () => SimulationService.getSimulations(page, pageSize),
    staleTime: 2 * 60 * 1000, // 2 minutes (reduced from 5 minutes for better responsiveness)
    refetchInterval: (query) => {
      // Only poll if enablePolling is true
      if (!enablePolling) {
        return false;
      }

      // Auto-refetch if there are simulations that might be changing status
      const simulations = query.state.data?.simulations || [];

      // Check if any simulation is in a transitional state
      const hasActiveSimulations = simulations.some(
        (sim: SimulationWithSpecification) =>
          sim.status === "running" ||
          sim.enhanced_status === "analyzing" ||
          sim.enhanced_status === "waiting_for_games" ||
          (sim.status === "completed" && !sim.results)
      );

      // If there are active simulations, poll every 15 seconds
      // This is slightly less frequent than individual simulation polling to reduce load
      if (hasActiveSimulations) {
        return 15000; // 15 seconds
      }

      // Otherwise, don't auto-refetch
      return false;
    },
  });

  // Create simulation mutation
  const createMutation = useMutation({
    mutationFn: (data: SimulationCreate) =>
      SimulationService.createSimulation(data),
    onSuccess: () => {
      // Invalidate and refetch simulations
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
    },
  });

  // Update simulation mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SimulationUpdate }) =>
      SimulationService.updateSimulation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      queryClient.invalidateQueries({ queryKey: ["simulation"] }); // Also invalidate individual simulation queries
    },
  });

  // Delete simulation mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => SimulationService.deleteSimulation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      queryClient.invalidateQueries({ queryKey: ["simulation"] });
    },
  });

  return {
    simulations: data?.simulations || [],
    totalCount: data?.total || 0,
    currentPage: page,
    pageSize,
    isLoading,
    error: error?.message || null,
    refetch,

    // Mutations
    createSimulation: createMutation.mutateAsync,
    updateSimulation: (id: string, data: SimulationUpdate) =>
      updateMutation.mutateAsync({ id, data }),
    deleteSimulation: deleteMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    createError: createMutation.error?.message || null,
    updateError: updateMutation.error?.message || null,
    deleteError: deleteMutation.error?.message || null,
  };
}

// Mutations-only hook for when you don't need the simulations list
export function useSimulationMutations() {
  const queryClient = useQueryClient();

  // Create simulation mutation
  const createMutation = useMutation({
    mutationFn: (data: SimulationCreate) =>
      SimulationService.createSimulation(data),
    onSuccess: () => {
      // Invalidate and refetch simulations
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
    },
  });

  // Update simulation mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SimulationUpdate }) =>
      SimulationService.updateSimulation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      queryClient.invalidateQueries({ queryKey: ["simulation"] }); // Also invalidate individual simulation queries
    },
  });

  // Delete simulation mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => SimulationService.deleteSimulation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulations"] });
      queryClient.invalidateQueries({ queryKey: ["simulation"] });
    },
  });

  return {
    // Mutations
    createSimulation: createMutation.mutateAsync,
    updateSimulation: (id: string, data: SimulationUpdate) =>
      updateMutation.mutateAsync({ id, data }),
    deleteSimulation: deleteMutation.mutateAsync,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    createError: createMutation.error?.message || null,
    updateError: updateMutation.error?.message || null,
    deleteError: deleteMutation.error?.message || null,
  };
}

// Separate hook for individual simulation
export function useSimulation(id: string | undefined) {
  const {
    data: simulation,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["simulation", id],
    queryFn: () => SimulationService.getSimulation(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    refetchInterval: (query) => {
      // Auto-refetch every 10 seconds if simulation is running or analyzing
      const sim = query.state.data as SimulationWithSpecification | undefined;

      // Continue refetching if:
      // 1. Simulation is running or analyzing
      // 2. Simulation is completed but we don't have results yet (this fixes the main issue)
      // 3. Simulation status indicates results should be available but aren't cached
      if (
        sim?.status === "running" ||
        sim?.enhanced_status === "analyzing" ||
        (sim?.status === "completed" && !sim?.results) ||
        (sim?.enhanced_status === "results_available" && !sim?.results)
      ) {
        // For completed simulations without results, limit polling to prevent excessive requests
        if (sim?.status === "completed" && !sim?.results) {
          const completedAt = sim.completed_at
            ? new Date(sim.completed_at)
            : null;
          const now = new Date();
          // Stop polling after 10 minutes for completed simulations
          if (
            completedAt &&
            now.getTime() - completedAt.getTime() > 10 * 60 * 1000
          ) {
            return false;
          }
        }
        return 10000; // 10 seconds
      }
      return false; // Don't auto-refetch otherwise
    },
  });

  return {
    simulation: simulation || null,
    loading,
    error: error?.message || null,
    refetch,
  };
}
