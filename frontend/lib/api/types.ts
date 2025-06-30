// API response and request types

// Simulation types
export interface Simulation {
  id: string;
  user_id: string;
  name: string;
  jackpot_id: string;

  // Specification-based fields
  combination_type: "single" | "double" | "triple" | "mixed";
  double_count: number;
  triple_count: number;
  effective_combinations: number;

  total_cost: number;
  status: "pending" | "running" | "completed" | "failed";
  enhanced_status?: "waiting_for_games" | "analyzing" | "results_available";
  jackpot_status?: "open" | "completed";
  jackpot_name?: string;
  jackpot_metadata?: JackpotMetadata;
  has_results?: boolean;
  basic_results?: {
    total_payout: number;
    net_loss: number;
    best_match_count: number;
  };
  created_at: string;
  completed_at?: string;
  results?: SimulationResults;
}

export interface SimulationWithSpecification extends Simulation {
  specification?: BetSpecification;
}

export interface SimulationResults {
  simulation_id: string;
  prize_level_wins: Record<string, number>; // {"13": 5, "14": 2, "15": 1, "16": 0, "17": 0}
  prize_level_payouts: Record<string, number>; // {"13": 67773749.2, "14": 135033746.44, ...}
  total_payout: number;
  total_winners: number;
  net_loss: number;
  net_profit: number;
  best_match_count: number;
  analysis: {
    total_combinations: number;
    total_winners: number;
    winning_percentage: number;
    actual_results: string[];
    combination_type: string;
    double_games: number[];
    triple_games: number[];
    prize_breakdown: PrizeBreakdown[];
  };
}

export interface SimulationCreate {
  name: string;
  jackpot_id: string;

  // Method 1: Budget-based creation
  budget_ksh?: number;

  // Method 2: Explicit game selections
  game_selections?: Record<string, string[]>;
}

export interface SimulationUpdate {
  name?: string;
  jackpot_id?: string;
  budget_ksh?: number;
  game_selections?: Record<string, string[]>;
}

export interface SimulationListResponse {
  simulations: Simulation[];
  total: number;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  type: "simulation_completed" | "simulation_failed" | "system_announcement";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface NotificationCreate {
  type: "simulation_completed" | "simulation_failed" | "system_announcement";
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
}

// Game-related types
export interface Game {
  id: string;
  jackpot_id: string;
  game_api_id?: string;
  kick_off_time?: string;
  home_team?: string;
  away_team?: string;
  tournament?: string;
  country?: string;
  odds_home?: number;
  odds_draw?: number;
  odds_away?: number;
  score_home?: number;
  score_away?: number;
  game_order?: number;
  betting_status?: string;
  created_at: string;
  updated_at: string;
}

export interface JackpotMetadata {
  prizes: Record<string, number>; // {"13/13": 13554749.84, "14/14": 67516873.22, ...}
  currency: string;
  bet_amounts: Record<string, number>; // {"13/13": 99.0, "14/14": 99.0, ...}
  betting_status: string;
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
  games?: Game[];
}

export type JackpotListResponse = Jackpot[];

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  offset: number;
  limit: number;
}

// Base types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

// New specification-based types
export interface BetSpecification {
  id: string;
  simulation_id: string;
  game_selections: Record<string, string[]>; // {"1": ["1"], "2": ["1", "X"], "3": ["1", "X", "2"]}
  combination_type: "single" | "double" | "triple" | "mixed";
  double_games: number[];
  triple_games: number[];
  total_combinations: number;
  total_cost: number;
  created_at: string;
}

export interface CombinationPreview {
  combination_number: number;
  predictions: string[];
  matches: number;
  is_winner: boolean;
  prize_level?: string;
  payout: number;
}

export interface GameSelectionValidation {
  game_selections: Record<string, string[]>;
  is_valid: boolean;
  errors: string[];
  total_combinations: number;
  total_cost: number;
  combination_type: string;
  double_count: number;
  triple_count: number;
}

export interface SportPesaRules {
  maxOnlyDoubles: number;
  maxOnlyTriples: number;
  maxCombiningDoubles: number;
  maxCombiningTriples: number;
  costPerBet: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Admin types
export interface AdminStats {
  total_users: number;
  total_simulations: number;
  active_jackpots: number;
  completed_simulations: number;
  total_combinations_generated: number;
}

export interface AdminUser extends User {
  simulation_count: number;
  last_activity: string;
}

export interface AdminSimulation extends Simulation {
  user_email?: string;
  user_name?: string;
}

export interface PrizeBreakdown {
  level: string; // e.g., "13/17"
  matches_required: number;
  winning_combinations: number;
  total_payout: number;
  payout_per_winner: number;
}
