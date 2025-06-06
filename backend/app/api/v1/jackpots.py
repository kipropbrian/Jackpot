from fastapi import APIRouter, HTTPException
from ...config.database import supabase

router = APIRouter()

@router.get("/", summary="List all jackpots with their games")
def list_jackpots_with_games():
    try:
        # Fetch all jackpots
        jackpots_resp = supabase.table("jackpots").select("*").order("scraped_at", desc=True).execute()
        if jackpots_resp is None or not jackpots_resp.data:
            return []
        jackpots = jackpots_resp.data
        # For each jackpot, fetch its games
        for jackpot in jackpots:
            games_resp = supabase.table("games").select("*").eq("jackpot_id", jackpot["id"]).order("game_order").execute()
            jackpot["games"] = games_resp.data if games_resp and games_resp.data else []
        return jackpots
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch jackpots: {str(e)}")
