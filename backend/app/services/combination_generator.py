import random
import time
from typing import List, Dict, Any
from app.config.database import supabase
from app.services.results_analyzer import ResultsAnalyzer
from datetime import datetime

class CombinationGenerator:
    """
    Generates unique bet combinations for a simulation, tied to a specific jackpot's games.
    Inserts combinations in batches and updates simulation progress.
    """
    def __init__(self, simulation_id: str, jackpot_id: str, total_combinations: int, batch_size: int = 100):
        self.simulation_id = simulation_id
        self.jackpot_id = jackpot_id
        self.total_combinations = total_combinations
        self.batch_size = batch_size
        self.predictions = ["1", "X", "2"]
        self.games = self._fetch_jackpot_games()
        self.num_games = len(self.games)
        self.supabase = supabase
        self.max_retries = 3
        self.retry_delay = 1  # seconds

    def _fetch_jackpot_games(self) -> List[Dict[str, Any]]:
        # Fetch games for the given jackpot_id from the database
        response = supabase.table("games").select("*").eq("jackpot_id", self.jackpot_id).order("game_order").execute()
        return response.data or []

    def generate_unique_combinations(self) -> None:
        if not self.games:
            raise ValueError("No games found for jackpot_id {}".format(self.jackpot_id))
        unique_combos = set()
        combos_to_insert = []
        inserted = 0
        
        try:
            while len(unique_combos) < self.total_combinations:
                combo = tuple(random.choices(self.predictions, k=self.num_games))
                if combo in unique_combos:
                    continue
                unique_combos.add(combo)
                combos_to_insert.append({
                    "simulation_id": self.simulation_id,
                    "predictions": list(combo),
                    "combination_number": len(unique_combos) + 1
                })
                if len(combos_to_insert) >= self.batch_size:
                    self._insert_combinations_with_retry(combos_to_insert)
                    inserted += len(combos_to_insert)
                    combos_to_insert.clear()
                    self._update_progress(inserted)
            
            # Insert any remaining combos
            if combos_to_insert:
                self._insert_combinations_with_retry(combos_to_insert)
                inserted += len(combos_to_insert)
                self._update_progress(inserted)
            
            # Mark as complete
            self._update_progress(inserted, complete=True)
            
        except Exception as e:
            # If something goes wrong, mark the simulation as failed
            self._update_status("failed", str(e))
            raise

    def _insert_combinations_with_retry(self, combos: List[Dict[str, Any]]) -> None:
        """Insert combinations with retry logic for handling timeouts."""
        retries = 0
        while retries < self.max_retries:
            try:
                # Split into smaller chunks if needed
                chunk_size = min(len(combos), self.batch_size)
                for i in range(0, len(combos), chunk_size):
                    chunk = combos[i:i + chunk_size]
                    self.supabase.table("bet_combinations").insert(chunk).execute()
                return
            except Exception as e:
                retries += 1
                if retries == self.max_retries:
                    raise
                time.sleep(self.retry_delay * retries)  # Exponential backoff

    def _update_progress(self, inserted_count: int, complete: bool = False) -> None:
        """Update the progress of the simulation in the database."""
        progress = min(round((inserted_count / self.total_combinations) * 100), 100)
        
        update_data = {
            "progress": progress,
            "status": "completed" if complete else "running"
        }
        
        if complete:
            update_data["completed_at"] = datetime.now().isoformat()
        
        self.supabase.table("simulations").update(update_data).eq("id", self.simulation_id).execute()

    def _update_status(self, status: str, error_message: str = None) -> None:
        """Update the simulation status and error message if any."""
        update_data = {
            "status": status
        }
        if error_message:
            update_data["error_message"] = error_message
        
        self.supabase.table("simulations").update(update_data).eq("id", self.simulation_id).execute()
