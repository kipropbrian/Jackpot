import requests
from bs4 import BeautifulSoup
from abc import ABC, abstractmethod

class BaseScraper(ABC):
    """
    A base class for web scrapers.
    Provides common functionality for fetching and parsing HTML content.
    """

    def __init__(self, url: str):
        """
        Initializes the scraper with a target URL.

        Args:
            url: The URL of the website to scrape.
        """
        self.url = url
        self.soup = None

    def _fetch_html(self) -> str | None:
        """
        Fetches the HTML content from the scraper's URL.

        Returns:
            The HTML content as a string, or None if an error occurs.
        """
        try:
            response = requests.get(self.url, timeout=10) # Added timeout
            response.raise_for_status()  # Raises an HTTPError for bad responses (4XX or 5XX)
            return response.text
        except requests.exceptions.RequestException as e:
            print(f"Error fetching URL {self.url}: {e}")
            return None

    def _parse_html(self, html_content: str) -> None:
        """
        Parses the HTML content using BeautifulSoup.

        Args:
            html_content: The HTML content string to parse.
        """
        if html_content:
            self.soup = BeautifulSoup(html_content, 'lxml')
        else:
            self.soup = None

    def load_page(self) -> bool:
        """
        Fetches and parses the HTML content of the page.

        Returns:
            True if the page was successfully loaded and parsed, False otherwise.
        """
        html_content = self._fetch_html()
        if html_content:
            self._parse_html(html_content)
            return self.soup is not None
        return False

    @abstractmethod
    def scrape(self):
        """
        Abstract method to be implemented by subclasses.
        This method should contain the specific scraping logic for a website.
        """
        pass

if __name__ == '__main__':
    # Example Usage (won't run directly unless this file is executed as a script)
    class ExampleScraper(BaseScraper):
        def scrape(self):
            if not self.soup:
                print("HTML not loaded. Call load_page() first.")
                return None
            
            title_tag = self.soup.find('title')
            if title_tag:
                print(f"Page Title: {title_tag.string}")
                return title_tag.string
            else:
                print("No title tag found.")
                return None

    # Test with a known website (replace with a real URL for actual testing)
    # This is just for illustrative purposes and won't be hit during normal app execution.
    test_scraper = ExampleScraper("http://example.com")
    if test_scraper.load_page():
        test_scraper.scrape()
    else:
        print("Failed to load page for example scraper.")
