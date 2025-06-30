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
    """Get all simulations for the current user with pagination and enhanced status information."""
    try:
        # Get simulations with jackpot information and results existence
        response = (
            supabase.table("simulations")
            .select("*, jackpots!inner(status, name), simulation_results(id)", count="exact")
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        
        simulations = response.data or []
        total_count = response.count or 0
        
        # Enhance simulations with computed status and prefetched data
        enhanced_simulations = []
        for sim in simulations:
            # Determine enhanced status based on simulation status, jackpot status, and results existence
            enhanced_status = sim["status"]
            has_results = bool(sim.get("simulation_results") and len(sim["simulation_results"]) > 0)
            jackpot_status = sim["jackpots"]["status"] if sim.get("jackpots") else "unknown"
            
            if sim["status"] == "completed":
                if has_results:
                    enhanced_status = "results_available"
                elif jackpot_status == "open":
                    enhanced_status = "waiting_for_games"
                elif jackpot_status == "completed":
                    enhanced_status = "analyzing"  # Will be analyzed automatically
                # If jackpot_status is something else, keep "completed"
            
            # Prefetch basic results data if available for faster details page loading
            basic_results = None
            if has_results:
                try:
                    results_response = (
                        supabase.table("simulation_results")
                        .select("total_winners, total_payout, net_loss, best_match_count")
                        .eq("simulation_id", sim["id"])
                        .execute()
                    )
                    if results_response.data:
                        basic_results = results_response.data[0]
                        logger.debug(f"Prefetched basic results for simulation {sim['id']}")
                except Exception as e:
                    logger.warning(f"Failed to prefetch results for simulation {sim['id']}: {e}")
            
            # Clean up the response and add enhanced information
            enhanced_sim = {
                **sim,
                "enhanced_status": enhanced_status,
                "jackpot_status": jackpot_status,
                "jackpot_name": sim["jackpots"]["name"] if sim.get("jackpots") else None,
                "has_results": has_results,
                "basic_results": basic_results,  # Prefetched data for faster details loading
            }
            
            # Remove the nested objects to clean up the response
            enhanced_sim.pop("jackpots", None)
            enhanced_sim.pop("simulation_results", None)
            
            enhanced_simulations.append(enhanced_sim)
        
        # Trigger automatic analysis for eligible simulations (run in background)
        try:
            # Count how many simulations need analysis
            needs_analysis = [s for s in enhanced_simulations if s.get("enhanced_status") == "analyzing"]
            if needs_analysis:
                logger.info(f"Found {len(needs_analysis)} simulations needing auto-analysis")
                # Trigger analysis in background thread to avoid blocking the response
                import threading
                from app.services.specification_analyzer import SpecificationAnalyzer
                
                def trigger_auto_analysis():
                    for sim in needs_analysis:
                        try:
                            analyzer = SpecificationAnalyzer(sim["id"], sim["jackpot_id"])
                            analyzer.analyze()
                            logger.info(f"Auto-analysis completed for simulation {sim['id']}")
                        except Exception as e:
                            logger.error(f"Auto-analysis failed for simulation {sim['id']}: {e}")
                
                analysis_thread = threading.Thread(target=trigger_auto_analysis)
                analysis_thread.daemon = True
                analysis_thread.start()
        except Exception as e:
            logger.warning(f"Failed to trigger auto-analysis: {e}")
        
        return SimulationListResponse(
            simulations=enhanced_simulations,
            total=total_count
        )
        
    except Exception as e:
        logger.error(f"Failed to fetch simulations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch simulations: {str(e)}"
        )

@router.get("/{simulation_id}", response_model=SimulationWithSpecification)
async def get_simulation(
    simulation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific simulation with its bet specification and essential jackpot metadata."""
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
        
        # Get essential jackpot metadata (name, status, prizes) - no games data
        jackpot_response = (
            supabase.table("jackpots")
            .select("name, status, metadata")
            .eq("id", simulation["jackpot_id"])
            .single()
            .execute()
        )
        
        jackpot_data = jackpot_response.data if jackpot_response.data else {}
        logger.info(f"Jackpot data for simulation {simulation_id}: {jackpot_data}")
        
        # Debug: check if metadata exists and has prizes
        if jackpot_data.get("metadata") and jackpot_data["metadata"].get("prizes"):
            logger.info(f"Found jackpot metadata with prizes: {list(jackpot_data['metadata']['prizes'].keys())}")
        else:
            logger.warning(f"No jackpot metadata or prizes found for jackpot {simulation['jackpot_id']}")
        
        # Get bet specification if it exists
        spec_response = (
            supabase.table("bet_specifications")
            .select("*")
            .eq("simulation_id", simulation_id)
            .execute()
        )
        
        specification = spec_response.data[0] if spec_response.data else None
        
        # Get simulation results if they exist
        try:
            logger.info(f"Fetching results for simulation {simulation_id}")
            results_response = (
                supabase.table("simulation_results")
                .select("*")
                .eq("simulation_id", simulation_id)
                .execute()
            )
            # In Python client, we get a list - take the first result if it exists
            results = results_response.data[0] if results_response.data else None
            logger.info(f"Results response for {simulation_id}: data={results is not None}, count={len(results_response.data) if results_response.data else 0}")
        except Exception as e:
            logger.error(f"Failed to fetch results for simulation {simulation_id}: {e}")
            results = None
        
        # Enhance simulation with jackpot metadata
        enhanced_simulation = {
            **simulation,
            "jackpot_name": jackpot_data.get("name"),
            "jackpot_status": jackpot_data.get("status"),
            "jackpot_metadata": jackpot_data.get("metadata"),
            "specification": specification,
            "results": results
        }
        
        return enhanced_simulation
        
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

@router.post("/trigger-auto-analysis")
async def trigger_auto_analysis():
    """Manual endpoint to trigger automatic analysis for eligible simulations."""
    try:
        # Find completed simulations where jackpot is completed but no results exist  
        simulations_response = (
            supabase.table("simulations")
            .select("id, jackpot_id, user_id")
            .eq("status", "completed")
            .execute()
        )
        
        eligible_count = 0
        
        if simulations_response.data:
            import threading
            from app.services.specification_analyzer import SpecificationAnalyzer
            
            def run_analysis_batch():
                for sim in simulations_response.data:
                    try:
                        # Check if jackpot is completed
                        jackpot_response = (
                            supabase.table("jackpots")
                            .select("status")
                            .eq("id", sim["jackpot_id"])
                            .single()
                            .execute()
                        )
                        
                        if not jackpot_response.data or jackpot_response.data["status"] != "completed":
                            continue
                        
                        # Check if results already exist
                        results_response = (
                            supabase.table("simulation_results")
                            .select("id")
                            .eq("simulation_id", sim["id"])
                            .execute()
                        )
                        
                        if results_response.data:
                            continue  # Results already exist
                        
                        # This simulation is eligible for auto-analysis
                        logger.info(f"Manual auto-triggering analysis for simulation {sim['id']}")
                        analyzer = SpecificationAnalyzer(sim["id"], sim["jackpot_id"])
                        analyzer.analyze()
                        
                    except Exception as e:
                        logger.error(f"Failed to analyze simulation {sim['id']}: {e}")
                        continue
            
            # Count eligible simulations first
            for sim in simulations_response.data:
                try:
                    jackpot_response = (
                        supabase.table("jackpots")
                        .select("status")
                        .eq("id", sim["jackpot_id"])
                        .single()
                        .execute()
                    )
                    
                    if not jackpot_response.data or jackpot_response.data["status"] != "completed":
                        continue
                    
                    results_response = (
                        supabase.table("simulation_results")
                        .select("id")
                        .eq("simulation_id", sim["id"])
                        .execute()
                    )
                    
                    if not results_response.data:
                        eligible_count += 1
                except:
                    continue
            
            if eligible_count > 0:
                # Run analysis in background thread
                analysis_thread = threading.Thread(target=run_analysis_batch)
                analysis_thread.daemon = True
                analysis_thread.start()
        
        return {"message": f"Triggered analysis for {eligible_count} simulations"}
        
    except Exception as e:
        logger.error(f"Failed to trigger auto-analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to trigger auto-analysis: {str(e)}"
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
    request: GameSelectionValidationRequest,
    jackpot_id: str
):
    """Validate game selections and calculate combinations/cost"""
    try:
        # Extract game selections from the request
        game_selections = request.game_selections
        
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

@router.delete("/{simulation_id}/results")
async def delete_simulation_results(
    simulation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete simulation results to allow re-analysis with updated jackpot metadata"""
    try:
        # Verify simulation ownership first
        sim_response = (
            supabase.table("simulations")
            .select("id, jackpot_id")
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
        
        # Delete existing results
        delete_response = (
            supabase.table("simulation_results")
            .delete()
            .eq("simulation_id", simulation_id)
            .execute()
        )
        
        # Trigger re-analysis immediately
        try:
            from app.services.specification_analyzer import SpecificationAnalyzer
            analyzer = SpecificationAnalyzer(simulation_id, sim_response.data["jackpot_id"])
            analyzer.analyze()
            logger.info(f"Re-analysis completed for simulation {simulation_id}")
            
            return {
                "message": "Results deleted and re-analysis completed",
                "simulation_id": simulation_id
            }
        except Exception as e:
            logger.error(f"Re-analysis failed for simulation {simulation_id}: {e}")
            return {
                "message": "Results deleted but re-analysis failed",
                "simulation_id": simulation_id,
                "error": str(e)
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete results: {str(e)}"
        )

@router.get("/{simulation_id}/debug-results")
async def debug_simulation_results(
    simulation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Debug endpoint to check if simulation results exist"""
    try:
        # Verify simulation ownership first
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
        
        # Check if results exist using different queries
        results_info = {}
        
        # Query 1: single result (what we use in production)
        try:
            single_response = supabase.table("simulation_results").select("*").eq("simulation_id", simulation_id).execute()
            results_info["single_result"] = len(single_response.data) > 0 if single_response.data else False
            results_info["single_data"] = single_response.data[0] if single_response.data else None
        except Exception as e:
            results_info["single_error"] = str(e)
        
        # Query 2: regular select (to see all rows)
        try:
            all_response = supabase.table("simulation_results").select("*").eq("simulation_id", simulation_id).execute()
            results_info["all_results_count"] = len(all_response.data) if all_response.data else 0
            results_info["all_results_data"] = all_response.data
        except Exception as e:
            results_info["all_results_error"] = str(e)
        
        # Query 3: count all simulation results
        try:
            count_response = supabase.table("simulation_results").select("simulation_id", count="exact").execute()
            results_info["total_results_in_table"] = count_response.count
        except Exception as e:
            results_info["count_error"] = str(e)
        
        return {
            "simulation_id": simulation_id,
            "debug_info": results_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Debug query failed: {str(e)}"
        )
