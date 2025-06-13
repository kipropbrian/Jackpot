from typing import List, Dict, Any

from app.config.database import supabase


class ResultsAnalyzer:
    """Analyze bet combinations for a simulation against actual game results.

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

    # ---------------------------------------------------------------------
    # Public helpers
    # ---------------------------------------------------------------------
    def analyze(self) -> Dict[str, Any]:
        """Run the full analysis and return a results summary."""
        total_combinations = 0
        winning_combinations = 0
        # Fetch combinations in manageable chunks to avoid exceeding the
        # Supabase 1 MB payload limit.  The default chunk size of 1000 is
        # a good balance between latency and memory usage.
        CHUNK_SIZE = 1000
        next_offset = 0
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
                # Safety: make sure we always compare equal-length lists.
                if len(preds) != self.num_games:
                    continue  # Skip malformed combination.
                if preds == self.actual_results:
                    winning_combinations += 1
            # Prepare next batch.
            next_offset += CHUNK_SIZE
        return {
            "simulation_id": self.simulation_id,
            "total_winning_combinations": winning_combinations,
            "total_payout": 0,
            "net_loss": 0,
            "winning_percentage": round(winning_combinations / total_combinations, 4) if total_combinations else 0,
            "analysis": None,
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _fetch_games_with_results(self) -> List[Dict[str, Any]]:
        """Retrieve finished games (i.e., with recorded scores) for the jackpot.

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
