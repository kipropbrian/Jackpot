#!/usr/bin/env python3
"""
Test script for the Historical SportPesa Scraper

This script tests the historical scraper functionality without saving to the database.
It's useful for debugging and verifying the API integration and data parsing.

Usage:
    python test_historical_scraper.py
"""

import sys
import json
import logging

# Add the app directory to Python path
sys.path.append('app')

from app.services.scraper.historical_sportpesa_scraper import HistoricalSportPesaScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_single_jackpot():
    """Test scraping a single historical jackpot."""
    logger.info("Testing single historical jackpot scraping")
    
    scraper = HistoricalSportPesaScraper()
    
    # Use the jackpot ID from the example you provided
    test_jackpot_id = "961e9267-a47f-4bc9-9788-d17908f52d0c"
    
    result = scraper.scrape_single_historical_jackpot(test_jackpot_id)
    
    if result:
        logger.info("Successfully scraped single jackpot:")
        logger.info(f"  ID: {result.get('jackpot_api_id')}")
        logger.info(f"  Name: {result.get('name')}")
        logger.info(f"  Amount: {result.get('current_amount')}")
        logger.info(f"  Status: {result.get('status')}")
        logger.info(f"  Total matches: {result.get('total_matches')}")
        logger.info(f"  Games count: {len(result.get('games', []))}")
        logger.info(f"  Completed at: {result.get('completed_at')}")
        
        # Show first game as example
        games = result.get('games', [])
        if games:
            first_game = games[0]
            logger.info("  First game:")
            logger.info(f"    {first_game.get('home_team')} vs {first_game.get('away_team')}")
            logger.info(f"    Score: {first_game.get('score_home')}-{first_game.get('score_away')}")
            logger.info(f"    Result Pick: {first_game.get('result_pick')}")
        
        # Show metadata
        metadata = result.get('metadata', {})
        logger.info(f"  Currency: {metadata.get('currency')}")
        logger.info(f"  Is Historical: {metadata.get('is_historical')}")
        
        return True
    else:
        logger.error("Failed to scrape single jackpot")
        return False

def test_history_list():
    """Test fetching the history list."""
    logger.info("Testing history list fetching")
    
    scraper = HistoricalSportPesaScraper()
    
    # Test fetching just one page with a small page size
    history_list = scraper._fetch_jackpot_history_list(page_num=0, page_size=5)
    
    if history_list:
        logger.info(f"Successfully fetched {len(history_list)} historical jackpots")
        for i, item in enumerate(history_list):
            logger.info(f"  {i+1}. ID: {item.get('jackpotId')}, Human ID: {item.get('jackpotHumanId')}, Status: {item.get('jackpotStatus')}")
        return True
    else:
        logger.error("Failed to fetch history list")
        return False

def test_multiple_jackpots():
    """Test scraping multiple historical jackpots."""
    logger.info("Testing multiple historical jackpots scraping")
    
    scraper = HistoricalSportPesaScraper()
    
    # Scrape just 1 page with 3 jackpots for testing
    results = scraper.scrape_historical_jackpots(max_pages=1, page_size=3)
    
    if results:
        logger.info(f"Successfully scraped {len(results)} historical jackpots")
        for i, jackpot in enumerate(results):
            logger.info(f"  {i+1}. {jackpot.get('jackpot_api_id')} - {jackpot.get('name')}")
            logger.info(f"      Amount: {jackpot.get('current_amount')}, Games: {len(jackpot.get('games', []))}")
        return True
    else:
        logger.error("Failed to scrape multiple jackpots")
        return False

def main():
    """Main test function."""
    logger.info("Starting Historical SportPesa Scraper tests")
    
    tests = [
        ("History List", test_history_list),
        ("Single Jackpot", test_single_jackpot),
        ("Multiple Jackpots", test_multiple_jackpots),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        logger.info(f"\n{'='*50}")
        logger.info(f"Running test: {test_name}")
        logger.info(f"{'='*50}")
        
        try:
            if test_func():
                logger.info(f"✅ {test_name} PASSED")
                passed += 1
            else:
                logger.error(f"❌ {test_name} FAILED")
                failed += 1
        except Exception as e:
            logger.error(f"❌ {test_name} FAILED with exception: {e}")
            failed += 1
    
    logger.info(f"\n{'='*50}")
    logger.info(f"Test Results: {passed} passed, {failed} failed")
    logger.info(f"{'='*50}")
    
    if failed > 0:
        sys.exit(1)
    else:
        logger.info("All tests passed! ✅")

if __name__ == "__main__":
    main() 