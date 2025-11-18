"""
This module contains the main service for web scraping using Playwright.
"""

import asyncio
import logging
import aiohttp
from playwright.async_api import async_playwright, BrowserContext
from repository.repository_services import (
    get_media_id_url, 
    check_article_exists,
    get_media_id_url_by_id, # For testing purposes
    update_media_active
)
from services.scrapper import (
    get_main_hrefs,
    get_article_with_tags,
    get_article_from_script_tag,
)
from services.x_upload import upload_to_x
from media_sources.medias_map_scrapper import MEDIAS_MAPPING, MediaMap
from utils.utils import check_href, clean_href


logger = logging.getLogger(__name__)


SCRAPE_METHODS = {
    "get_article_with_tags": get_article_with_tags,
    "get_article_from_script_tag": get_article_from_script_tag,
}


NUM_HREFS = 10
HREFS_TO_SCRAPE = 5


async def invalidate_api_cache():
    """
    Invalidate API cache by sending POST request to back-api internal endpoint.
    This triggers cache refresh with fresh data after scraping completes.
    """
    cache_url = "http://back-api:8080/api/v1/home/internal/cache/invalidate"
    
    try:
        logger.info("Triggering API cache invalidation...")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                cache_url,
                timeout=aiohttp.ClientTimeout(total=120)
            ) as response:
                if response.status != 200:
                    logger.warning(f"Cache invalidation returned status {response.status}")
        
        # Allow aiohttp to clean up background tasks
        await asyncio.sleep(10)
                    
    except aiohttp.ClientError as e:
        logger.error(f"Failed to invalidate cache (network error): {e}")
    except Exception as e:
        logger.error(f"Failed to invalidate cache: {e}")


async def fetch_page_content(context: BrowserContext, url: str, retries: int = 2, timeout: int = 15000) -> str:
    """
    Fetches the content of a web page with retry mechanism and improved resilience.
    
    Args:
        context (BrowserContext): The browser context to use
        url (str): The URL of the web page to fetch
        retries (int): Number of retry attempts (default: 2)
        timeout (int): Timeout in milliseconds (default: 15000)
        
    Returns:
        str: The HTML content of the web page
    
    Raises:
        Exception: If all retry attempts fail
    """
    page = None
    attempt = 0
    
    while attempt < retries:
        try:
            attempt += 1
            page = await context.new_page()
            
            # Enhanced anti-bot detection
            await page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
                Object.defineProperty(navigator, 'plugins', { get: () => Array(3).fill().map(() => ({})) });
            """)
            
            # Set viewport to simulate real browser
            await page.set_viewport_size({"width": 1920, "height": 1080})
            
            # Navigate with better error handling
            response = await page.goto(url, wait_until="domcontentloaded", timeout=timeout)
            if not response:
                raise Exception(f"Failed to get response from {url}")
            
            if response.status >= 400:
                raise Exception(f"HTTP error: {response.status}")
                
            # Try multiple selectors to ensure the page is loaded
            try:
                await page.wait_for_selector("main, article, #content, .content, .article, body", 
                                            timeout=timeout)
            except:
                # If no specific element is found, wait for network idle as fallback
                await page.wait_for_load_state("networkidle", timeout=timeout//2)
            
            # Get the content
            content = await page.content()
            
            if content and len(content) > 600:  # Ensure we got meaningful content
                return content
            else:
                raise Exception("Retrieved empty or minimal content")
                
        except Exception as e:
            logger.warning(f"Attempt {attempt}/{retries} failed for {url}: {str(e)}")
            if attempt >= retries:
                logger.error(f"All {retries} attempts failed for {url}: {str(e)}")
                raise
            # Wait before retry with exponential backoff
            await page.wait_for_timeout(1000 * attempt)
            
        finally:
            if page:
                await page.close()


async def main_loop(context: BrowserContext, media_url: str, media: MediaMap):
    """
    Main loop to scrape the media content.
    Args:
        media (MediaMap): The media data.
    """
    try:
        logger.info("Media -- %s", media_url)
        content = await fetch_page_content(context, media_url)

        urls = get_main_hrefs(content, media.locate_main_hrefs)
        href_set = set()

        # Take the first n urls (suppose to be the main urls because is on head)
        for i, a in enumerate(urls):
            href = str(a["href"])
            if check_href(href, media):
                href_set.add(clean_href(media_url, href))
            if len(href_set) >= NUM_HREFS:
                break
        logger.info("Urls Set -- %d - %s", len(href_set), href_set)
        
        if len(href_set) == 0:
            raise Exception(f"No valid URLs found in the main page for {media_url}")

        success_count = 0

        for i, href in enumerate(href_set):
            try:
                
                logger.info("Processing URL %d/%d: %s\n", i + 1, len(href_set), href)
                if await check_article_exists(href):
                    logger.info("Article already exists.\n")
                    continue
                data = await fetch_page_content(context, href)
                await SCRAPE_METHODS[media.scrape_method](
                    data, media.locate_tags, media.id, href
                )
                success_count += 1
                
            except Exception as e:
                logger.error("Error processing URL %s: %s", href, e)
                continue
            
            if success_count >= HREFS_TO_SCRAPE:
                break
            
    except Exception as e:
        logger.error("Error in main loop: %s", e)
        if not await update_media_active(media.id):
            logger.error(f"Error updating media active status: {media.id}")


async def main_service_main():
    """
    Main function to initiate the web scraping process.
    This function sets up the Playwright browser context, retrieves media data from the database,
    and processes each media URL using the main loop.
    """
    logger.info("Daily job main_service.main() started...")

    try:

        # Fetch all media URLs and IDs from the database
        db_medias = await get_media_id_url()
        
        # This is useful for debugging or testing specific media.
        # db_medias = [media for media in db_medias if media["id"] not in [1,2,3,22,23]]
        # To test a specific media, uncomment the line below
        # db_medias = await get_media_id_url_by_id(23)
        
        if(len(db_medias) == 0):
            logger.info("No medias to process.")
            return

        async with async_playwright() as playwright:

            browser = await playwright.chromium.launch(
                headless=True, args=["--new-headless"]
            )
            context = await browser.new_context()

            await context.set_extra_http_headers(
                {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:97.0) Gecko/20100101 Firefox/97.0",
                    "From": "youremail@domain.example",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.5"
                }
            )

            for media_url, media in MEDIAS_MAPPING.items():
                for db_media in db_medias:
                    db_media_url = str(db_media["url"]).strip()
                    if media_url in db_media_url:
                        media.id = db_media["id"]
                        media_url = db_media_url
                        break

                if media.id != 0:
                    logger.info("Processing media: %s (ID: %d)", media_url, media.id)
                    await main_loop(context, media_url, media)

            await browser.close()
            
            logger.info("Daily job from main_service.main() completed successfully.")
            
            # Invalidate and refresh API cache after scraping
            await invalidate_api_cache()
            
            await upload_to_x()

    except Exception as e:
        logger.error("Error in main_service.main(): %s", e)
        raise e
