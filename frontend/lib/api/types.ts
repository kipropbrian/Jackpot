// API response and request types

// Simulation types
export interface Simulation {
  jackpot_id: string;
  id: string;
  user_id: string;
  name: string;
  total_combinations: number;
  cost_per_bet: number;
  total_cost: number;
  status: "pending" | "running" | "completed" | "failed";
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
  status?: "pending" | "running" | "completed" | "failed";
  progress?: number;
  completed_at?: string;
  results?: Record<string, any>;
}

export interface SimulationListResponse {
  simulations: Simulation[];
  total: number;
}

export interface Game {
  id: string;
  game_api_id: string;
  home_team: string;
  away_team: string;
  kick_off_time: string;
  tournament?: string;
  country?: string;
  odds_home?: number;
  odds_draw?: number;
  odds_away?: number;
  score_home?: number;
  score_away?: number;
  game_order?: number;
  betting_status?: string;
}

export interface JackpotMetadata {
  currency?: string;
  prizes?: Record<string, number>;
  bet_amounts?: Record<string, number>;
  betting_status?: string;
}

export interface Jackpot {
  id: string;
  jackpot_api_id: string;
  name: string;
  current_amount: number;
  total_matches: number;
  scraped_at: string;
  status: "open" | "completed";
  completed_at?: string;
  metadata?: JackpotMetadata;
  games: Game[];
}

export type JackpotListResponse = Jackpot[];
