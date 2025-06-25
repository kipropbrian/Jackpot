import apiClient from "../client";
import { API_ENDPOINTS } from "../endpoints";
import type { Jackpot, JackpotListResponse } from "../types";

export const JackpotService = {
  /**
   * Fetch all jackpots (with games)
   */
  getJackpots: async (): Promise<JackpotListResponse> => {
    const response = await apiClient.get(API_ENDPOINTS.JACKPOTS);
    return response.data;
  },

  /**
   * Fetch a single jackpot by ID (optional, if you add such an endpoint)
   */
  getJackpot: async (id: string): Promise<Jackpot> => {
    const response = await apiClient.get(API_ENDPOINTS.JACKPOT(id));
    return response.data;
  },
};
