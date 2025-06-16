from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status, BackgroundTasks
from app.schemas.simulation import (
    SimulationCreate,
    SimulationUpdate,
    SimulationResponse,
    SimulationList
)
from app.config.database import supabase
from app.api.deps import get_current_user
from decimal import Decimal
from app.services.combination_generator import CombinationGenerator
from app.services.results_analyzer import ResultsAnalyzer


def run_results_analysis(sim_id: str, jackpot_id: str):
    """Runs ResultsAnalyzer and upserts summary into simulation_results table."""
    summary = ResultsAnalyzer(simulation_id=sim_id, jackpot_id=jackpot_id).analyze()
    # Upsert ensures idempotency if analysis already exists
    supabase.table("simulation_results").upsert(summary, on_conflict="simulation_id").execute()


router = APIRouter()

@router.post("/", response_model=SimulationResponse, status_code=status.HTTP_201_CREATED)
async def create_simulation(
    simulation: SimulationCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new simulation for the current user.
    """
    # Calculate total cost
    total_cost = Decimal(simulation.cost_per_bet) * Decimal(simulation.total_combinations)
    
    # Prepare simulation data
    simulation_data = {
        "user_id": current_user["id"],
        "name": simulation.name,
        "total_combinations": simulation.total_combinations,
        "cost_per_bet": float(simulation.cost_per_bet),
        "total_cost": float(total_cost),
        "status": "pending",
        "progress": 0,
        "jackpot_id": simulation.jackpot_id
    }
    
    try:
        # Insert simulation into database
        response = supabase.table("simulations").insert(simulation_data).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create simulation"
            )
        sim_obj = response.data[0]
        # Trigger background combination generation
        background_tasks.add_task(
            CombinationGenerator(
                simulation_id=sim_obj["id"],
                jackpot_id=sim_obj["jackpot_id"],
                total_combinations=sim_obj["total_combinations"]
            ).generate_unique_combinations
        )
        return sim_obj
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create simulation: {str(e)}"
        )

@router.get("/", response_model=SimulationList)
async def list_simulations(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get a list of simulations for the current user.
    """
    try:
        # Count total simulations
        count_response = supabase.table("simulations").select("*", count="exact").eq("user_id", current_user["id"]).execute()
        total = count_response.count if hasattr(count_response, 'count') else 0
        
        # Get paginated simulations
        response = supabase.table("simulations").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        return {
            "simulations": response.data,
            "total": total
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list simulations: {str(e)}"
        )

@router.get("/{simulation_id}", response_model=SimulationResponse)
async def get_simulation(
    simulation_id: UUID = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific simulation by ID.
    """
    try:
        # Get simulation data
        sim_response = supabase.table("simulations").select("*").eq("id", str(simulation_id)).eq("user_id", current_user["id"]).execute()
        
        if not sim_response.data or len(sim_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found"
            )
        
        simulation = sim_response.data[0]
        
        # Get results data if simulation is completed
        if simulation["status"] == "completed":
            results_response = supabase.table("simulation_results").select("*").eq("simulation_id", str(simulation_id)).execute()
            if results_response.data and len(results_response.data) > 0:
                simulation["results"] = results_response.data[0]
        
        return simulation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get simulation: {str(e)}"
        )

@router.patch("/{simulation_id}", response_model=SimulationResponse)
async def update_simulation(
    simulation_update: SimulationUpdate,
    background_tasks: BackgroundTasks,
    simulation_id: UUID = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Update a specific simulation by ID.
    """
    try:
        # Check if simulation exists and belongs to the user
        check_response = supabase.table("simulations").select("*").eq("id", str(simulation_id)).eq("user_id", current_user["id"]).execute()
        
        if not check_response.data or len(check_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found"
            )
        
        # Prepare update data (exclude None values)
        update_data = {k: v for k, v in simulation_update.model_dump().items() if v is not None}
        
        # Update simulation
        response = supabase.table("simulations").update(update_data).eq("id", str(simulation_id)).eq("user_id", current_user["id"]).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update simulation"
            )
        
        updated_sim = response.data[0]
        # Trigger results analysis only when simulation is completed and its jackpot is also completed
        if update_data.get("status") == "completed":
            jp_status_resp = supabase.table("jackpots").select("status").eq("id", updated_sim["jackpot_id"]).single().execute()
            if jp_status_resp.data and jp_status_resp.data.get("status") == "completed":
                background_tasks.add_task(run_results_analysis, str(updated_sim["id"]), str(updated_sim["jackpot_id"]))
        return updated_sim
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update simulation: {str(e)}"
        )

@router.delete("/{simulation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_simulation(
    simulation_id: UUID = Path(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a specific simulation by ID.
    """
    try:
        # Check if simulation exists and belongs to the user
        check_response = supabase.table("simulations").select("*").eq("id", str(simulation_id)).eq("user_id", current_user["id"]).execute()
        
        if not check_response.data or len(check_response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found"
            )
        
        # Delete simulation
        supabase.table("simulations").delete().eq("id", str(simulation_id)).eq("user_id", current_user["id"]).execute()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete simulation: {str(e)}"
        )
