"""
This module contains a test script for web scraping using Playwright.
It's specifically designed for exploring new media sources and gathering HTML content
to identify the relevant tags needed for proper scraping configuration.

USE CASE:
- Run this script to test scraping of a new media source
- Examine the saved HTML files in the output directory
- Identify the proper tag selectors for the specific media structure
- Update the MediaMap object with the correct tags for production use

+++++++++++++++++++++++++++++++++++++++++++++++++++++++

- ONCE THE TESTING IS DONE, add the new media source to the MEDIAS_MAPPING in medias_info_scrapper.py 
and to _MEDIAS_INFO_LIST in medias_info_db.py file in media_sources directory

- UPDATE THE DATABASE with the new media source as well in the init_db.py file

++++++++++++++++++++++++++++++++++++++++++++++++++++++++

"""

import asyncio
from playwright.async_api import async_playwright, BrowserContext
from services.scrapper import (
    get_main_hrefs,
    html_string_to_file,
)
from media_sources.medias_map_scrapper import MediaMap, LocateTags
from services.main_service import fetch_page_content
from utils.utils import check_href, clean_href


# Configuration values for testing
# Adjust these values to control how many pages to analyze
NUM_HREFS = 10  # Number of links to collect from the main page
NUM_ANALYSIS = 5  # Number of article pages to actually download for analysis


async def main_loop(context: BrowserContext, url: str, media: MediaMap):
    """
    Main loop to scrape the media content.
    This function fetches the main page, extracts article links, and then
    downloads a sample of article pages for analysis.
    
    Args:
        context (BrowserContext): The browser context to use for navigation
        url (str): The URL of the main page to analyze
        media (MediaMap): Test configuration with selectors to try for this media
    """
    try:
        print(f"Analyzing media -- {url}\n")
        content = await fetch_page_content(context, url)
        html_string_to_file(content, url)
        
        # Extract links from the main page using the provided selector configuration
        urls = get_main_hrefs(content, media.locate_main_hrefs)
        
        print(f"Found {len(urls)} URLs on the main page.\n")
        
        href_set = set()

        # Take the first n urls (supposed to be the main articles because they're typically at the top)
        for i, a in enumerate(urls):
            href = str(a["href"])
            if check_href(href, media):
                href_set.add(clean_href(url, href))
            if len(href_set) >= NUM_HREFS:
                break
        print(f"Valid URLs -- {len(href_set)} - {href_set}\n")

        success_count = 0

        # Download a sample of article pages for offline analysis
        for i, href in enumerate(href_set):
            try:
                print(f"Processing article URL {i + 1}/{len(href_set)}: {href}\n")
                data = await fetch_page_content(context, href)
                html_string_to_file(data, href)
                success_count += 1
            except Exception as e:
                print(f"Error processing URL {href}: {e}")
                continue
            if success_count >= NUM_ANALYSIS:
                break
            
    except Exception as e:
        print(f"Error in main loop: {e}")


async def run_test():
    """
    Main function to initiate the test web scraping process.
    
    This function:
    1. Sets up the Playwright browser context
    2. Configures a test media source to analyze
    3. Runs the scraping process to collect sample HTML files
    
    After running this test, examine the saved HTML files to identify
    the correct selector patterns for the media source's structure.
    Update the MediaMap object with these selectors for production use.
    """
    print("Media test scraping started...")

    # MODIFY THIS SECTION FOR TESTING
    # TEST CONFIGURATION - Modify these values for the media source you're analyzing
    URL_TO_TEST = "https://www.foxnews.com/world"
    # Initial test selectors - these might need adjustment after examining the HTML
    MEDIA_DATA_TEST = MediaMap(
        # Selector for finding article links on the main page
        locate_main_hrefs=LocateTags(tag="main", class_="main-content"),
        # target_hrefs=('/article/',),
        dismiss_hrefs=("#", "/deals/", "/videos/", "/sports/", "/video", "/travel/","/lifestyle/","/tag/", "/us-regions/","/category/"),
        # URL patterns to ignore when collecting article links
        is_generic_href=True,
        # Number of segments in the URL path to consider relevant (for filtering)
        # numeric_hrefs=8,
        # Selectors for extracting content from article pages
        # These are initial guesses that should be refined after HTML analysis
        locate_tags={
            "title": LocateTags(tag="h1", class_="headline"),
            "article": LocateTags(
                tag="div", class_="article-body", remove_tags=("strong",)
            ),
        },
    )
    # AFTER TESTING, UPDATE THE MEDIAS_MAPPING OBJECT WITH THE FINAL SELECTORS

    try:
        async with async_playwright() as playwright:
            # Initialize the browser with a realistic user agent to avoid bot detection
            browser = await playwright.chromium.launch(
                headless=True, args=["--new-headless"]
            )
            context = await browser.new_context()

            # Set headers to appear as a regular browser request
            await context.set_extra_http_headers(
                {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0",
                    "From": "youremail@domain.example",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5"
                }
            )

            # Execute the scraping process
            await main_loop(context, URL_TO_TEST, MEDIA_DATA_TEST)

            await browser.close()

            print("Test scraping completed successfully review htmls.")

    except Exception as e:
        print(f"Error in test scraping process: {e}")
        raise e


async def init_test():
    await run_test()


if __name__ == "__main__":
    asyncio.run(init_test())
