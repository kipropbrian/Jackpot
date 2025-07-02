#!/usr/bin/env python3
"""
Historical Jackpot Scraper Runner

This script fetches historical jackpots from SportPesa's history API
and saves them to the database. It handles deduplication and maintains
data consistency with the existing schema.

Usage:
    python historical_scraper_runner.py [--pages N] [--page-size N] [--single-jackpot ID]
"""

import sys
import argparse
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

# Add the app directory to Python path
sys.path.append('app')

from app.services.scraper.historical_sportpesa_scraper import HistoricalSportPesaScraper
from app.config.database import supabase

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class HistoricalJackpotDatabaseService:
    """Service to handle saving historical jackpots to the database."""
    
    def __init__(self):
        self.supabase = supabase
    
    def save_historical_jackpot(self, jackpot_data: Dict[str, Any]) -> bool:
        """
        Saves a historical jackpot and its games to the database.
        
        Args:
            jackpot_data: Parsed jackpot data from the scraper
            
        Returns:
            True if successful, False otherwise
        """
        try:
            jackpot_api_id = jackpot_data.get("jackpot_api_id")
            if not jackpot_api_id:
                logger.error("Missing jackpot_api_id in jackpot data")
                return False

            logger.info(f"Saving historical jackpot: {jackpot_api_id}")
            
            # Check if jackpot already exists
            existing_jackpot_response = self.supabase.table("jackpots").select("id").eq("jackpot_api_id", jackpot_api_id).execute()
            
            if existing_jackpot_response is None:
                logger.error("Supabase select operation returned None")
                return False

            # Prepare jackpot payload
            jackpot_payload = {
                "jackpot_api_id": jackpot_api_id,
                "name": jackpot_data.get("name"),
                "current_amount": jackpot_data.get("current_amount"),
                "total_matches": jackpot_data.get("total_matches"),
                "status": jackpot_data.get("status", "completed"),
                "completed_at": jackpot_data.get("completed_at"),
                "metadata": jackpot_data.get("metadata", {}),
                "scraped_at": datetime.now(timezone.utc).isoformat(),
            }

            jackpot_id = None
            
            if existing_jackpot_response.data:
                # Update existing jackpot
                jackpot_id = existing_jackpot_response.data[0]["id"]
                logger.info(f"Updating existing jackpot with ID: {jackpot_id}")
                
                update_response = self.supabase.table("jackpots").update(jackpot_payload).eq("id", jackpot_id).execute()
                if update_response is None or not update_response.data:
                    logger.error(f"Failed to update jackpot {jackpot_api_id}")
                    return False
            else:
                # Insert new jackpot
                logger.info(f"Inserting new jackpot: {jackpot_api_id}")
                
                insert_response = self.supabase.table("jackpots").insert(jackpot_payload).execute()
                if insert_response is None or not insert_response.data:
                    logger.error(f"Failed to insert jackpot {jackpot_api_id}")
                    return False
                    
                jackpot_id = insert_response.data[0]["id"]

            # Save games
            games_data = jackpot_data.get("games", [])
            if games_data:
                success = self._save_games(jackpot_id, games_data)
                if not success:
                    logger.error(f"Failed to save games for jackpot {jackpot_api_id}")
                    return False

            logger.info(f"Successfully saved historical jackpot {jackpot_api_id} with {len(games_data)} games")
            return True

        except Exception as e:
            logger.error(f"Error saving historical jackpot: {e}")
            return False

    def _save_games(self, jackpot_id: str, games_data: List[Dict[str, Any]]) -> bool:
        """
        Saves games for a historical jackpot.
        
        Args:
            jackpot_id: The database ID of the jackpot
            games_data: List of game data to save
            
        Returns:
            True if successful, False otherwise
        """
        try:
            for game in games_data:
                game_api_id = game.get("game_api_id")
                if not game_api_id:
                    logger.warning("Skipping game without game_api_id")
                    continue

                # Check if game already exists
                existing_game_response = self.supabase.table("games").select("id").eq("game_api_id", game_api_id).execute()
                
                if existing_game_response is None:
                    logger.error("Supabase select operation for games returned None")
                    continue

                # Prepare game payload
                game_payload = {
                    "jackpot_id": jackpot_id,
                    "game_api_id": game_api_id,
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
                    "game_order": game.get("game_order"),
                    "betting_status": game.get("betting_status"),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }

                if existing_game_response.data:
                    # Update existing game
                    game_id = existing_game_response.data[0]["id"]
                    update_response = self.supabase.table("games").update(game_payload).eq("id", game_id).execute()
                    if update_response is None or not update_response.data:
                        logger.warning(f"Failed to update game {game_api_id}")
                        continue
                else:
                    # Insert new game
                    game_payload["created_at"] = datetime.now(timezone.utc).isoformat()
                    insert_response = self.supabase.table("games").insert(game_payload).execute()
                    if insert_response is None or not insert_response.data:
                        logger.warning(f"Failed to insert game {game_api_id}")
                        continue

            return True

        except Exception as e:
            logger.error(f"Error saving games: {e}")
            return False

def main():
    """Main function to run the historical scraper."""
    parser = argparse.ArgumentParser(description="Scrape historical jackpots from SportPesa API")
    parser.add_argument("--pages", type=int, default=5, help="Maximum number of pages to fetch (default: 5)")
    parser.add_argument("--page-size", type=int, default=20, help="Number of jackpots per page (default: 20)")
    parser.add_argument("--single-jackpot", type=str, help="Scrape a single jackpot by ID")
    parser.add_argument("--dry-run", action="store_true", help="Parse and log data without saving to database")
    
    args = parser.parse_args()
    
    scraper = HistoricalSportPesaScraper()
    db_service = HistoricalJackpotDatabaseService()
    
    logger.info("Starting historical jackpot scraping process")
    
    if args.single_jackpot:
        # Scrape single jackpot
        logger.info(f"Scraping single jackpot: {args.single_jackpot}")
        jackpot_data = scraper.scrape_single_historical_jackpot(args.single_jackpot)
        
        if jackpot_data:
            if args.dry_run:
                logger.info("DRY RUN - Would save jackpot:")
                logger.info(f"  ID: {jackpot_data.get('jackpot_api_id')}")
                logger.info(f"  Name: {jackpot_data.get('name')}")
                logger.info(f"  Amount: {jackpot_data.get('current_amount')}")
                logger.info(f"  Games: {len(jackpot_data.get('games', []))}")
            else:
                success = db_service.save_historical_jackpot(jackpot_data)
                if success:
                    logger.info(f"Successfully saved jackpot {args.single_jackpot}")
                else:
                    logger.error(f"Failed to save jackpot {args.single_jackpot}")
                    sys.exit(1)
        else:
            logger.error(f"Failed to scrape jackpot {args.single_jackpot}")
            sys.exit(1)
    else:
        # Scrape multiple jackpots
        logger.info(f"Scraping up to {args.pages} pages with {args.page_size} jackpots per page")
        historical_jackpots = scraper.scrape_historical_jackpots(
            max_pages=args.pages,
            page_size=args.page_size
        )
        
        if not historical_jackpots:
            logger.warning("No historical jackpots were scraped")
            return

        logger.info(f"Scraped {len(historical_jackpots)} historical jackpots")
        
        if args.dry_run:
            logger.info("DRY RUN - Would save the following jackpots:")
            for jackpot in historical_jackpots:
                logger.info(f"  {jackpot.get('jackpot_api_id')} - {jackpot.get('name')} - {len(jackpot.get('games', []))} games")
        else:
            # Save to database
            saved_count = 0
            failed_count = 0
            
            for jackpot_data in historical_jackpots:
                success = db_service.save_historical_jackpot(jackpot_data)
                if success:
                    saved_count += 1
                else:
                    failed_count += 1

            logger.info(f"Database save complete: {saved_count} successful, {failed_count} failed")
            
            if failed_count > 0:
                logger.warning(f"Some jackpots failed to save. Check logs for details.")

    logger.info("Historical scraping process completed")

if __name__ == "__main__":
    main() 