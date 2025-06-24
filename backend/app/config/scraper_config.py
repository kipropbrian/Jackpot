# Common headers used across all API requests
COMMON_HEADERS = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'DNT': '1',
    'Pragma': 'no-cache',
    'Referer': 'https://www.ke.sportpesa.com/en/mega-jackpot-pro',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'X-App-Timezone': 'Africa/Nairobi',
    'X-Requested-With': 'XMLHttpRequest',
    'sec-ch-ua': '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"'
}

# Specific headers for the games API - override only what's different from COMMON_HEADERS
GAMES_API_HEADERS = {
    **COMMON_HEADERS,  # Spread all common headers
    'Origin': 'https://jackpot-widget.ke.sportpesa.com',  # Override specific to games API
    'Referer': 'https://jackpot-widget.ke.sportpesa.com/',  # Override specific to games API
    'Sec-Fetch-Site': 'cross-site',  # Override since we're accessing from a different domain
} 