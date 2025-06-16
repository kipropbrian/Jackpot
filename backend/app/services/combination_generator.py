import random
from typing import List, Dict, Any
from app.config.database import supabase
from app.services.results_analyzer import ResultsAnalyzer

class CombinationGenerator:
    """
    Generates unique bet combinations for a simulation, tied to a specific jackpot's games.
    Inserts combinations in batches and updates simulation progress.
    """
    def __init__(self, simulation_id: str, jackpot_id: str, total_combinations: int, batch_size: int = 500):
        self.simulation_id = simulation_id
        self.jackpot_id = jackpot_id
        self.total_combinations = total_combinations
        self.batch_size = batch_size
        self.predictions = ["1", "X", "2"]
        self.games = self._fetch_jackpot_games()
        self.num_games = len(self.games)

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
                self._insert_combinations(combos_to_insert)
                inserted += len(combos_to_insert)
                combos_to_insert.clear()
                self._update_progress(inserted)
        # Insert any remaining combos
        if combos_to_insert:
            self._insert_combinations(combos_to_insert)
            inserted += len(combos_to_insert)
            self._update_progress(inserted)
        # Mark as complete
        self._update_progress(inserted, complete=True)

    def _insert_combinations(self, combos: List[Dict[str, Any]]):
        # Insert batch into bet_combinations table
        supabase.table("bet_combinations").insert(combos).execute()

    def _update_progress(self, inserted: int, complete: bool = False):
        # Count total inserted combinations for this simulation
        response = supabase.table("bet_combinations").select("id", count='exact').eq("simulation_id", self.simulation_id).execute()
        total_inserted = response.count if hasattr(response, 'count') else None
        print(f"[CombinationGenerator] Inserted so far: {total_inserted}")
        # Update simulation progress in the database
        progress = int(inserted / self.total_combinations * 100)
        status = "completed" if complete else "generating"
        # Update simulation row
        supabase.table("simulations").update({
            "progress": progress,
            "status": status
        }).eq("id", self.simulation_id).execute()

        # If we've just marked simulation completed, and the jackpot is also completed, run results analysis inline.
        if complete:
            jp_resp = supabase.table("jackpots").select("status").eq("id", self.jackpot_id).single().execute()
            if jp_resp.data and jp_resp.data.get("status") == "completed":
                summary = ResultsAnalyzer(self.simulation_id, self.jackpot_id).analyze()
                # Upsert so reruns are safe
                supabase.table("simulation_results").upsert(summary, on_conflict="simulation_id").execute()
