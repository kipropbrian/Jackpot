from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal

class SimulationBase(BaseModel):
    """Base schema for simulation data"""
    name: str
    total_combinations: int
    cost_per_bet: Decimal
    
class SimulationCreate(SimulationBase):
    """Schema for creating a new simulation"""
    pass

class SimulationUpdate(BaseModel):
    """Schema for updating a simulation"""
    name: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    completed_at: Optional[datetime] = None
    results: Optional[Dict[str, Any]] = None

class SimulationInDB(SimulationBase):
    """Schema for simulation data as stored in the database"""
    id: UUID
    user_id: UUID
    total_cost: Decimal
    status: str = "pending"
    progress: int = 0
    created_at: datetime
    completed_at: Optional[datetime] = None
    results: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class SimulationResponse(SimulationInDB):
    """Schema for simulation response"""
    id: str
    user_id: str
    total_cost: float
    cost_per_bet: float
    created_at: str
    completed_at: Optional[str] = None

    class Config:
        from_attributes = True

class SimulationList(BaseModel):
    """Schema for a list of simulations"""
    simulations: List[SimulationResponse]
    total: int
