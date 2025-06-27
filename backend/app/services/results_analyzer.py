from typing import List, Dict, Any
import logging
from app.config.database import supabase

# Configure a module-level logger. In FastAPI Uvicorn apps, the root logger is
# usually configured already; the fallback basicConfig ensures logs still show
# up when run as a script.
logger = logging.getLogger(__name__)
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)


class ResultsAnalyzer:
    """
    Analyze bet combinations for a simulation against actual game results.

    The analyzer performs the following steps:
    1. Fetch the ordered list of games for the provided ``jackpot_id``.
       Each game **must** have recorded scores.
    2. Fetch every bet combination that belongs to ``simulation_id``.
    3. Compare the predictions of each combination with the actual game
       results.  A combination is considered *winning* only if **all** of
       its predictions match the outcomes.
    4. Return a summary dictionary so that later tasks can persist it to
       the ``simulation_results`` table or present it to the user.
    """

    def __init__(self, simulation_id: str, jackpot_id: str) -> None:
        logger.critical(f"Initializing ResultsAnalyzer for simulation {simulation_id} and jackpot {jackpot_id}")
        self.simulation_id = simulation_id
        self.jackpot_id = jackpot_id
        self.games: List[Dict[str, Any]] = self._fetch_games_with_results()
        if not self.games:
            raise ValueError(
                "No games with results found for jackpot_id {}".format(jackpot_id)
            )
        # Pre-compute the ordered list of actual results for quick
        # comparison during analysis.
        self.actual_results: List[str] = [self._determine_result(g) for g in self.games]
        self.num_games = len(self.actual_results)
        
        # Get simulation details
        response = supabase.table("simulations").select("total_cost").eq("id", simulation_id).single().execute()
        if not response.data:
            raise ValueError(f"Simulation {simulation_id} not found")
        self.total_cost = response.data["total_cost"]

        # Convert actual results to tuple for faster comparisons
        self.actual_results_tuple = tuple(self._determine_result(g) for g in self.games)
        # Keep track of best match count
        self.best_match_count = 0

        self._update_status("analyzing")

    def analyze(self) -> Dict[str, Any]:
        """Analyze bet combinations against actual game results."""
        try:
            # Set initial status
            self._update_status("analyzing")
            
            if not self.games:
                logger.warning("[ResultsAnalyzer] No games with results found for jackpot %s", self.jackpot_id)
                return self._create_empty_result("No games with results found")
            
            # Get total expected combinations
            count_response = supabase.table("bet_combinations").select("id", count='exact').eq("simulation_id", self.simulation_id).execute()
            total_expected = count_response.count if hasattr(count_response, 'count') else 0
            
            if total_expected == 0:
                logger.warning("[ResultsAnalyzer] No bet combinations found for simulation %s", self.simulation_id)
                return self._create_empty_result("No bet combinations found")

            # Process combinations in chunks
            CHUNK_SIZE = 1000
            next_offset = 0
            processed = 0
            total_combinations = 0
            winning_combinations = 0
            
            while True:
                response = (
                    supabase.table("bet_combinations")
                    .select("id,predictions")
                    .eq("simulation_id", self.simulation_id)
                    .range(next_offset, next_offset + CHUNK_SIZE - 1)
                    .execute()
                )
                chunk = response.data or []
                if not chunk:
                    break
                    
                for row in chunk:
                    total_combinations += 1
                    preds: List[str] = row["predictions"]
                    if len(preds) != self.num_games:
                        logger.warning(
                            f"Skipping combination {row['id']} - invalid prediction count: {len(preds)}, expected: {self.num_games}"
                        )
                        continue
                    
                    # Convert predictions to tuple for faster comparison
                    matches = self._count_matches(preds)
                    self.best_match_count = max(self.best_match_count, matches)
                    
                    if matches == self.num_games:  # All predictions match
                        winning_combinations += 1
                        
                processed += len(chunk)
                progress = int((processed / total_expected) * 100) if total_expected else 0
                self._update_status("analyzing", progress)
                
                logger.info(
                    "[ResultsAnalyzer] Progress: %d%% - Processed %d/%d combinations, %d winners",
                    progress, processed, total_expected, winning_combinations
                )
                next_offset += CHUNK_SIZE

            summary = {
                "simulation_id": self.simulation_id,
                "total_winning_combinations": winning_combinations,
                "total_payout": 0,  # TODO: Calculate actual payout
                "net_loss": float(self.total_cost),  # Since no winners, total cost is the loss
                "best_match_count": self.best_match_count,
                "winning_percentage": round(winning_combinations / total_combinations * 100, 4) if total_combinations else 0,
                "analysis": {
                    "total_combinations": total_combinations,
                    "winning_combinations": winning_combinations,
                    "winning_percentage": round(winning_combinations / total_combinations * 100, 4) if total_combinations else 0,
                    "actual_results": self.actual_results
                }
            }
            
            logger.info(
                "[ResultsAnalyzer] Completed analysis – checked %d combinations, winners=%d (%.4f%%)",
                total_combinations,
                winning_combinations,
                (winning_combinations / total_combinations * 100) if total_combinations else 0,
            )
            
            # Update final status
            self._update_status("completed", 100)
            
            # Store results
            response = supabase.table("simulation_results").upsert(summary, on_conflict="simulation_id").execute()
            if not response.data:
                logger.error("[ResultsAnalyzer] Failed to store results for simulation %s", self.simulation_id)
            
            return summary
            
        except Exception as e:
            logger.error("[ResultsAnalyzer] Error during analysis: %s", str(e))
            self._update_status("failed")
            raise

    def _create_empty_result(self, error_message: str) -> Dict[str, Any]:
        """Create an empty result with an error message."""
        return {
            "simulation_id": self.simulation_id,
            "total_winning_combinations": 0,
            "total_payout": 0,
            "net_loss": float(self.total_cost),
            "best_match_count": 0,
            "winning_percentage": 0,
            "analysis": {
                "error": error_message,
                "total_combinations": 0,
                "winning_combinations": 0,
                "winning_percentage": 0
            }
        }

    # ---------------------------------------------------------------------
    # Public helpers
    # ---------------------------------------------------------------------
    def _fetch_games_with_results(self) -> List[Dict[str, Any]]:
        """
        Retrieve finished games (i.e., with recorded scores) for the jackpot.

        A game is considered finished when both ``score_home`` and
        ``score_away`` are not ``NULL``.
        """
        response = (
            supabase.table("games")
            .select("id, score_home, score_away")
            .eq("jackpot_id", self.jackpot_id)
            .order("game_order")
            .execute()
        )
        games = response.data or []
        # Keep only rows where scores are available.
        return [g for g in games if g.get("score_home") is not None and g.get("score_away") is not None]

    def _update_status(self, status: str, progress: int = None) -> None:
        """Update simulation status and progress in the database."""
        update_data = {"status": status}
        if progress is not None:
            update_data["progress"] = progress
        # Update simulation status and progress through Supabase
        supabase.table("simulations").update(update_data).eq("id", self.simulation_id).execute()

    # ------------------------------------------------------------------
    # Result helper
    # ------------------------------------------------------------------
    @staticmethod
    def _determine_result(game_row: Dict[str, Any]) -> str:
        """Convert a game row's scores into a 1/X/2 result string."""
        home = int(game_row["score_home"])
        away = int(game_row["score_away"])
        if home > away:
            return "1"
        if home < away:
            return "2"
        return "X"

    def _count_matches(self, predictions: List[str]) -> int:
        """Count how many predictions match the actual results."""
        return sum(p == a for p, a in zip(predictions, self.actual_results_tuple))
