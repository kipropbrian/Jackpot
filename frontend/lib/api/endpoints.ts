// API endpoint definitions
export const API_ENDPOINTS = {
  // Health check
  HEALTH: "/health",

  // Simulations
  SIMULATIONS: "/api/v1/simulations/",
  SIMULATION: (id: string) => `/api/v1/simulations/${id}`,

  // Jackpots
  JACKPOTS: "/api/v1/jackpots/",
  JACKPOT: (id: string) => `/api/v1/jackpots/${id}`,

  // Admin endpoints
  ADMIN_USERS: "/api/v1/admin/users",
  ADMIN_USER: (id: string) => `/api/v1/admin/users/${id}`,
  ADMIN_STATS: "/api/v1/admin/stats",
  ADMIN_SIMULATIONS: "/api/v1/admin/simulations",
  ADMIN_SIMULATION: (id: string) => `/api/v1/admin/simulations/${id}`,
};
