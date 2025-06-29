from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from uuid import UUID
import math

from app.api.deps import get_current_superadmin
from app.config.database import supabase
from app.schemas.admin import (
    UserProfileResponse,
    UserUpdateRequest,
    UsersListResponse,
    UserStatsResponse,
    SimulationStatsResponse,
    SystemStatsResponse,
    AdminSimulationResponse,
    AdminSimulationsListResponse
)

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=UsersListResponse)
async def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: dict = Depends(get_current_superadmin)
):
    """Get paginated list of users with optional filtering"""
    
    # Build query
    query = supabase.table("profiles").select("*", count="exact")
    
    # Apply filters
    if search:
        query = query.or_(f"email.ilike.%{search}%,full_name.ilike.%{search}%")
    
    if role:
        query = query.eq("role", role)
    
    if is_active is not None:
        query = query.eq("is_active", is_active)
    
    # Calculate offset
    offset = (page - 1) * page_size
    
    # Execute query with pagination
    response = query.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
    
    if not response.data:
        users = []
        total_count = 0
    else:
        users = [UserProfileResponse(**user) for user in response.data]
        total_count = response.count
    
    total_pages = math.ceil(total_count / page_size) if total_count > 0 else 0
    
    return UsersListResponse(
        users=users,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/users/{user_id}", response_model=UserProfileResponse)
async def get_user(
    user_id: UUID,
    current_user: dict = Depends(get_current_superadmin)
):
    """Get a specific user by ID"""
    
    response = supabase.table("profiles").select("*").eq("id", str(user_id)).single().execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserProfileResponse(**response.data)

@router.put("/users/{user_id}", response_model=UserProfileResponse)
async def update_user(
    user_id: UUID,
    user_update: UserUpdateRequest,
    current_user: dict = Depends(get_current_superadmin)
):
    """Update a user's profile"""
    
    # Prepare update data (only include non-None fields)
    update_data = {}
    if user_update.full_name is not None:
        update_data["full_name"] = user_update.full_name
    if user_update.role is not None:
        update_data["role"] = user_update.role
    if user_update.is_active is not None:
        update_data["is_active"] = user_update.is_active
    if user_update.metadata is not None:
        update_data["metadata"] = user_update.metadata
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Prevent user from changing their own role or active status
    if str(user_id) == current_user["id"]:
        if "role" in update_data or "is_active" in update_data:
            raise HTTPException(
                status_code=400, 
                detail="Cannot change your own role or active status"
            )
    
    # Execute update
    response = supabase.table("profiles").update(update_data).eq("id", str(user_id)).execute()
    
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserProfileResponse(**response.data[0])

@router.get("/stats", response_model=SystemStatsResponse)
async def get_system_stats(
    current_user: dict = Depends(get_current_superadmin)
):
    """Get system-wide statistics"""
    
    # Get user statistics
    user_stats_response = supabase.table("admin_user_stats").select("*").execute()
    user_stats = UserStatsResponse(**user_stats_response.data[0]) if user_stats_response.data else UserStatsResponse(
        total_users=0, regular_users=0, superadmins=0, active_users=0, 
        inactive_users=0, active_last_30_days=0, new_users_30_days=0
    )
    
    # Get simulation statistics
    sim_stats_response = supabase.table("admin_simulation_stats").select("*").execute()
    sim_stats = SimulationStatsResponse(**sim_stats_response.data[0]) if sim_stats_response.data else SimulationStatsResponse(
        total_simulations=0, completed_simulations=0, pending_simulations=0,
        running_simulations=0, simulations_last_30_days=0, total_simulation_cost=0, avg_simulation_cost=0
    )
    
    return SystemStatsResponse(
        user_stats=user_stats,
        simulation_stats=sim_stats
    )

@router.get("/simulations", response_model=AdminSimulationsListResponse)
async def get_all_simulations(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_superadmin)
):
    """Get paginated list of all simulations across users"""
    
    # Build query with join to get user information
    query = supabase.table("simulations").select(
        "*, profiles!simulations_user_id_fkey(email, full_name)",
        count="exact"
    )
    
    # Apply filters
    if status:
        query = query.eq("status", status)
    
    if user_email:
        query = query.eq("profiles.email", user_email)
    
    # Calculate offset
    offset = (page - 1) * page_size
    
    # Execute query with pagination
    response = query.order("created_at", desc=True).range(offset, offset + page_size - 1).execute()
    
    if not response.data:
        simulations = []
        total_count = 0
    else:
        simulations = []
        for sim in response.data:
            profile = sim.get("profiles", {}) or {}
            simulation_data = {
                "id": sim["id"],
                "user_id": sim["user_id"],
                "user_email": profile.get("email"),
                "user_name": profile.get("full_name"),
                "name": sim["name"],
                "jackpot_id": sim["jackpot_id"],
                "combination_type": sim.get("combination_type", "single"),
                "double_count": sim.get("double_count", 0),
                "triple_count": sim.get("triple_count", 0),
                "effective_combinations": sim.get("effective_combinations", 0),
                "total_cost": sim["total_cost"],
                "status": sim["status"],
                "created_at": sim["created_at"],
                "completed_at": sim["completed_at"]
            }
            simulations.append(AdminSimulationResponse(**simulation_data))
        
        total_count = response.count
    
    total_pages = math.ceil(total_count / page_size) if total_count > 0 else 0
    
    return AdminSimulationsListResponse(
        simulations=simulations,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/simulations/{simulation_id}")
async def get_simulation_details(
    simulation_id: UUID,
    current_user: dict = Depends(get_current_superadmin)
):
    """Get detailed information about a specific simulation"""
    
    # Get simulation with user info
    sim_response = supabase.table("simulations").select(
        "*, profiles!simulations_user_id_fkey(email, full_name)"
    ).eq("id", str(simulation_id)).single().execute()
    
    if not sim_response.data:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    simulation = sim_response.data
    profile = simulation.get("profiles", {}) or {}
    
    # Get simulation results if available
    results_response = supabase.table("simulation_results").select("*").eq(
        "simulation_id", str(simulation_id)
    ).single().execute()
    
    return {
        "simulation": {
            "id": simulation["id"],
            "user_id": simulation["user_id"],
            "user_email": profile.get("email"),
            "user_name": profile.get("full_name"),
            "name": simulation["name"],
            "jackpot_id": simulation["jackpot_id"],
            "combination_type": simulation.get("combination_type", "single"),
            "double_count": simulation.get("double_count", 0),
            "triple_count": simulation.get("triple_count", 0),
            "effective_combinations": simulation.get("effective_combinations", 0),
            "total_cost": simulation["total_cost"],
            "status": simulation["status"],
            "created_at": simulation["created_at"],
            "completed_at": simulation["completed_at"],
            "results": simulation.get("results")
        },
        "detailed_results": results_response.data if results_response.data else None
    } 