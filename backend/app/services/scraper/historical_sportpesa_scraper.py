import os
import requests
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from decimal import Decimal

from ...config.scraper_config import COMMON_HEADERS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Historical API endpoints
HISTORY_LIST_URL = "https://jackpot-betslip.ke.sportpesa.com/api/jackpots/history"
HISTORY_DETAILS_URL = "https://jackpot-betslip.ke.sportpesa.com/api/jackpots/history/{jackpot_id}/details"

class HistoricalSportPesaScraper:
    """
    A scraper specifically designed to extract historical jackpot information from SportPesa APIs.
    It fetches completed jackpots with their results and saves them to the database.
    """
    
    def __init__(self):
        """
        Initializes the Historical SportPesa API scraper.
        """
        pass

    def _fetch_jackpot_history_list(self, page_num: int = 0, page_size: int = 20, to_timestamp: int = 1751317199999) -> Optional[List[Dict[str, Any]]]:
        """
        Fetches the list of historical jackpots from the history API.
        
        Args:
            page_num: Page number for pagination (default: 0)
            page_size: Number of results per page (default: 20)
            to_timestamp: End timestamp filter (default: far future)
        
        Returns:
            List of historical jackpot summaries or None if failed
        """
        logger.info(f"Fetching jackpot history list from API (page {page_num}, size {page_size})")
        
        try:
            params = {
                "to": to_timestamp,
                "pageNum": page_num,
                "pageSize": page_size
            }
            
            response = requests.get(
                HISTORY_LIST_URL,
                headers=COMMON_HEADERS,
                params=params,
                timeout=15
            )
            response.raise_for_status()
            data = response.json()
            
            if not isinstance(data, list):
                logger.error(f"Expected list response, got {type(data)}")
                return None
                
            logger.info(f"Successfully fetched {len(data)} historical jackpots")
            return data

        except requests.exceptions.Timeout:
            logger.error(f"API request to {HISTORY_LIST_URL} timed out.")
        except requests.exceptions.HTTPError as e:
            logger.error(f"API request to {HISTORY_LIST_URL} failed with HTTPError: {e} - {e.response.text}")
        except requests.exceptions.RequestException as e:
            logger.error(f"API request to {HISTORY_LIST_URL} failed: {e}")
        except ValueError as e:  # Includes JSONDecodeError
            logger.error(f"Failed to parse API JSON response from {HISTORY_LIST_URL}: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred during history list fetching: {e}")
        
        return None

    def _fetch_jackpot_details(self, jackpot_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches detailed information for a specific historical jackpot.
        
        Args:
            jackpot_id: The jackpot ID to fetch details for
            
        Returns:
            Detailed jackpot information or None if failed
        """
        details_url = HISTORY_DETAILS_URL.format(jackpot_id=jackpot_id)
        logger.info(f"Fetching jackpot details for ID: {jackpot_id}")
        
        try:
            response = requests.get(
                details_url,
                headers=COMMON_HEADERS,
                timeout=15
            )
            response.raise_for_status()
            data = response.json()
            
            if not isinstance(data, dict):
                logger.error(f"Expected dict response, got {type(data)}")
                return None
                
            logger.info(f"Successfully fetched details for jackpot {jackpot_id}")
            return data

        except requests.exceptions.Timeout:
            logger.error(f"API request to {details_url} timed out.")
        except requests.exceptions.HTTPError as e:
            logger.error(f"API request to {details_url} failed with HTTPError: {e} - {e.response.text}")
        except requests.exceptions.RequestException as e:
            logger.error(f"API request to {details_url} failed: {e}")
        except ValueError as e:  # Includes JSONDecodeError
            logger.error(f"Failed to parse API JSON response from {details_url}: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred during details fetching: {e}")
        
        return None

    def _parse_historical_jackpot(self, history_item: Dict[str, Any], details: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Parses historical jackpot data into the format expected by the database.
        
        Args:
            history_item: Summary data from history list API
            details: Detailed data from details API
            
        Returns:
            Parsed jackpot data or None if parsing failed
        """
        try:
            # Extract basic jackpot information
            jackpot_id = history_item.get("jackpotId")
            jackpot_human_id = history_item.get("jackpotHumanId")
            finished_date = history_item.get("finished")
            
            if not jackpot_id:
                logger.error("No jackpot ID found in history item")
                return None

            # Parse finished date
            completed_at = None
            if finished_date:
                try:
                    completed_at = datetime.fromisoformat(finished_date.replace("Z", "+00:00"))
                except Exception as e:
                    logger.warning(f"Failed to parse finished date {finished_date}: {e}")

            # Extract currency from details
            currency = details.get("currencySign", "KSH")
            
            # Find the main jackpot prize (17/17)
            prizes = details.get("prizes", [])
            main_prize = 0.0
            prizes_dict = {}
            
            for prize in prizes:
                jackpot_type = prize.get("jackpotType")
                prize_amount = float(prize.get("prize", 0.0))
                if jackpot_type:
                    prizes_dict[jackpot_type] = prize_amount
                    if jackpot_type == "17/17":
                        main_prize = prize_amount

            # Parse events/games
            events = details.get("events", [])
            total_matches = len(events)
            
            # Create jackpot name based on human ID and completion date
            jackpot_name = f"Mega-Jackpot-{jackpot_human_id}"
            if completed_at:
                jackpot_name = f"Mega-Jackpot-{completed_at.strftime('%d-%m-%y')}-#{jackpot_human_id}"

            # Process games
            formatted_games = []
            for event in events:
                # Parse kickoff time
                kickoff_time = None
                if event.get("kickoffTime"):
                    try:
                        kickoff_time = datetime.fromisoformat(event["kickoffTime"].replace("Z", "+00:00"))
                    except Exception as e:
                        logger.warning(f"Failed to parse kickoff time {event.get('kickoffTime')}: {e}")

                # Parse score
                score_home = None
                score_away = None
                score_str = event.get("score", "")
                if score_str and ":" in score_str:
                    try:
                        parts = score_str.split(":")
                        score_home = int(parts[0])
                        score_away = int(parts[1])
                    except Exception as e:
                        logger.warning(f"Failed to parse score {score_str}: {e}")

                formatted_games.append({
                    "game_api_id": f"{jackpot_id}_event_{event.get('eventNumber', 0)}",  # Create unique game ID
                    "kick_off_time": kickoff_time.isoformat() if kickoff_time else None,
                    "home_team": event.get("competitorHome"),
                    "away_team": event.get("competitorAway"),
                    "tournament": None,  # Not available in historical data
                    "country": None,     # Not available in historical data
                    "odds_home": None,   # Not available for historical data
                    "odds_draw": None,   # Not available for historical data
                    "odds_away": None,   # Not available for historical data
                    "score_home": score_home,
                    "score_away": score_away,
                    "game_order": event.get("eventNumber"),
                    "betting_status": "closed",  # Historical games are always closed
                    "result_pick": event.get("resultPick")  # Additional field for historical data
                })

            # Create metadata
            metadata = {
                "currency": currency,
                "prizes": prizes_dict,
                "betting_status": "closed",
                "jackpot_human_id": jackpot_human_id,
                "winning_distribution": details.get("winningDistribution", []),
                "is_historical": True
            }

            # Structure the response to match database schema
            response = {
                "jackpot_api_id": jackpot_id,
                "name": jackpot_name,
                "current_amount": main_prize,
                "total_matches": total_matches,
                "status": "completed",
                "completed_at": completed_at.isoformat() if completed_at else None,
                "games": formatted_games,
                "metadata": metadata
            }
            
            return response

        except Exception as e:
            logger.error(f"Failed to parse historical jackpot data: {e}")
            return None

    def scrape_historical_jackpots(self, max_pages: int = 5, page_size: int = 20) -> List[Dict[str, Any]]:
        """
        Scrapes historical jackpots from SportPesa API.
        
        Args:
            max_pages: Maximum number of pages to fetch (default: 5)
            page_size: Number of jackpots per page (default: 20)
            
        Returns:
            List of parsed historical jackpots
        """
        historical_jackpots = []
        
        for page_num in range(max_pages):
            logger.info(f"Processing page {page_num + 1} of {max_pages}")
            
            # Fetch history list for this page
            history_list = self._fetch_jackpot_history_list(
                page_num=page_num, 
                page_size=page_size
            )
            
            if not history_list:
                logger.warning(f"No data returned for page {page_num}, stopping pagination")
                break
                
            if len(history_list) == 0:
                logger.info(f"Empty page {page_num}, reached end of data")
                break

            # Process each jackpot in the page
            for history_item in history_list:
                jackpot_id = history_item.get("jackpotId")
                if not jackpot_id:
                    logger.warning("History item missing jackpotId, skipping")
                    continue

                # Fetch detailed information
                details = self._fetch_jackpot_details(jackpot_id)
                if not details:
                    logger.warning(f"Failed to fetch details for jackpot {jackpot_id}, skipping")
                    continue

                # Parse the data
                parsed_jackpot = self._parse_historical_jackpot(history_item, details)
                if parsed_jackpot:
                    historical_jackpots.append(parsed_jackpot)
                    logger.info(f"Successfully parsed jackpot {jackpot_id}")
                else:
                    logger.warning(f"Failed to parse jackpot {jackpot_id}")

        logger.info(f"Completed scraping. Total historical jackpots processed: {len(historical_jackpots)}")
        return historical_jackpots

    def scrape_single_historical_jackpot(self, jackpot_id: str) -> Optional[Dict[str, Any]]:
        """
        Scrapes a single historical jackpot by ID.
        
        Args:
            jackpot_id: The specific jackpot ID to fetch
            
        Returns:
            Parsed jackpot data or None if failed
        """
        logger.info(f"Scraping single historical jackpot: {jackpot_id}")
        
        # Fetch detailed information
        details = self._fetch_jackpot_details(jackpot_id)
        if not details:
            logger.error(f"Failed to fetch details for jackpot {jackpot_id}")
            return None

        # Create a minimal history item from the details
        history_item = {
            "jackpotId": details.get("jackpotId"),
            "jackpotHumanId": details.get("jackpotHumanId"),
            "jackpotStatus": details.get("jackpotStatus"),
            "finished": details.get("finished")
        }

        # Parse the data
        parsed_jackpot = self._parse_historical_jackpot(history_item, details)
        if parsed_jackpot:
            logger.info(f"Successfully parsed single jackpot {jackpot_id}")
        else:
            logger.error(f"Failed to parse single jackpot {jackpot_id}")
            
        return parsed_jackpot 