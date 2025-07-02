from fastapi import APIRouter, HTTPException
import logging
from ...services.scraper.sportpesa_scraper import SportPesaScraper
from ...config.database import supabase # Import Supabase client
from datetime import datetime, timezone # For timestamp updates

# Configure logger for this module
logger = logging.getLogger(__name__)

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

        # Log the scraped data for debugging
        if scraped_data:
            logger.info(f"Successfully scraped jackpot data: {scraped_data.get('name', 'Unknown')} with {len(scraped_data.get('games', []))} games")
            logger.debug(f"Full scraped data: {scraped_data}")
        else:
            logger.info("No data to update - jackpot may be complete")
            # Check if it was because the jackpot is complete
            if hasattr(scraper, 'last_checked_jackpot_id'):
                return {
                    "message": f"Jackpot {scraper.last_checked_jackpot_id} is already complete, no update needed.",
                    "status": "skipped"
                }
            else:
                logger.error("Scraper returned no data")
                raise HTTPException(status_code=404, detail="Failed to scrape SportPesa data or no data found.")

        if scraped_data:
            try:
                # --- Jackpot Data Handling ---
                jackpot_api_id = scraped_data.get("jackpot_api_id")  # Updated field name
                jackpot_name = scraped_data.get("name")
                jackpot_payload = {
                    "jackpot_api_id": jackpot_api_id,
                    "name": jackpot_name,
                    "current_amount": scraped_data.get("current_amount"),
                    "total_matches": scraped_data.get("total_matches"),
                    # Status is managed by database trigger, not overridden by scraper
                    "metadata": scraped_data.get("metadata", {}),  # Add metadata field
                    "scraped_at": datetime.now(timezone.utc).isoformat(),
                }

                logger.info(f"Processing jackpot with API ID: {jackpot_api_id}")

                # Check if jackpot exists by jackpot_api_id (robust, like simulations.py)
                existing_jackpot_response = supabase.table("jackpots").select("id").eq("jackpot_api_id", jackpot_api_id).execute()

                if existing_jackpot_response is None:
                    raise HTTPException(status_code=500, detail="Supabase select operation returned None (unexpected error)")

                # Handle missing or empty data
                data = existing_jackpot_response.data
                if not data:
                    # No jackpot found, insert new
                    logger.info(f"Inserting new jackpot: {jackpot_name}")
                    insert_response = supabase.table("jackpots").insert(jackpot_payload).execute()
                    if insert_response is None:
                        raise HTTPException(status_code=500, detail="Supabase insert operation returned None (unexpected error)")
                    if not insert_response.data or not insert_response.data[0].get('id'):
                        raise HTTPException(status_code=500, detail="Failed to insert new jackpot or retrieve its ID from response.")
                    jackpot_db_id = insert_response.data[0]['id']
                    logger.info(f"Successfully inserted jackpot with DB ID: {jackpot_db_id}")
                elif isinstance(data, list):
                    if len(data) == 1:
                        # Update existing jackpot
                        jackpot_db_id_from_select = data[0]['id']
                        logger.info(f"Updating existing jackpot with DB ID: {jackpot_db_id_from_select}")
                        update_response = supabase.table("jackpots").update(jackpot_payload).eq("id", jackpot_db_id_from_select).execute()
                        if update_response is None:
                            raise HTTPException(status_code=500, detail="Supabase update operation returned None unexpectedly.")
                        if not update_response.data:
                            raise HTTPException(status_code=500, detail=f"Failed to update jackpot with ID {jackpot_db_id_from_select} or no data returned from update.")
                        jackpot_db_id = jackpot_db_id_from_select
                        logger.info(f"Successfully updated jackpot with DB ID: {jackpot_db_id}")
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
                logger.info(f"Processing {len(games_data)} games for jackpot {jackpot_name}")
                
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
                        logger.info(f"Upserting {len(games_to_upsert)} games")
                        games_upsert_response = supabase.table("games").upsert(games_to_upsert, on_conflict="game_api_id").execute()
                        if games_upsert_response and games_upsert_response.data:
                            logger.info(f"Successfully upserted {len(games_upsert_response.data)} games")
                        # Optionally, check games_upsert_response for errors

                return {
                    "message": "SportPesa data scraped and saved successfully.",
                    "jackpot_name": jackpot_name,
                    "jackpot_id_db": jackpot_db_id,
                    "games_processed": len(games_data)
                }
            except Exception as db_error:
                # Log db_error details here
                logger.error(f"Database operation failed: {str(db_error)}", exc_info=True)
                raise HTTPException(status_code=500, detail=f"Database operation failed: {str(db_error)}")
        else:
            raise HTTPException(status_code=404, detail="Failed to scrape SportPesa data or no data found.")
    except Exception as e:
        # Log the error with full traceback
        logger.error(f"Error during SportPesa scraping: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred during scraping: {str(e)}")
