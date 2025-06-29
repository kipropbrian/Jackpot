from typing import List, Dict, Any, Iterator, Tuple
import logging
from itertools import product
from app.config.database import supabase
from app.services.email_service import EmailService
from app.api.v1.notifications import create_simulation_completion_notification

logger = logging.getLogger(__name__)

class SpecificationAnalyzer:
    """
    Analyze bet specifications against actual game results with prize level tracking.
    
    Generates combinations on-demand and tracks wins for each prize level
    (13/13, 14/14, 15/15, 16/16, 17/17) based on jackpot metadata.
    """
    
    def __init__(self, simulation_id: str, jackpot_id: str):
        logger.info(f"Initializing SpecificationAnalyzer for simulation {simulation_id} and jackpot {jackpot_id}")
        
        self.simulation_id = simulation_id
        self.jackpot_id = jackpot_id
        
        # Fetch jackpot metadata for prize information
        self.jackpot_metadata = self._fetch_jackpot_metadata()
        self.prize_levels = self._extract_prize_levels()
        
        # Fetch actual game results
        self.games = self._fetch_games_with_results()
        if not self.games:
            raise ValueError(f"No games with results found for jackpot_id {jackpot_id}")
        
        # Pre-compute actual results for quick comparison
        self.actual_results = [self._determine_result(g) for g in self.games]
        self.num_games = len(self.actual_results)
        
        # Get simulation details
        sim_response = supabase.table("simulations").select("total_cost, effective_combinations").eq("id", simulation_id).single().execute()
        if not sim_response.data:
            raise ValueError(f"Simulation {simulation_id} not found")
        
        self.total_cost = sim_response.data["total_cost"]
        self.effective_combinations = sim_response.data["effective_combinations"]
        
        # Fetch bet specification
        spec_response = supabase.table("bet_specifications").select("*").eq("simulation_id", simulation_id).single().execute()
        if not spec_response.data:
            raise ValueError(f"No bet specification found for simulation {simulation_id}")
        
        self.specification = spec_response.data
        self.game_selections = self.specification["game_selections"]
        
        logger.info(f"[SpecificationAnalyzer] Loaded specification: {self.effective_combinations} total combinations")
        logger.info(f"[SpecificationAnalyzer] Prize levels: {self.prize_levels}")

    def analyze(self) -> Dict[str, Any]:
        """Analyze the bet specification against actual game results with prize level tracking."""
        try:
            logger.info(f"[SpecificationAnalyzer] Starting analysis of {self.effective_combinations} combinations")
            
            # Initialize prize level tracking
            prize_level_wins = {str(level): 0 for level in self.prize_levels}
            prize_level_payouts = {str(level): 0.0 for level in self.prize_levels}
            
            total_combinations = 0
            total_winners = 0
            best_match_count = 0
            
            # Generate and analyze combinations on-demand
            for combination in self._generate_combinations():
                total_combinations += 1
                
                # Count matches for this combination
                matches = self._count_matches(combination)
                best_match_count = max(best_match_count, matches)
                
                # Check if this combination wins any prize levels
                if matches in self.prize_levels:
                    prize_level_wins[str(matches)] += 1
                    payout = self._calculate_payout(matches)
                    prize_level_payouts[str(matches)] += payout
                    total_winners += 1
                
                # Log progress periodically for large combinations
                if total_combinations % 1000 == 0:
                    logger.info(f"[SpecificationAnalyzer] Processed {total_combinations}/{self.effective_combinations} combinations")
            
            # Calculate totals
            total_payout = sum(prize_level_payouts.values())
            net_profit_loss = total_payout - float(self.total_cost)
            
            summary = {
                "simulation_id": self.simulation_id,
                "prize_level_wins": prize_level_wins,
                "prize_level_payouts": prize_level_payouts,
                "total_payout": float(total_payout),
                "total_winners": total_winners,
                "net_loss": -net_profit_loss if net_profit_loss < 0 else 0.0,
                "best_match_count": best_match_count,
                "analysis": {
                    "total_combinations": total_combinations,
                    "total_winners": total_winners,
                    "winning_percentage": round(total_winners / total_combinations * 100, 4) if total_combinations > 0 else 0,
                    "actual_results": self.actual_results,
                    "combination_type": self.specification["combination_type"],
                    "double_games": self.specification["double_games"],
                    "triple_games": self.specification["triple_games"],
                    "prize_breakdown": self._format_prize_breakdown(prize_level_wins, prize_level_payouts),
                    "net_profit": net_profit_loss if net_profit_loss > 0 else 0.0
                }
            }
            
            logger.info(
                f"[SpecificationAnalyzer] Analysis complete - {total_combinations} combinations processed, "
                f"{total_winners} total winners, best match: {best_match_count}"
            )
            
            # Store results
            if self._store_results(summary):
                # Only send notifications if results were stored successfully
                self._send_completion_notifications(summary)
                logger.info(f"[SpecificationAnalyzer] Analysis completed and notifications sent for simulation {self.simulation_id}")
            else:
                logger.error(f"[SpecificationAnalyzer] Analysis completed but results storage failed for simulation {self.simulation_id} - notifications not sent")
                self._update_simulation_status("failed")
                raise Exception("Failed to store simulation results")
            
            return summary
            
        except Exception as e:
            logger.error(f"[SpecificationAnalyzer] Error during analysis: {str(e)}")
            self._update_simulation_status("failed")
            raise

    def _fetch_jackpot_metadata(self) -> Dict[str, Any]:
        """Fetch jackpot metadata containing prize information."""
        response = supabase.table("jackpots").select("metadata").eq("id", self.jackpot_id).single().execute()
        if not response.data or not response.data.get("metadata"):
            raise ValueError(f"No metadata found for jackpot {self.jackpot_id}")
        return response.data["metadata"]

    def _extract_prize_levels(self) -> List[int]:
        """Extract prize levels from jackpot metadata."""
        if "prizes" not in self.jackpot_metadata:
            raise ValueError("No prizes information in jackpot metadata")
        
        prize_levels = []
        for prize_key in self.jackpot_metadata["prizes"].keys():
            # Extract the number from "13/13", "14/14", etc.
            level = int(prize_key.split("/")[0])
            prize_levels.append(level)
        
        return sorted(prize_levels)

    def _calculate_payout(self, matches: int) -> float:
        """Calculate payout for a given number of matches."""
        prize_key = f"{matches}/{self.num_games}"
        if prize_key in self.jackpot_metadata.get("prizes", {}):
            return float(self.jackpot_metadata["prizes"][prize_key])
        return 0.0

    def _format_prize_breakdown(self, wins: Dict[str, int], payouts: Dict[str, float]) -> List[Dict[str, Any]]:
        """Format prize breakdown for display."""
        breakdown = []
        for level in self.prize_levels:
            level_str = str(level)
            if wins[level_str] > 0:
                breakdown.append({
                    "level": f"{level}/{self.num_games}",
                    "matches_required": level,
                    "winning_combinations": wins[level_str],
                    "total_payout": payouts[level_str],
                    "payout_per_winner": payouts[level_str] / wins[level_str] if wins[level_str] > 0 else 0
                })
        return breakdown

    def _generate_combinations(self) -> Iterator[List[str]]:
        """
        Generate all possible combinations from the game selections.
        
        This uses itertools.product to generate combinations on-demand,
        which is much more memory efficient than storing them all.
        """
        # Create list of selections for each game in order
        game_options = []
        for game_num in range(1, self.num_games + 1):
            game_key = str(game_num)
            if game_key in self.game_selections:
                game_options.append(self.game_selections[game_key])
            else:
                # Default to single random prediction if not specified
                game_options.append(["1"])  # Fallback
        
        # Generate all combinations using cartesian product
        for combination in product(*game_options):
            yield list(combination)

    def _count_matches(self, predictions: List[str]) -> int:
        """Count how many predictions match the actual results."""
        return sum(pred == actual for pred, actual in zip(predictions, self.actual_results))

    def _fetch_games_with_results(self) -> List[Dict[str, Any]]:
        """Fetch games with results for the jackpot."""
        response = (
            supabase.table("games")
            .select("id, score_home, score_away")
            .eq("jackpot_id", self.jackpot_id)
            .order("game_order")
            .execute()
        )
        games = response.data or []
        # Keep only games with results
        return [g for g in games if g.get("score_home") is not None and g.get("score_away") is not None]

    @staticmethod
    def _determine_result(game_row: Dict[str, Any]) -> str:
        """Convert game scores to 1/X/2 result."""
        home = int(game_row["score_home"])
        away = int(game_row["score_away"])
        if home > away:
            return "1"
        elif home < away:
            return "2"
        else:
            return "X"

    def _store_results(self, summary: Dict[str, Any]) -> bool:
        """Store analysis results in the database."""
        try:
            logger.info(f"[SpecificationAnalyzer] Storing results for simulation {self.simulation_id}")
            logger.debug(f"[SpecificationAnalyzer] Summary data structure: {summary}")
            
            response = supabase.table("simulation_results").upsert(summary, on_conflict="simulation_id").execute()
            
            if not response.data:
                logger.error(f"[SpecificationAnalyzer] Failed to store results for simulation {self.simulation_id} - no data returned")
                return False
            else:
                logger.info(f"[SpecificationAnalyzer] Results stored successfully for simulation {self.simulation_id}")
                return True
                
        except Exception as e:
            logger.error(f"[SpecificationAnalyzer] Error storing results: {str(e)}")
            return False

    def _update_simulation_status(self, status: str) -> None:
        """Update simulation status in the database."""
        try:
            supabase.table("simulations").update({"status": status}).eq("id", self.simulation_id).execute()
        except Exception as e:
            logger.error(f"[SpecificationAnalyzer] Error updating simulation status: {str(e)}")

    def _send_completion_notifications(self, summary: Dict[str, Any]) -> None:
        """Send completion notifications via email and in-app."""
        try:
            # Get simulation details for notifications
            sim_response = supabase.table("simulations").select(
                "user_id, name"
            ).eq("id", self.simulation_id).single().execute()
            
            if not sim_response.data:
                logger.error(f"[SpecificationAnalyzer] Could not find simulation {self.simulation_id} for notifications")
                return
            
            user_id = sim_response.data["user_id"]
            simulation_name = sim_response.data["name"]
            
            # Extract notification data
            total_combinations = summary["analysis"]["total_combinations"]
            total_winners = summary["total_winners"]
            total_payout = summary["total_payout"]
            best_match_count = summary["best_match_count"]
            actual_results = summary["analysis"]["actual_results"]
            prize_breakdown = summary["analysis"]["prize_breakdown"]
            
            # Send in-app notification
            try:
                create_simulation_completion_notification(
                    user_id=user_id,
                    simulation_id=self.simulation_id,
                    simulation_name=simulation_name,
                    total_combinations=total_combinations,
                    winning_combinations=total_winners,
                    total_payout=total_payout
                )
                logger.info(f"[SpecificationAnalyzer] Created in-app notification for user {user_id}")
            except Exception as e:
                logger.error(f"[SpecificationAnalyzer] Failed to create in-app notification: {e}")
            
            # Send email notification with prize breakdown
            try:
                email_success = EmailService.send_simulation_completion_email(
                    user_id=user_id,
                    simulation_id=self.simulation_id,
                    simulation_name=simulation_name,
                    total_combinations=total_combinations,
                    winning_combinations=total_winners,
                    win_rate=summary["analysis"]["winning_percentage"],
                    total_payout=total_payout,
                    best_match_count=best_match_count,
                    actual_results=actual_results,
                    prize_breakdown=prize_breakdown  # New parameter for detailed breakdown
                )
                
                if email_success:
                    logger.info(f"[SpecificationAnalyzer] Successfully sent email notification to user {user_id}")
                else:
                    logger.warning(f"[SpecificationAnalyzer] Failed to send email notification to user {user_id}")
                    
            except Exception as e:
                logger.error(f"[SpecificationAnalyzer] Error sending email notification: {e}")
                
        except Exception as e:
            logger.error(f"[SpecificationAnalyzer] Error in notification sending: {e}")

    def get_combination_preview(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get a preview of the first few combinations for debugging/display.
        """
        preview = []
        count = 0
        
        for combination in self._generate_combinations():
            if count >= limit:
                break
                
            matches = self._count_matches(combination)
            is_winner = matches in self.prize_levels
            prize_level = matches if is_winner else None
            payout = self._calculate_payout(matches) if is_winner else 0.0
            
            preview.append({
                "combination_number": count + 1,
                "predictions": combination,
                "matches": matches,
                "is_winner": is_winner,
                "prize_level": f"{prize_level}/{self.num_games}" if prize_level else None,
                "payout": payout
            })
            count += 1
        
        return preview 