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
}

export function useSimulations(options: UseSimulationsOptions = {}) {
  const { page = 1, pageSize = 10 } = options;
  const queryClient = useQueryClient();

  // Fetch simulations with React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["simulations", page, pageSize],
    queryFn: () => SimulationService.getSimulations(page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      if (sim?.status === "running" || sim?.enhanced_status === "analyzing") {
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
