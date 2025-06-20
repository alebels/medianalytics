import aiohttp
from transformers import BartTokenizer, pipeline
from config.sentiments_ideologies_enums import SentimentsEnum, IdeologiesEnum

API_VERSION = "v1"
URL = f"http://back-ai:9000/ai/{API_VERSION}" # Docker service name

HEADERS = {
    "Content-Type": "application/json"
}

GET_ATTRIBUTE = "response"  # Attribute to extract from the response

async def make_request(text: str, endpoint: str) -> list[IdeologiesEnum] | list[SentimentsEnum] | None:
    """Make async request to API endpoint."""
    analysis_url = URL + endpoint
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                analysis_url, 
                headers=HEADERS, 
                json={"text": text}
            ) as response:
                response.raise_for_status()
                response_data = await response.json()
                return response_data.get(GET_ATTRIBUTE)
        except aiohttp.ClientError as e:
            print(f"An error occurred with POST request to {endpoint}: {e}")
            return None


def chunk_text(text, tokenizer: BartTokenizer, chunk_size, overlap):
    tokens = tokenizer(text, return_tensors="pt", truncation=False)["input_ids"][0]
    max_token_id = tokenizer.vocab_size - 1  # Get the maximum token ID for the tokenizer

    for i in range(0, len(tokens), chunk_size - overlap):
        chunk = tokens[i:i + chunk_size]
        # Ensure all token IDs are within the valid range
        chunk = [min(token_id, max_token_id) for token_id in chunk]
        yield tokenizer.decode(chunk)


TEXT_SIZE = 19000

CHUNK_SIZE = 1000  # Adjust to model's max token limit
OVERLAP = 100  # Overlap ensures context continuity

class AiAnalyzer:
    """AI Text Analysis Class
    This class provides text analysis capabilities using pre-trained AI models,
    including text summarization, ideology analysis, and sentiment analysis.
    The class uses the BART model from Facebook for text summarization and makes API
    requests for ideological and sentiment analysis.
    Class Attributes:
        _tokenizer (BartTokenizer): Tokenizer instance for text processing
        _summarizer (pipeline): Summarization pipeline instance
    Methods:
        _initialize_models(): Initializes the BART tokenizer and summarization pipeline
        analyze_text(text): Processes and summarizes long text by chunks
        extract_ideology(): Analyzes ideology of the text
        extract_sentiment(): Analyzes sentiment of the text
    Args:
        text (str): The input text to be analyzed. If longer than TEXT_SIZE, 
                    it will be automatically summarized.
    """
    _tokenizer = None
    _summarizer = None
    
    @classmethod 
    def _initialize_models(cls):
        if cls._tokenizer is None or cls._summarizer is None:
            # Initialize both models in one go to reduce overhead
            model_name = "facebook/bart-large-cnn"
            cls._tokenizer = BartTokenizer.from_pretrained(
                model_name,
                use_fast=True # Use faster tokenizer implementation
            )
            cls._summarizer = pipeline(
                "summarization",
                model=model_name, 
                tokenizer=cls._tokenizer, # Reuse tokenizer
                device="cpu",
                framework="pt", # Explicitly use PyTorch
                batch_size=1, # Control memory usage
            )

    @classmethod
    def analyze_text(cls, text):
        cls._initialize_models()
        chunks = chunk_text(text, cls._tokenizer, CHUNK_SIZE, OVERLAP)
        summaries = [cls._summarizer(chunk)[0]['summary_text'] for chunk in chunks]
        return " ".join(summaries)

    def __init__(self, text: str):
        if len(text) > TEXT_SIZE:
            self.text = self.__class__.analyze_text(text)
        else:
            self.text = text

    async def extract_ideology(self) -> list[IdeologiesEnum] | None:
        """Get ideology analysis."""
        return await make_request(self.text, "/generate_ideology")

    async def extract_sentiment(self) -> list[SentimentsEnum] | None:
        """Get sentiment analysis.""" 
        return await make_request(self.text, "/generate_sentiment")