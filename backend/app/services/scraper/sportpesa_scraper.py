import os
import requests
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from ...config.scraper_config import COMMON_HEADERS, GAMES_API_HEADERS

# Configure module logger
logger = logging.getLogger(__name__)

# API URLs from environment variables
MULTI_JACKPOT_API_URL = os.getenv("SPORTPESA_MULTI_JACKPOT_API_URL")
if not MULTI_JACKPOT_API_URL:
    raise ValueError("SPORTPESA_MULTI_JACKPOT_API_URL environment variable is not set")

GAMES_API_URL = os.getenv("SPORTPESA_GAMES_API_URL")
if not GAMES_API_URL:
    raise ValueError("SPORTPESA_GAMES_API_URL environment variable is not set")

class SportPesaScraper:
    """
    A scraper specifically designed to extract jackpot information from SportPesa APIs.
    It fetches jackpot prize details and individual game data directly from API endpoints.
    """
    TARGET_JACKPOT_TYPE = "17/17" # For Mega Jackpot Pro 17
    TARGET_MATCH_COUNT = 17

    def __init__(self):
        """
        Initializes the SportPesa API scraper.
        No URL is needed at initialization as API endpoints are fixed.
        """
        pass

    def _fetch_jackpot_prizes(self) -> Optional[Dict[str, Any]]:
        """
        Fetches jackpot prize information from the MULTI_JACKPOT_API_URL.
        Extracts details for all jackpot types and their corresponding prizes.
        """
        logger.info(f"Fetching jackpot prize data from API: {MULTI_JACKPOT_API_URL}")
        try:
            response = requests.get(
                MULTI_JACKPOT_API_URL,
                headers=COMMON_HEADERS,
                timeout=15
            )
            response.raise_for_status()
            data = response.json()

            if not all(key in data for key in ["jackpotPrizes", "jackpotBetAmounts", "currencyExchangeRate"]):
                logger.error("API response missing required fields")
                return None

            jackpot_id = data["jackpotPrizes"].get("jackpotId")
            if not jackpot_id:
                logger.error("No jackpot ID found in response")
                return None

            # Extract currency information
            currency_info = data.get("currencyExchangeRate", {})
            currency = currency_info.get("mainCurrencySign", "KSH")

            # Extract all prize tiers
            prizes_dict = {}
            for prize_info in data["jackpotPrizes"]["prizes"]:
                jackpot_type = prize_info.get("jackpotType")
                prize_amount = float(prize_info.get("prize", 0.0))
                prizes_dict[jackpot_type] = prize_amount

            # Extract bet amounts
            bet_amounts_dict = {}
            for amount_info in data["jackpotBetAmounts"]["amounts"]:
                jackpot_type = amount_info.get("jackpotType")
                amount = float(amount_info.get("amount", 0.0))
                bet_amounts_dict[jackpot_type] = amount

            # We'll get a more robust name when we fetch games data
            # For now, use a temporary name with the jackpot ID
            temp_name = f"Mega-Jackpot-{jackpot_id[:8]}"

            return {
                "jackpot_id": jackpot_id,
                "name": temp_name,  # This will be updated after fetching games
                "current_amount": prizes_dict.get(self.TARGET_JACKPOT_TYPE, 0.0),
                "total_matches": self.TARGET_MATCH_COUNT,
                "currency": currency,
                "prizes": prizes_dict,
                "bet_amounts": bet_amounts_dict,
            }

        except requests.exceptions.Timeout:
            logger.error(f"API request to {MULTI_JACKPOT_API_URL} timed out.")
        except requests.exceptions.HTTPError as e:
            logger.error(f"API request to {MULTI_JACKPOT_API_URL} failed with HTTPError: {e} - {e.response.text}")
        except requests.exceptions.RequestException as e:
            logger.error(f"API request to {MULTI_JACKPOT_API_URL} failed: {e}")
        except ValueError as e:  # Includes JSONDecodeError
            logger.error(f"Failed to parse API JSON response from {MULTI_JACKPOT_API_URL}: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred during jackpot prize fetching: {e}")
        return None

    def _fetch_games_data(self, num_matches_expected: int) -> Optional[Dict[str, Any]]:
        """
        Fetches individual game data from the GAMES_API_URL.
        Filters for the jackpot that matches the num_matches_expected.
        Returns both the games data and jackpot metadata.
        """
        try:
            response = requests.get(
                GAMES_API_URL,
                headers=GAMES_API_HEADERS,
                timeout=15
            )
            response.raise_for_status()
            response_data = response.json()

            target_jackpot_item = None
            num_matches_expected = self.TARGET_MATCH_COUNT

            # Case 1: API returns a single dictionary (the active jackpot)
            if isinstance(response_data, dict):
                if isinstance(response_data.get("settings"), dict) and \
                   response_data["settings"].get("numberOfEvents") == num_matches_expected:
                    target_jackpot_item = response_data
                else:
                    logger.info("API returned a single jackpot, but not the one we are looking for.")
            
            # Case 2: API returns a list of jackpots
            elif isinstance(response_data, list):
                for jp_api_item_from_list in response_data:
                    if isinstance(jp_api_item_from_list, dict) and \
                       isinstance(jp_api_item_from_list.get("settings"), dict) and \
                       jp_api_item_from_list["settings"].get("numberOfEvents") == num_matches_expected:
                        target_jackpot_item = jp_api_item_from_list
                        break
                if not target_jackpot_item:
                    logger.warning("No matching jackpot found in the list from the API.")
            
            # Case 3: Unexpected API response type
            else:
                logger.error(f"Unexpected API response type: {type(response_data)}. Expected dict or list.")
                return None

            # Process the found jackpot item
            if target_jackpot_item and isinstance(target_jackpot_item.get("events"), list):
                target_jackpot_events = target_jackpot_item["events"]
                formatted_games = []

                # Get first game date for jackpot naming
                first_game_date = None
                if target_jackpot_events:
                    try:
                        first_game = target_jackpot_events[0]
                        kickoff_time = first_game.get("utcKickOffTime")
                        if kickoff_time:
                            first_game_date = datetime.fromisoformat(kickoff_time.replace("Z", "+00:00")).strftime("%d-%m-%y")
                    except Exception as e:
                        logger.warning(f"Failed to parse first game date: {e}")

                jackpot_metadata = {
                    "first_game_date": first_game_date,
                    "betting_status": target_jackpot_item.get("bettingStatus"),
                    "jackpot_api_id": target_jackpot_item.get("id")  # Get the ID from the games API
                }

                for game_event in target_jackpot_events:
                    if isinstance(game_event, dict):
                        competitors = game_event.get("competitors", [])
                        home_team_name = None
                        away_team_name = None
                        for comp in competitors:
                            if isinstance(comp, dict):
                                if comp.get("isHome") is True:
                                    home_team_name = comp.get("competitorName")
                                elif comp.get("isHome") is False:
                                    away_team_name = comp.get("competitorName")
                        
                        formatted_games.append({
                            "game_id": game_event.get("id"),
                            "kick_off_time": game_event.get("utcKickOffTime"),
                            "home_team": home_team_name,
                            "away_team": away_team_name,
                            "tournament": game_event.get("tournamentName"),
                            "country": game_event.get("countryName"),
                            "odds_home": game_event.get("home"),
                            "odds_draw": game_event.get("draw"),
                            "odds_away": game_event.get("away"),
                            "score_home": game_event.get("score", {}).get("home") if isinstance(game_event.get("score"), dict) else None,
                            "score_away": game_event.get("score", {}).get("away") if isinstance(game_event.get("score"), dict) else None,
                            "order": game_event.get("order"),
                            "betting_status": game_event.get("bettingStatus")
                        })
                return {"games": formatted_games, "metadata": jackpot_metadata}
            else:
                if not target_jackpot_item:
                    logger.warning("No target jackpot was identified from the API response.")
                elif not isinstance(target_jackpot_item.get("events"), list):
                    logger.error("Found jackpot item does not have the expected 'events' list.")
                return None

        except requests.exceptions.Timeout:
            logger.error(f"API request to {GAMES_API_URL} timed out.")
        except requests.exceptions.HTTPError as e:
            logger.error(f"API request to {GAMES_API_URL} failed with HTTPError: {e} - {e.response.text}")
        except requests.exceptions.RequestException as e:
            logger.error(f"API request to {GAMES_API_URL} failed: {e}")
        except ValueError as e:  # Includes JSONDecodeError
            logger.error(f"Failed to parse API JSON response from {GAMES_API_URL}: {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred during game data fetching: {e}")
        return None

    def scrape(self) -> Optional[Dict[str, Any]]:
        """
        Orchestrates fetching jackpot prize details and individual game data from their respective APIs.
        Combines the data into a single dictionary with comprehensive jackpot information.
        """
        jackpot_details = self._fetch_jackpot_prizes()
        
        if not jackpot_details:
            return None

        games_data = self._fetch_games_data(num_matches_expected=jackpot_details["total_matches"])

        # Get jackpot_api_id - prefer games API, fallback to prizes API
        jackpot_api_id = jackpot_details["jackpot_id"]  # Fallback from prizes API
        betting_status = "open"  # Default status
        first_game_date = None
        games_list = []

        if games_data is not None:
            metadata = games_data["metadata"]
            # Use games API ID if available, otherwise keep the prizes API ID
            if metadata.get("jackpot_api_id"):
                jackpot_api_id = metadata["jackpot_api_id"]
            betting_status = metadata.get("betting_status", "open")
            first_game_date = metadata.get("first_game_date")
            games_list = games_data["games"]
        else:
            logger.warning("Games data not available, using fallback values")

        # Update jackpot name with first game date if available
        if first_game_date:
            jackpot_details["name"] = f"Mega-Jackpot-{first_game_date}"
        # else keep the temporary name from _fetch_jackpot_prizes

        # Structure the response to match database schema
        response = {
            "jackpot_api_id": jackpot_api_id,  # Guaranteed to have a value
            "name": jackpot_details["name"],
            "current_amount": jackpot_details["current_amount"],
            "total_matches": jackpot_details["total_matches"],
            "status": betting_status.lower() if betting_status else "open",
            "games": games_list,
            "metadata": {
                "currency": jackpot_details["currency"],
                "prizes": jackpot_details["prizes"],
                "bet_amounts": jackpot_details["bet_amounts"]
            }
        }
            
        return response

if __name__ == '__main__':
    # This block can be used for direct testing of the scraper.
    scraper = SportPesaScraper()
    scraped_data = scraper.scrape()

    if scraped_data:
        logger.info("Successfully scraped jackpot data.")
    else:
        logger.error("Failed to scrape jackpot data.")
