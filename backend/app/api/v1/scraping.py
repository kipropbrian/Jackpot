from fastapi import APIRouter, HTTPException
from ...services.scraper.sportpesa_scraper import SportPesaScraper
from ...config.database import supabase # Import Supabase client
from datetime import datetime, timezone # For timestamp updates

router = APIRouter()

@router.get("/sportpesa", summary="Scrape SportPesa Jackpot Data")
def scrape_sportpesa_jackpot():
    """
    Triggers the SportPesa scraper to fetch the latest jackpot data.
    Returns the scraped data including jackpot details and game events.
    
    Note: This is a synchronous endpoint. FastAPI runs synchronous path 
    operation functions in a separate thread pool.
    """
    try:
        scraper = SportPesaScraper()
        scraped_data = scraper.scrape() # Scraper is synchronous
        print(f"Scraped data: {scraped_data}")
        if scraped_data:
            try:
                # --- Jackpot Data Handling ---
                jackpot_api_id = scraped_data.get("jackpot_id")
                jackpot_name = scraped_data.get("name")
                jackpot_payload = {
                    "jackpot_api_id": jackpot_api_id,
                    "name": jackpot_name,
                    "current_amount": scraped_data.get("current_amount"),
                    "total_matches": scraped_data.get("total_matches"),
                    "scraped_at": datetime.now(timezone.utc).isoformat(),
                }

                # Check if jackpot exists by jackpot_api_id (robust, like simulations.py)
                existing_jackpot_response = supabase.table("jackpots").select("id").eq("jackpot_api_id", jackpot_api_id).execute()

                if existing_jackpot_response is None:
                    raise HTTPException(status_code=500, detail="Supabase select operation returned None (unexpected error)")

                # Handle missing or empty data
                data = existing_jackpot_response.data
                if not data:
                    # No jackpot found, insert new
                    insert_response = supabase.table("jackpots").insert(jackpot_payload).execute()
                    if insert_response is None:
                        raise HTTPException(status_code=500, detail="Supabase insert operation returned None (unexpected error)")
                    if not insert_response.data or not insert_response.data[0].get('id'):
                        raise HTTPException(status_code=500, detail="Failed to insert new jackpot or retrieve its ID from response.")
                    jackpot_db_id = insert_response.data[0]['id']
                elif isinstance(data, list):
                    if len(data) == 1:
                        # Update existing jackpot
                        jackpot_db_id_from_select = data[0]['id']
                        update_response = supabase.table("jackpots").update(jackpot_payload).eq("id", jackpot_db_id_from_select).execute()
                        if update_response is None:
                            raise HTTPException(status_code=500, detail="Supabase update operation returned None unexpectedly.")
                        if not update_response.data:
                            raise HTTPException(status_code=500, detail=f"Failed to update jackpot with ID {jackpot_db_id_from_select} or no data returned from update.")
                        jackpot_db_id = jackpot_db_id_from_select
                    elif len(data) > 1:
                        raise HTTPException(status_code=500, detail=f"Multiple jackpots found with jackpot_api_id '{jackpot_api_id}'. Please resolve duplicates in the database.")
                    else:
                        raise HTTPException(status_code=500, detail="Unexpected empty data list from Supabase select.")
                else:
                    raise HTTPException(status_code=500, detail="Unexpected data format from Supabase select.")

                
                if not jackpot_db_id:
                    # This condition should ideally be caught by the specific errors above
                    raise HTTPException(status_code=500, detail="Failed to obtain valid jackpot ID after database operation.")

                # --- Games Data Handling ---
                games_data = scraped_data.get("games", [])
                if games_data:
                    games_to_upsert = []
                    for game in games_data:
                        games_to_upsert.append({
                            "jackpot_id": jackpot_db_id,
                            "game_api_id": game.get("game_id"),
                            "kick_off_time": game.get("kick_off_time"),
                            "home_team": game.get("home_team"),
                            "away_team": game.get("away_team"),
                            "tournament": game.get("tournament"),
                            "country": game.get("country"),
                            "odds_home": game.get("odds_home"),
                            "odds_draw": game.get("odds_draw"),
                            "odds_away": game.get("odds_away"),
                            "score_home": game.get("score_home"),
                            "score_away": game.get("score_away"),
                            "game_order": game.get("order"),
                            "betting_status": game.get("betting_status"),
                            "updated_at": datetime.now(timezone.utc).isoformat(), # Keep updated_at fresh
                        })
                    
                    if games_to_upsert:
                        games_upsert_response = supabase.table("games").upsert(games_to_upsert, on_conflict="game_api_id").execute()
                        # Optionally, check games_upsert_response for errors

                return {
                    "message": "SportPesa data scraped and saved successfully.",
                    "jackpot_name": jackpot_name,
                    "jackpot_id_db": jackpot_db_id,
                    "games_processed": len(games_data)
                }
            except Exception as db_error:
                # Log db_error details here
                raise HTTPException(status_code=500, detail=f"Database operation failed: {str(db_error)}")
        else:
            raise HTTPException(status_code=404, detail="Failed to scrape SportPesa data or no data found.")
    except Exception as e:
        # Consider adding proper logging for production
        # import logging
        # logging.exception("Error during SportPesa scraping")
        raise HTTPException(status_code=500, detail=f"An error occurred during scraping: {str(e)}")
