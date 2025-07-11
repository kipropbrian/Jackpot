const API_BASE = "/api/v1";

// API endpoint definitions
export const API_ENDPOINTS = {
  // Health check
  HEALTH: "/health",

  // Auth endpoints (handled by Supabase)

  // Simulation endpoints
  SIMULATIONS: `${API_BASE}/simulations/`,
  SIMULATION: (id: string) => `${API_BASE}/simulations/${id}`,
  VALIDATE_SELECTIONS: `${API_BASE}/simulations/validate-selections`,

  // Jackpot endpoints
  JACKPOTS: `${API_BASE}/jackpots/`,
  JACKPOT: (id: string) => `${API_BASE}/jackpots/${id}`,
  LATEST_JACKPOT: `${API_BASE}/jackpots/latest`,

  // Notification endpoints
  NOTIFICATIONS: `${API_BASE}/notifications/`,
  NOTIFICATION: (id: string) => `${API_BASE}/notifications/${id}`,
  MARK_NOTIFICATION_READ: (id: string) =>
    `${API_BASE}/notifications/${id}/read`,
  MARK_ALL_NOTIFICATIONS_READ: `${API_BASE}/notifications/mark-all-read`,

  // Admin endpoints
  ADMIN_USERS: `${API_BASE}/admin/users/`,
  ADMIN_USER: (id: string) => `${API_BASE}/admin/users/${id}`,
  ADMIN_STATS: `${API_BASE}/admin/stats/`,
  ADMIN_SIMULATIONS: `${API_BASE}/admin/simulations/`,
  ADMIN_SIMULATION: (id: string) => `${API_BASE}/admin/simulations/${id}`,
};
