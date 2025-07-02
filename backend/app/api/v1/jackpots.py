from fastapi import APIRouter, HTTPException
from ...config.database import supabase

router = APIRouter()

@router.get("/", summary="List all jackpots with their games")
def list_jackpots_with_games():
    try:
        # Fetch all jackpots, ordered by completion date desc, limited to 5
        jackpots_resp = supabase.table("jackpots").select("*").order("completed_at", desc=True).limit(5).execute()
        if jackpots_resp is None or not jackpots_resp.data:
            return []
        return jackpots_resp.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch jackpots: {str(e)}")


# -------------------------------------------------------------------
# Single jackpot endpoint
# -------------------------------------------------------------------


@router.get("/{jackpot_id}", summary="Get a single jackpot with its games")
def get_jackpot(jackpot_id: str):
    try:
        jp_resp = supabase.table("jackpots").select("*").eq("id", jackpot_id).single().execute()
        if jp_resp is None or jp_resp.data is None:
            raise HTTPException(status_code=404, detail="Jackpot not found")
        jackpot = jp_resp.data
        games_resp = (
            supabase.table("games")
            .select("*")
            .eq("jackpot_id", jackpot["id"])
            .order("game_order")
            .execute()
        )
        jackpot["games"] = games_resp.data if games_resp and games_resp.data else []
        return jackpot
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch jackpot: {str(e)}")
