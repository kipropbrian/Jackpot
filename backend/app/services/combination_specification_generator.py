from typing import List, Dict, Any, Optional, Tuple
import logging
from app.config.database import supabase
from datetime import datetime

logger = logging.getLogger(__name__)

class CombinationSpecificationGenerator:
    """
    Generates bet combination specifications based on SportPesa rules.
    Creates specifications that can generate combinations on-demand during analysis.
    """
    
    # SportPesa rules from megajackpotrules.txt
    SPORTPESA_RULES = {
        "maxOnlyDoubles": 10,
        "maxOnlyTriples": 5, 
        "maxCombiningDoubles": 9,
        "maxCombiningTriples": 5,
        "costPerBet": 99  # KSh per individual bet
    }
    
    def __init__(self, simulation_id: str, jackpot_id: str):
        self.simulation_id = simulation_id
        self.jackpot_id = jackpot_id
        self.games = self._fetch_jackpot_games()
        self.num_games = len(self.games)
        
        if not self.games:
            raise ValueError(f"No games found for jackpot_id {jackpot_id}")
    
    def _fetch_jackpot_games(self) -> List[Dict[str, Any]]:
        """Fetch games for the given jackpot_id from the database."""
        response = supabase.table("games").select("*").eq("jackpot_id", self.jackpot_id).order("game_order").execute()
        return response.data or []
    
    def create_specification_from_budget(self, budget_ksh: float) -> Dict[str, Any]:
        """
        Create a combination specification based on available budget.
        Automatically determines optimal distribution of doubles/triples.
        """
        max_combinations = int(budget_ksh // self.SPORTPESA_RULES["costPerBet"])
        
        if max_combinations < 1:
            raise ValueError(f"Budget too low. Minimum required: {self.SPORTPESA_RULES['costPerBet']} KSh")
        
        # Strategy: Distribute doubles/triples to get close to max_combinations
        # while respecting SportPesa rules
        
        best_spec = None
        best_difference = float('inf')
        
        # Try different combinations of doubles and triples
        for doubles in range(0, min(self.SPORTPESA_RULES["maxOnlyDoubles"] + 1, self.num_games)):
            for triples in range(0, min(self.SPORTPESA_RULES["maxOnlyTriples"] + 1, self.num_games - doubles)):
                
                # Check if combination is valid under SportPesa rules
                if not self._validate_combination_rules(doubles, triples):
                    continue
                
                # Calculate total combinations for this distribution
                total_combinations = (2 ** doubles) * (3 ** triples)
                
                if total_combinations <= max_combinations:
                    difference = max_combinations - total_combinations
                    if difference < best_difference:
                        best_difference = difference
                        best_spec = {
                            "doubles": doubles,
                            "triples": triples,
                            "total_combinations": total_combinations
                        }
        
        if not best_spec:
            # Fallback to single bets
            best_spec = {
                "doubles": 0,
                "triples": 0, 
                "total_combinations": 1
            }
        
        return self._create_specification(best_spec["doubles"], best_spec["triples"])
    
    def create_specification_from_selections(self, game_selections: Dict[str, List[str]]) -> Dict[str, Any]:
        """
        Create a combination specification from explicit game selections.
        game_selections format: {"1": ["1"], "2": ["1", "X"], "3": ["1", "X", "2"]}
        """
        # Validate game selections
        if not self._validate_game_selections(game_selections):
            raise ValueError("Invalid game selections")
        
        # Calculate doubles and triples
        double_games = []
        triple_games = []
        total_combinations = 1
        
        for game_num, selections in game_selections.items():
            game_index = int(game_num)
            selection_count = len(selections)
            
            if selection_count == 2:
                double_games.append(game_index)
            elif selection_count == 3:
                triple_games.append(game_index)
            
            total_combinations *= selection_count
        
        # Validate against SportPesa rules
        if not self._validate_combination_rules(len(double_games), len(triple_games)):
            raise ValueError("Combination violates SportPesa rules")
        
        combination_type = self._determine_combination_type(double_games, triple_games)
        total_cost = total_combinations * self.SPORTPESA_RULES["costPerBet"]
        
        return {
            "game_selections": game_selections,
            "combination_type": combination_type,
            "double_games": double_games,
            "triple_games": triple_games,
            "total_combinations": total_combinations,
            "total_cost": total_cost
        }
    
    def _create_specification(self, doubles_count: int, triples_count: int) -> Dict[str, Any]:
        """Create a specification with random game assignments for doubles/triples."""
        import random
        
        # Randomly assign games to have doubles/triples
        available_games = list(range(1, self.num_games + 1))
        random.shuffle(available_games)
        
        double_games = available_games[:doubles_count]
        triple_games = available_games[doubles_count:doubles_count + triples_count]
        
        # Create game selections
        game_selections = {}
        predictions = ["1", "X", "2"]
        
        for game_num in range(1, self.num_games + 1):
            if game_num in triple_games:
                game_selections[str(game_num)] = predictions.copy()  # All three
            elif game_num in double_games:
                game_selections[str(game_num)] = random.sample(predictions, 2)  # Two random
            else:
                game_selections[str(game_num)] = [random.choice(predictions)]  # One random
        
        combination_type = self._determine_combination_type(double_games, triple_games)
        total_combinations = (2 ** doubles_count) * (3 ** triples_count)
        total_cost = total_combinations * self.SPORTPESA_RULES["costPerBet"]
        
        return {
            "game_selections": game_selections,
            "combination_type": combination_type,
            "double_games": double_games,
            "triple_games": triple_games,
            "total_combinations": total_combinations,
            "total_cost": total_cost
        }
    
    def _validate_combination_rules(self, doubles: int, triples: int) -> bool:
        """Validate combination against SportPesa rules."""
        if triples == 0 and doubles > self.SPORTPESA_RULES["maxOnlyDoubles"]:
            return False
        if doubles == 0 and triples > self.SPORTPESA_RULES["maxOnlyTriples"]:
            return False
        if doubles > 0 and triples > 0:
            if doubles > self.SPORTPESA_RULES["maxCombiningDoubles"] or triples > self.SPORTPESA_RULES["maxCombiningTriples"]:
                return False
        return True
    
    def _validate_game_selections(self, game_selections: Dict[str, List[str]]) -> bool:
        """Validate that game selections are valid."""
        valid_predictions = {"1", "X", "2"}
        
        for game_num, selections in game_selections.items():
            # Check game number is valid
            try:
                game_index = int(game_num)
                if game_index < 1 or game_index > self.num_games:
                    return False
            except ValueError:
                return False
            
            # Check selections are valid
            if not selections or len(selections) > 3:
                return False
            
            for selection in selections:
                if selection not in valid_predictions:
                    return False
                    
            # Check no duplicates
            if len(set(selections)) != len(selections):
                return False
        
        return True
    
    def _determine_combination_type(self, double_games: List[int], triple_games: List[int]) -> str:
        """Determine the combination type based on game selections."""
        has_doubles = len(double_games) > 0
        has_triples = len(triple_games) > 0
        
        if has_doubles and has_triples:
            return "mixed"
        elif has_triples:
            return "triple"
        elif has_doubles:
            return "double"
        else:
            return "single"
    
    def save_specification(self, specification: Dict[str, Any]) -> str:
        """Save the specification to the database and update simulation."""
        try:
            # Insert bet specification
            spec_data = {
                "simulation_id": self.simulation_id,
                "game_selections": specification["game_selections"],
                "combination_type": specification["combination_type"],
                "double_games": specification["double_games"],
                "triple_games": specification["triple_games"],
                "total_combinations": specification["total_combinations"],
                "total_cost": specification["total_cost"]
            }
            
            response = supabase.table("bet_specifications").insert(spec_data).execute()
            if not response.data:
                raise Exception("Failed to insert bet specification")
            
            # Update simulation with new fields (no legacy fields)
            sim_update = {
                "combination_type": specification["combination_type"],
                "double_count": len(specification["double_games"]),
                "triple_count": len(specification["triple_games"]),
                "effective_combinations": specification["total_combinations"],
                "total_cost": specification["total_cost"],
                "status": "completed",  # Instant completion - no progress needed
                "completed_at": datetime.now().isoformat()
            }
            
            supabase.table("simulations").update(sim_update).eq("id", self.simulation_id).execute()
            
            logger.info(f"[CombinationSpecificationGenerator] Created specification for simulation {self.simulation_id}: {specification['total_combinations']} combinations, cost {specification['total_cost']} KSh")
            
            return response.data[0]["id"]
            
        except Exception as e:
            # Mark simulation as failed
            supabase.table("simulations").update({
                "status": "failed",
                "error_message": str(e)
            }).eq("id", self.simulation_id).execute()
            raise 