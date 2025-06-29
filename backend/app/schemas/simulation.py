from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal

class SimulationBase(BaseModel):
    """Base schema for simulation data"""
    name: str
    jackpot_id: str

class SimulationCreate(BaseModel):
    """Schema for creating a new simulation with specification-based approach"""
    name: str
    jackpot_id: str
    
    # Option 1: Budget-based creation
    budget_ksh: Optional[float] = None
    
    # Option 2: Explicit game selections
    game_selections: Optional[Dict[str, List[str]]] = None

class BetSpecification(BaseModel):
    """Schema for bet specification"""
    id: UUID
    simulation_id: UUID
    game_selections: Dict[str, List[str]]
    combination_type: str
    double_games: List[int]
    triple_games: List[int]
    total_combinations: int
    total_cost: Decimal
    created_at: datetime
    
    class Config:
        from_attributes = True

class SimulationResponse(BaseModel):
    """Schema for simulation response with new specification-based fields"""
    id: UUID
    user_id: UUID
    name: str
    jackpot_id: UUID
    
    # Specification-based fields
    combination_type: str = "single"
    double_count: int = 0
    triple_count: int = 0
    effective_combinations: int = 1
    
    total_cost: Decimal
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    results: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class SimulationWithSpecification(SimulationResponse):
    """Extended simulation response with bet specification"""
    specification: Optional[BetSpecification] = None

class PrizeBreakdown(BaseModel):
    """Schema for individual prize level breakdown"""
    level: str  # e.g., "13/17"
    matches_required: int
    winning_combinations: int
    total_payout: Decimal
    payout_per_winner: Decimal

class CombinationPreview(BaseModel):
    """Schema for combination preview with prize information"""
    combination_number: int
    predictions: List[str]
    matches: int
    is_winner: bool
    prize_level: Optional[str] = None
    payout: Decimal = 0.0

class SimulationAnalysisRequest(BaseModel):
    """Schema for requesting simulation analysis"""
    simulation_id: UUID
    
class SimulationAnalysisResponse(BaseModel):
    """Schema for analysis response with prize level tracking"""
    simulation_id: UUID
    prize_level_wins: Dict[str, int]  # {"13": 5, "14": 2, "15": 1, "16": 0, "17": 0}
    prize_level_payouts: Dict[str, Decimal]  # {"13": 67773749.2, "14": 135033746.44, ...}
    total_payout: Decimal
    total_winners: int
    net_loss: Decimal
    net_profit: Decimal
    best_match_count: int
    analysis: Dict[str, Any]
    
    class Config:
        from_attributes = True

class GameSelectionValidation(BaseModel):
    """Schema for validating game selections"""
    game_selections: Dict[str, List[str]]
    is_valid: bool
    errors: List[str]
    total_combinations: int
    total_cost: Decimal
    combination_type: str
    double_count: int
    triple_count: int

class SportPesaRules(BaseModel):
    """Schema for SportPesa betting rules"""
    maxOnlyDoubles: int = 10
    maxOnlyTriples: int = 5
    maxCombiningDoubles: int = 9
    maxCombiningTriples: int = 5
    costPerBet: int = 99

class JackpotMetadata(BaseModel):
    """Schema for jackpot metadata"""
    prizes: Dict[str, Decimal]  # {"13/13": 13554749.84, "14/14": 67516873.22, ...}
    currency: str
    bet_amounts: Dict[str, Decimal]  # {"13/13": 99.0, "14/14": 99.0, ...}
    betting_status: str

class EmailNotificationData(BaseModel):
    """Schema for email notification data"""
    user_id: str
    simulation_id: str
    simulation_name: str
    total_combinations: int
    winning_combinations: int
    win_rate: float
    total_payout: Decimal
    best_match_count: int
    actual_results: List[str]
    prize_breakdown: List[PrizeBreakdown]
