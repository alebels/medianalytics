"""
Service for retrieving and caching sentiments and ideologies from back-api.
Uses aiohttp for inter-service communication matching the ai_analyzer pattern.
"""

import asyncio
import logging
import aiohttp

logger = logging.getLogger(__name__)

API_VERSION = "v1"
URL = f"http://back-api:8080/api/{API_VERSION}/config"  # Docker service name

HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "MedianalyticsAIService/1.0"
}


class SentimentIdeologyStore:
    """
    Store for sentiments and ideologies retrieved from the back-api service.
    Provides formatted strings for AI system prompts and validation sets.
    """

    def __init__(self):
        self.system_sentiment: str = ""
        self.system_ideology: str = ""
        self.sentiments: frozenset[str] = frozenset()
        self.ideologies: frozenset[str] = frozenset()

    def _populate(self, data: dict) -> None:
        sentiments_list: list[str] = data.get("sentiments", [])
        ideologies_list: list[str] = data.get("ideologies", [])

        self.system_sentiment = self._build_system_sentiment(sentiments_list)
        self.system_ideology = self._build_system_ideology(ideologies_list)
        self.sentiments = frozenset(sentiments_list)
        self.ideologies = frozenset(ideologies_list)

    def _build_system_sentiment(self, sentiments_list: list[str]) -> str:
        return f"""You are an expert analyst specialized in identifying sentiments in text.
            Your task is to carefully analyze and understand a given text and identify exactly 3 distinct sentiments from the valid list.

            Valid sentiments: {", ".join(sentiments_list)}.

            Rules:
            1. Ensure you carefully analyze and understand the text and the list of valid sentiments.
            2. Select exactly 3 different sentiments that best describe the text.
            3. Each sentiment must exist in the valid list, in uppercase format.
            4. Respond with exactly one JSON object: {{"sentiments": ["SENTIMENT_1", "SENTIMENT_2", "SENTIMENT_3"]}}
            5. Output only valid JSON, no additional text.
        """

    def _build_system_ideology(self, ideologies_list: list[str]) -> str:
        return f"""You are an expert analyst specialized in identifying ideologies in text.
            Your task is to carefully analyze and understand a given text and identify exactly 3 distinct ideologies from the valid list.

            Valid ideologies: {", ".join(i.replace("_", "-") for i in ideologies_list)}.

            Rules:
            1. Ensure you carefully analyze and understand the text and the list of valid ideologies.
            2. Select exactly 3 different ideologies that best describe the text.
            3. Each ideology must exist in the valid list, in uppercase format.
            4. Respond with exactly one JSON object: {{"ideologies": ["IDEOLOGY_1", "IDEOLOGY_2", "IDEOLOGY_3"]}}
            5. Output only valid JSON, no additional text.
        """

    async def load(self, max_retries: int = 5, retry_delay: float = 2.0) -> bool:
        """
        Fetch sentiments and ideologies from back-api config endpoint with retries using aiohttp.
        """
        endpoint_url = f"{URL}/sentimentsideologies"
        logger.info(f"Retrieving sentiments and ideologies from {endpoint_url}")

        for attempt in range(1, max_retries + 1):
            try:
                timeout = aiohttp.ClientTimeout(total=15)
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    async with session.get(endpoint_url, headers=HEADERS) as response:
                        response.raise_for_status()
                        data = await response.json()
                        self._populate(data)
                        logger.info(
                            f"Successfully loaded {len(self.sentiments)} sentiments and "
                            f"{len(self.ideologies)} ideologies from back-api."
                        )
                        return True
            except Exception as e:
                logger.warning(
                    f"Attempt {attempt}/{max_retries} failed to fetch sentiments/ideologies from {endpoint_url}: {e}"
                )
                if attempt < max_retries:
                    await asyncio.sleep(retry_delay)

        logger.error(f"Failed to retrieve sentiments and ideologies from back-api after {max_retries} attempts.")
        return False


# Global singleton instance
SHARED_STORE = SentimentIdeologyStore()
