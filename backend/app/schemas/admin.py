from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime
from decimal import Decimal
from uuid import UUID

# User management schemas
class UserProfileResponse(BaseModel):
    """Schema for user profile in admin view"""
    id: UUID
    email: Optional[str]
    full_name: Optional[str]
    role: str
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = {}

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    """Schema for updating user profile by admin"""
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None

class UsersListResponse(BaseModel):
    """Schema for paginated users list"""
    users: List[UserProfileResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int

# System statistics schemas
class UserStatsResponse(BaseModel):
    """Schema for user statistics"""
    total_users: int
    regular_users: int
    superadmins: int
    active_users: int
    inactive_users: int
    active_last_30_days: int
    new_users_30_days: int

class SimulationStatsResponse(BaseModel):
    """Schema for simulation statistics"""
    total_simulations: int
    completed_simulations: int
    pending_simulations: int
    running_simulations: int
    simulations_last_30_days: int
    total_simulation_cost: Decimal
    avg_simulation_cost: Decimal

class SystemStatsResponse(BaseModel):
    """Schema for overall system statistics"""
    user_stats: UserStatsResponse
    simulation_stats: SimulationStatsResponse

# Simulation management schemas
class AdminSimulationResponse(BaseModel):
    """Schema for simulation in admin view with user info"""
    id: UUID
    user_id: UUID
    user_email: Optional[str]
    user_name: Optional[str]
    name: str
    total_combinations: int
    cost_per_bet: Decimal
    total_cost: Decimal
    status: str
    progress: int
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

class AdminSimulationsListResponse(BaseModel):
    """Schema for paginated simulations list in admin view"""
    simulations: List[AdminSimulationResponse]
    total_count: int
    page: int
    page_size: int
    total_pages: int 