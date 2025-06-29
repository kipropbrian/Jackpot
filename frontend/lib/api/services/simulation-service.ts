import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import {
  Simulation,
  SimulationWithSpecification,
  SimulationCreate,
  SimulationUpdate,
  SimulationListResponse,
} from "../types";

export const SimulationService = {
  /**
   * Create a new simulation
   */
  createSimulation: async (data: SimulationCreate): Promise<Simulation> => {
    const response = await apiClient.post(API_ENDPOINTS.SIMULATIONS, data);
    return response.data;
  },

  /**
   * Get a list of simulations with pagination
   */
  getSimulations: async (
    page: number = 1,
    limit: number = 10
  ): Promise<SimulationListResponse> => {
    const skip = (page - 1) * limit;
    const response = await apiClient.get(API_ENDPOINTS.SIMULATIONS, {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Get a specific simulation by ID with specification data
   */
  getSimulation: async (id: string): Promise<SimulationWithSpecification> => {
    const response = await apiClient.get(API_ENDPOINTS.SIMULATION(id));
    return response.data;
  },

  /**
   * Update a simulation
   */
  updateSimulation: async (
    id: string,
    data: SimulationUpdate
  ): Promise<Simulation> => {
    const response = await apiClient.patch(API_ENDPOINTS.SIMULATION(id), data);
    return response.data;
  },

  /**
   * Delete a simulation
   */
  deleteSimulation: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.SIMULATION(id));
  },
};
