import os
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime
from ...config.scraper_config import COMMON_HEADERS, GAMES_API_HEADERS

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
        Extracts details for the target jackpot type (e.g., "17/17").
        """
        print(f"Fetching jackpot prize data from API: {MULTI_JACKPOT_API_URL}")
        try:
            cookies = {cookie.split('=')[0].strip(): cookie.split('=')[1].strip() for cookie in COOKIE_STRING.split(';') if '=' in cookie}
            
            response = requests.get(
                MULTI_JACKPOT_API_URL,
                headers=COMMON_HEADERS,
                # cookies=cookies,
                timeout=15
            )
            response.raise_for_status()
            data = response.json()

            if "jackpotPrizes" in data and "prizes" in data["jackpotPrizes"]:
                # Get the jackpotId from the parent jackpotPrizes object
                jackpot_id = data["jackpotPrizes"].get("jackpotId")
                for prize_info in data["jackpotPrizes"]["prizes"]:
                    if prize_info.get("jackpotType") == self.TARGET_JACKPOT_TYPE:
                        # Determine jackpot date from first event start time
                        date_str = "unknown-date"
                        if "eventsStartTimes" in data and data["eventsStartTimes"]:
                            try:
                                first_ts = data["eventsStartTimes"][0]
                                # Convert ISO string to datetime, handling trailing Z
                                event_dt = datetime.fromisoformat(first_ts.replace("Z", "+00:00"))
                                date_str = event_dt.strftime("%d-%m-%y")
                            except Exception:
                                pass
                        return {
                            "jackpot_id": jackpot_id,
                            "name": f"Mega-Jackpot-{date_str}",
                            "current_amount": float(prize_info.get("prize", 0.0)),
                            "total_matches": self.TARGET_MATCH_COUNT,
                        }
                print(f"Could not find prize data for jackpot type '{self.TARGET_JACKPOT_TYPE}' in API response.")
                return None
            else:
                print("API response did not contain 'jackpotPrizes' or 'prizes' field.")
                return None

        except requests.exceptions.Timeout:
            print(f"API request to {MULTI_JACKPOT_API_URL} timed out.")
        except requests.exceptions.HTTPError as e:
            print(f"API request to {MULTI_JACKPOT_API_URL} failed with HTTPError: {e} - {e.response.text}")
        except requests.exceptions.RequestException as e:
            print(f"API request to {MULTI_JACKPOT_API_URL} failed: {e}")
        except ValueError as e:  # Includes JSONDecodeError
            print(f"Failed to parse API JSON response from {MULTI_JACKPOT_API_URL}: {e}")
        except Exception as e:
            print(f"An unexpected error occurred during jackpot prize fetching: {e}")
        return None

    def _fetch_games_data(self, num_matches_expected: int) -> Optional[List[Dict[str, Any]]]:
        """
        Fetches individual game data from the GAMES_API_URL.
        Filters for the jackpot that matches the num_matches_expected.
        """
        try:
            cookies = {cookie.split('=')[0].strip(): cookie.split('=')[1].strip() for cookie in COOKIE_STRING.split(';') if '=' in cookie}

            response = requests.get(
                GAMES_API_URL,
                headers=GAMES_API_HEADERS,
                cookies=cookies,
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
                    # API returned a single jackpot, but not the one we are looking for.
                    # This case might indicate SportPesa changed the active jackpot offering.
                    pass
            
            # Case 2: API returns a list of jackpots
            elif isinstance(response_data, list):
                for jp_api_item_from_list in response_data:
                    if isinstance(jp_api_item_from_list, dict) and \
                       isinstance(jp_api_item_from_list.get("settings"), dict) and \
                       jp_api_item_from_list["settings"].get("numberOfEvents") == num_matches_expected:
                        target_jackpot_item = jp_api_item_from_list
                        break
                if not target_jackpot_item:
                    # No matching jackpot found in the list from the API.
                    pass
            
            # Case 3: Unexpected API response type
            else:
                print(f"Unexpected API response type: {type(response_data)}. Expected dict or list.")
                return None

            # Process the found jackpot item
            if target_jackpot_item and isinstance(target_jackpot_item.get("events"), list):
                target_jackpot_events = target_jackpot_item["events"]
                formatted_games = []
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
                            "kick_off_time": game_event.get("utcKickOffTime"), # Corrected key
                            "home_team": home_team_name, # Corrected logic
                            "away_team": away_team_name, # Corrected logic
                            "tournament": game_event.get("tournamentName"), # Corrected key
                            "country": game_event.get("countryName"), # Corrected key
                            "odds_home": game_event.get("home"), # Corrected key
                            "odds_draw": game_event.get("draw"), # Corrected key
                            "odds_away": game_event.get("away"), # Corrected key
                            "score_home": game_event.get("score", {}).get("home") if isinstance(game_event.get("score"), dict) else None, # API shows score can be None directly
                            "score_away": game_event.get("score", {}).get("away") if isinstance(game_event.get("score"), dict) else None, # API shows score can be None directly
                            "order": game_event.get("order"),
                            "betting_status": game_event.get("bettingStatus")
                        })
                return formatted_games
            else:
                if not target_jackpot_item:
                    # This case implies no target jackpot was identified from the API response (neither single object nor list match).
                    pass 
                elif not isinstance(target_jackpot_item.get("events"), list):
                    # A jackpot item was found, but it doesn't have the expected 'events' list.
                    # This could be an unexpected API change for the specific jackpot.
                    pass
                return None

        except requests.exceptions.Timeout:
            print(f"API request to {GAMES_API_URL} timed out.")
        except requests.exceptions.HTTPError as e:
            print(f"API request to {GAMES_API_URL} failed with HTTPError: {e} - {e.response.text}")
        except requests.exceptions.RequestException as e:
            print(f"API request to {GAMES_API_URL} failed: {e}")
        except ValueError as e:  # Includes JSONDecodeError
            print(f"Failed to parse API JSON response from {GAMES_API_URL}: {e}")
        except Exception as e:
            print(f"An unexpected error occurred during game data fetching: {e}")
        return None

    def scrape(self) -> Optional[Dict[str, Any]]:
        """
        Orchestrates fetching jackpot prize details and individual game data from their respective APIs.
        Combines the data into a single dictionary.
        """
        jackpot_details = self._fetch_jackpot_prizes()
        
        if not jackpot_details:
            return None

        games_data = self._fetch_games_data(num_matches_expected=jackpot_details["total_matches"])

        if games_data is None:
            jackpot_details["games"] = []
            jackpot_details["api_error_message"] = "Failed to retrieve games or no games available."
        else:
            jackpot_details["games"] = games_data
            jackpot_details["api_error_message"] = None
            
        return jackpot_details

if __name__ == '__main__':
    # This block can be used for direct testing of the scraper.
    # Output is minimal to avoid clutter when used as a module.
    scraper = SportPesaScraper()
    scraped_data = scraper.scrape()

    if scraped_data:
        # Minimal confirmation that data was scraped
        # Detailed data is returned by the scrape() method and handled by the caller (e.g., API endpoint)
        pass # Data was scraped, processing would happen in the calling context
    else:
        # Minimal error indication for direct script run
        pass # Failed to scrape data
