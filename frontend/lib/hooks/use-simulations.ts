'use client';

import { useState, useEffect, useCallback } from 'react';
import { SimulationService } from '../api/services/simulation-service';
import { 
  Simulation, 
  SimulationCreate, 
  SimulationUpdate, 
  SimulationListResponse 
} from '../api/types';

interface UseSimulationsOptions {
  initialPage?: number;
  pageSize?: number;
  autoFetch?: boolean;
}

export function useSimulations(options: UseSimulationsOptions = {}) {
  const { initialPage = 1, pageSize = 10, autoFetch = true } = options;
  
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch simulations
  const fetchSimulations = useCallback(async (page = currentPage) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await SimulationService.getSimulations(page, pageSize);
      setSimulations(response.simulations);
      setTotalCount(response.total);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch simulations'));
      console.error('Error fetching simulations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  // Create a new simulation
  const createSimulation = useCallback(async (data: SimulationCreate) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newSimulation = await SimulationService.createSimulation(data);
      setSimulations(prev => [newSimulation, ...prev]);
      setTotalCount(prev => prev + 1);
      return newSimulation;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create simulation'));
      console.error('Error creating simulation:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a single simulation
  const getSimulation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await SimulationService.getSimulation(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get simulation'));
      console.error('Error getting simulation:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update a simulation
  const updateSimulation = useCallback(async (id: string, data: SimulationUpdate) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSimulation = await SimulationService.updateSimulation(id, data);
      setSimulations(prev => 
        prev.map(sim => sim.id === id ? updatedSimulation : sim)
      );
      return updatedSimulation;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update simulation'));
      console.error('Error updating simulation:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete a simulation
  const deleteSimulation = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await SimulationService.deleteSimulation(id);
      setSimulations(prev => prev.filter(sim => sim.id !== id));
      setTotalCount(prev => prev - 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete simulation'));
      console.error('Error deleting simulation:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Change page
  const goToPage = useCallback((page: number) => {
    if (page < 1) page = 1;
    const maxPage = Math.ceil(totalCount / pageSize);
    if (page > maxPage) page = maxPage;
    
    setCurrentPage(page);
    fetchSimulations(page);
  }, [fetchSimulations, totalCount, pageSize]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchSimulations(initialPage);
    }
  }, [autoFetch, fetchSimulations, initialPage]);

  return {
    simulations,
    totalCount,
    currentPage,
    pageSize,
    isLoading,
    error,
    fetchSimulations,
    createSimulation,
    getSimulation,
    updateSimulation,
    deleteSimulation,
    goToPage,
  };
}
