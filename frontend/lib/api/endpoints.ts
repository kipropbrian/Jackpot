// API endpoint definitions
export const API_ENDPOINTS = {
  // Health check
  HEALTH: '/health',
  
  // Simulations
  SIMULATIONS: '/api/v1/simulations',
  SIMULATION: (id: string) => `/api/v1/simulations/${id}`,

  // Jackpots
  JACKPOTS: '/api/v1/jackpots',
};
