// API response and request types

// Simulation types
export interface Simulation {
  id: string;
  user_id: string;
  name: string;
  total_combinations: number;
  cost_per_bet: number;
  total_cost: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  completed_at?: string;
  results?: Record<string, any>;
}

export interface SimulationCreate {
  name: string;
  total_combinations: number;
  cost_per_bet: number;
}

export interface SimulationUpdate {
  name?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  completed_at?: string;
  results?: Record<string, any>;
}

export interface SimulationListResponse {
  simulations: Simulation[];
  total: number;
}
