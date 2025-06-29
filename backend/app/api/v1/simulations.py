from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Query
from typing import List
import logging
from app.schemas.simulation import (
    SimulationCreate,
    SimulationResponse,
    SimulationWithSpecification,
    BetSpecificationResponse,
    CombinationPreview,
    GameSelectionValidationRequest,
    GameSelectionValidationResponse,
    SportPesaRules,
    SimulationListResponse
)
from app.config.database import supabase
from app.api.deps import get_current_user
from app.services.combination_specification_generator import CombinationSpecificationGenerator
from app.services.specification_analyzer import SpecificationAnalyzer


router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=SimulationResponse, status_code=status.HTTP_201_CREATED)
async def create_simulation(
    simulation: SimulationCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new simulation using the specification-based approach.
    Supports both budget-based and explicit game selection methods.
    """
    try:
        # Create the specification generator
        spec_generator = CombinationSpecificationGenerator(
            simulation_id="temp",  # Will be updated after simulation creation
            jackpot_id=simulation.jackpot_id
        )
        
        # Determine creation method and generate specification
        if simulation.game_selections:
            # Method 1: Explicit game selections
            specification = spec_generator.create_specification_from_selections(simulation.game_selections)
        elif simulation.budget_ksh:
            # Method 2: Budget-based automatic selection
            specification = spec_generator.create_specification_from_budget(simulation.budget_ksh)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must provide either game_selections or budget_ksh"
            )
        
        # Prepare simulation data
        simulation_data = {
            "user_id": current_user["id"], 
            "name": simulation.name,
            "jackpot_id": simulation.jackpot_id,
            "combination_type": specification["combination_type"],
            "double_count": len(specification["double_games"]),
            "triple_count": len(specification["triple_games"]),
            "effective_combinations": specification["total_combinations"],
            "total_cost": float(specification["total_cost"]),
            "status": "pending"
        }
        
        # Insert simulation into database
        response = supabase.table("simulations").insert(simulation_data).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create simulation"
            )
        
        sim_obj = response.data[0]
        
        # Update specification generator with real simulation ID and save
        spec_generator.simulation_id = sim_obj["id"]
        background_tasks.add_task(spec_generator.save_specification, specification)
        
        return sim_obj
        
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create simulation: {str(e)}"
        )

@router.get("/", response_model=SimulationListResponse)
async def get_simulations(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get all simulations for the current user with pagination."""
    try:
        # Get simulations with count
        response = (
            supabase.table("simulations")
            .select("*", count="exact")
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        
        simulations = response.data or []
        total_count = response.count or 0
        
        return SimulationListResponse(
            simulations=simulations,
            total=total_count
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch simulations: {str(e)}"
        )

@router.get("/{simulation_id}", response_model=SimulationWithSpecification)
async def get_simulation(
    simulation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific simulation with its bet specification."""
    try:
        # Get simulation
        sim_response = (
            supabase.table("simulations")
            .select("*")
            .eq("id", simulation_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        
        if not sim_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found"
            )
        
        simulation = sim_response.data
        
        # Get bet specification if it exists
        spec_response = (
            supabase.table("bet_specifications")
            .select("*")
            .eq("simulation_id", simulation_id)
            .execute()
        )
        
        specification = spec_response.data[0] if spec_response.data else None
        
        return {
            **simulation,
            "specification": specification
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch simulation: {str(e)}"
        )

@router.delete("/{simulation_id}")
async def delete_simulation(
    simulation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a simulation and its associated data."""
    try:
        # Verify ownership
        sim_response = (
            supabase.table("simulations")
            .select("id")
            .eq("id", simulation_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        
        if not sim_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found"
            )
        
        # Delete simulation (cascading deletes will handle related data)
        supabase.table("simulations").delete().eq("id", simulation_id).execute()
        
        return {"message": "Simulation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete simulation: {str(e)}"
        )

@router.post("/{simulation_id}/analyze")
async def analyze_simulation(
    simulation_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Trigger analysis of a completed simulation."""
    try:
        # Verify simulation exists and belongs to user
        sim_response = (
            supabase.table("simulations")
            .select("jackpot_id, status")
            .eq("id", simulation_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        
        if not sim_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found"
            )
        
        simulation = sim_response.data
        
        # Check if simulation is completed
        if simulation["status"] != "completed":
            error_msg = f"Cannot analyze simulation {simulation_id}: simulation status is '{simulation['status']}', expected 'completed'"
            logger.error(error_msg)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot analyze simulation: simulation is not completed yet"
            )
        
        # Check if jackpot is completed (has results)
        jackpot_response = (
            supabase.table("jackpots")
            .select("status")
            .eq("id", simulation["jackpot_id"])
            .single()
            .execute()
        )
        
        jackpot_status = jackpot_response.data["status"] if jackpot_response.data else "not_found"
        if not jackpot_response.data or jackpot_status != "completed":
            error_msg = f"Cannot analyze simulation {simulation_id}: jackpot {simulation['jackpot_id']} status is '{jackpot_status}', expected 'completed'"
            logger.error(error_msg)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot analyze simulation: jackpot is not completed yet"
            )
        
        # Trigger analysis in background
        background_tasks.add_task(
            SpecificationAnalyzer(simulation_id, simulation["jackpot_id"]).analyze
        )
        
        logger.info(f"Analysis started for simulation {simulation_id} with jackpot {simulation['jackpot_id']}")
        return {"message": "Analysis started", "simulation_id": simulation_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start analysis: {str(e)}"
        )

@router.get("/{simulation_id}/preview", response_model=List[CombinationPreview])
async def get_combination_preview(
    simulation_id: str,
    current_user: dict = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=50)
):
    """Get a preview of the first few combinations for a simulation."""
    try:
        # Verify simulation exists and belongs to user
        sim_response = (
            supabase.table("simulations")
            .select("jackpot_id")
            .eq("id", simulation_id)
            .eq("user_id", current_user["id"])
            .single()
            .execute()
        )
        
        if not sim_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Simulation not found"
            )
        
        # Get combination preview
        analyzer = SpecificationAnalyzer(simulation_id, sim_response.data["jackpot_id"])
        preview = analyzer.get_combination_preview(limit)
        
        return preview
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get combination preview: {str(e)}"
        )

@router.post("/validate-selections", response_model=GameSelectionValidationResponse)
async def validate_game_selections(
    game_selections: dict,
    jackpot_id: str
):
    """Validate game selections and calculate combinations/cost"""
    try:
        # Create temporary specification generator for validation
        temp_generator = CombinationSpecificationGenerator(
            simulation_id="temp_validation",
            jackpot_id=jackpot_id
        )
        
        try:
            # Attempt to create specification from selections
            specification = temp_generator.create_specification_from_selections(game_selections)
            
            return GameSelectionValidationResponse(
                game_selections=game_selections,
                is_valid=True,
                errors=[],
                total_combinations=specification["total_combinations"],
                total_cost=float(specification["total_cost"]),
                combination_type=specification["combination_type"],
                double_count=len(specification["double_games"]),
                triple_count=len(specification["triple_games"])
            )
            
        except ValueError as ve:
            return GameSelectionValidationResponse(
                game_selections=game_selections,
                is_valid=False,
                errors=[str(ve)],
                total_combinations=0,
                total_cost=0.0,
                combination_type="single",
                double_count=0,
                triple_count=0
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate selections: {str(e)}"
        )

@router.get("/rules/sportpesa", response_model=SportPesaRules)
async def get_sportpesa_rules():
    """Get SportPesa betting rules and limits."""
    return SportPesaRules()
