"""
Service for uploading daily sentiment and ideology data to X (Twitter).
Fetches data from back-api service running in Docker network.
"""
import asyncio
import aiohttp
import io
import math
import os
from datetime import date
from typing import Optional
from dotenv import load_dotenv
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for server environments
import matplotlib.pyplot as plt
import tweepy

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

# Docker service configuration (uses Docker Compose service name)
API_VERSION = "v1"
BACK_API_BASE_URL = f"http://back-api:8080/api/{API_VERSION}/home"

HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "MedianalyticsDataService/1.0"
}

# X (Twitter) API credentials - Load from environment variables
X_API_KEY = os.getenv("X_API_KEY")
X_API_SECRET = os.getenv("X_API_SECRET")
X_ACCESS_TOKEN = os.getenv("X_ACCESS_TOKEN")
X_ACCESS_TOKEN_SECRET = os.getenv("X_ACCESS_TOKEN_SECRET")

# Chart styling constants
BAR_COLOR = '#ab972c'
SENTIMENT_COLORS = {
    'NEGATIVES': ('#f44336', 'Negatives'),  # Red
    'POSITIVES': ('#4caf50', 'Positives'),  # Green
    'NEUTRALS': ('#999999', 'Neutrals')     # Gray
}
IDEOLOGY_COLORS = {
    'NATIONAL_STANCES': ('#5499dd', 'National stances'),
    'GEOPOLITICAL_ALIGNMENTS': ('#ab972c', 'Geopolitical alignments'),
    'POLITICAL_SPECTRUM': ('#d32f2f', 'Political spectrum'),
    'ECONOMIC_ORIENTATIONS': ('#04796d', 'Economic orientations'),
    'SOCIAL_MOVEMENTS': ('#5d9b28', 'Social movements'),
    'PHILOSOPHICAL_ORIENTATIONS': ('#f57c00', 'Philosophical orientations'),
    'EPISTEMOLOGICAL_ORIENTATIONS': ('#b342e4', 'Epistemological orientations'),
    'RELIGIOUS_ORIENTATIONS': ('#1ebfd4', 'Religious orientations'),
    'POLITICAL_SYSTEMS': ('#263175', 'Political systems')
}


async def make_request(endpoint: str) -> Optional[dict]:
    """
    Make async GET request to back-api endpoint.
    
    Args:
        endpoint: API endpoint path (e.g., "/generaldaysentiments")
        
    Returns:
        Response JSON dict or None if request fails
    """
    url = BACK_API_BASE_URL + endpoint
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=30)) as response:
                # Log the full response for debugging
                if response.status != 200:
                    error_text = await response.text()
                    print(f"API error for {endpoint}: Status {response.status}")
                    print(f"Response body: {error_text}")
                
                response.raise_for_status()
                return await response.json()
        except aiohttp.ClientError as e:
            print(f"API request error for {endpoint}: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error requesting {endpoint}: {e}")
            return None


def create_sentiment_bar_chart(sentiments_data: dict) -> io.BytesIO:
    """Create horizontal bar chart for detailed sentiment data."""
    return _create_bar_chart(
        data=sentiments_data.get("plain", []),
        title="Rated sentiments",
        error_msg="No sentiment data available"
    )


def create_sentiment_donut_chart(sentiments_data: dict) -> io.BytesIO:
    """Create donut chart for categorized sentiment data."""
    return _create_donut_chart(
        data=sentiments_data.get("categorized", []),
        title="Rated sentiments by category",
        category_map=SENTIMENT_COLORS,
        error_msg="No sentiment data available",
        fontsize=11,
        ncol=3
    )


def create_ideology_bar_chart(ideologies_data: dict) -> io.BytesIO:
    """Create horizontal bar chart for detailed ideology data."""
    return _create_bar_chart(
        data=ideologies_data.get("plain", []),
        title="Rated ideological orientations",
        error_msg="No ideology data available"
    )


def create_ideology_donut_chart(ideologies_data: dict) -> io.BytesIO:
    """Create donut chart for categorized ideology data."""
    return _create_donut_chart(
        data=ideologies_data.get("categorized", []),
        title="Rated ideological orientations by category",
        category_map=IDEOLOGY_COLORS,
        error_msg="No ideology data available",
        fontsize=10,
        ncol=2
    )


def _create_bar_chart(data: list, title: str, error_msg: str) -> io.BytesIO:
    """
    Generic bar chart creator.
    
    Args:
        data: List of items with 'name' and 'count' fields
        title: Chart title
        error_msg: Error message if data is empty
        
    Returns:
        BytesIO buffer containing the PNG image
    """
    if not data:
        raise ValueError(error_msg)

    # Sort by count descending (highest first, lowest at bottom)
    sorted_data = sorted(data, key=lambda x: x["count"], reverse=False)
    names = [item["name"].replace("_", " ").title() for item in sorted_data]
    counts = [item["count"] for item in sorted_data]
    
    # Dynamic height based on number of items - more compact
    num_items = len(names)
    height = max(4, num_items * 0.2)  # At least 4 inches, 0.2" per item
    
    # Create figure with dynamic height
    fig, ax = plt.subplots(figsize=(8, height), dpi=300, facecolor='white')
    
    # Create horizontal bar chart with more spacing
    ax.barh(names, counts, color=BAR_COLOR, edgecolor='none', height=0.4)
    
    # Apply clean styling
    _apply_bar_styling(ax, title)
    
    return _save_figure_to_buffer(fig)


def _create_donut_chart(data: list, title: str, category_map: dict, 
                        error_msg: str, fontsize: int, ncol: int) -> io.BytesIO:
    """
    Generic donut chart creator.
    
    Args:
        data: List of items with 'name' and 'count' fields
        title: Chart title
        category_map: Dict mapping category keys to (color, label) tuples
        error_msg: Error message if data is empty
        fontsize: Font size for percentage labels
        ncol: Number of columns in legend
        
    Returns:
        BytesIO buffer containing the PNG image
    """
    if not data:
        raise ValueError(error_msg)
    
    # Sort data by count descending (largest percentage first)
    sorted_data = sorted(data, key=lambda x: x["count"], reverse=True)
    
    # Extract labels, sizes, and colors based on category map
    labels, sizes, colors = [], [], []
    for item in sorted_data:
        category_key = item["name"].upper()  # Match uppercase keys
        if category_key in category_map:
            color, label = category_map[category_key]
            labels.append(label)
            sizes.append(item["count"])
            colors.append(color)
    
    if not sizes:
        raise ValueError(f"{error_msg} - No valid categories found")
    
    # Calculate percentages
    total = sum(sizes)
    percentages = [f'{(size/total)*100:.1f}%' for size in sizes]
    
    # More compact figure size
    fig, ax = plt.subplots(figsize=(4, 4.5), dpi=300, facecolor='white')
    
    # Create donut chart
    wedges, _ = ax.pie(
        sizes,
        labels=None,
        colors=colors,
        startangle=90,
        counterclock=False,
        wedgeprops=dict(width=0.35, edgecolor='white', linewidth=2)
    )
    
    # Add percentage labels at 85% radius for better centering
    for wedge, pct in zip(wedges, percentages):
        angle = (wedge.theta2 + wedge.theta1) / 2
        # Position at radius (closer to middle of donut)
        x = 0.84 * wedge.r * math.cos(math.radians(angle))
        y = 0.85 * wedge.r * math.sin(math.radians(angle))
        ax.text(x, y, pct, ha='center', va='center', fontsize=fontsize, 
                fontweight='bold', color='white')
    
    # Compact legend
    ax.legend(wedges, labels, loc='upper center', bbox_to_anchor=(0.5, -0.02),
              ncol=ncol, frameon=False, fontsize=12, columnspacing=1)
    ax.set_title(title, fontsize=14, color='#000000', pad=8, loc='center')
    ax.axis('equal')
    
    # Remove all margins
    plt.subplots_adjust(left=0, right=1, top=0.95, bottom=0.08)
    return _save_figure_to_buffer(fig)


def _apply_bar_styling(ax, title: str):
    """Apply consistent styling to bar charts."""
    ax.set_xlabel('Frequency', fontsize=12, color='#000000')
    ax.set_title(title, fontsize=14, color='#000000', pad=12, loc='left')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#CCCCCC')
    ax.spines['bottom'].set_color('#CCCCCC')
    ax.tick_params(colors='#333333', labelsize=11)
    ax.grid(axis='x', alpha=0.5, linestyle='-', linewidth=2, color='#CCCCCC')
    ax.set_axisbelow(True)
    ax.set_facecolor('white')
    # Remove margins on x-axis (bars start at edge)
    ax.margins(x=0, y=0.01)
    # Add more x-axis ticks for better accuracy
    ax.xaxis.set_major_locator(plt.MaxNLocator(nbins=20, integer=True))
    plt.tight_layout(pad=1)


def _save_figure_to_buffer(fig) -> io.BytesIO:
    """Save matplotlib figure to BytesIO buffer and close it."""
    buffer = io.BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight', dpi=300, facecolor='white')
    buffer.seek(0)
    plt.close(fig)
    return buffer


def upload_images_to_x(sentiment_bar: io.BytesIO, sentiment_donut: io.BytesIO,
                       ideology_bar: io.BytesIO, ideology_donut: io.BytesIO,
                       sentiments_summary: str, ideologies_summary: str) -> bool:
    """Upload charts to X (Twitter) as a thread."""
    if not all([X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET]):
        print("❌ X API credentials not configured")
        return False
    
    try:
        # Authenticate with X API
        client = tweepy.Client(
            consumer_key=X_API_KEY,
            consumer_secret=X_API_SECRET,
            access_token=X_ACCESS_TOKEN,
            access_token_secret=X_ACCESS_TOKEN_SECRET
        )
        
        auth = tweepy.OAuth1UserHandler(X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET)
        api_v1 = tweepy.API(auth)
        
        # Upload sentiment charts
        sentiment_bar.seek(0)
        sentiment_donut.seek(0)
        sentiment_bar_media = api_v1.media_upload(filename="sentiment_bar.png", file=sentiment_bar)
        sentiment_donut_media = api_v1.media_upload(filename="sentiment_donut.png", file=sentiment_donut)
        
        # Post first tweet with sentiment charts
        tweet1 = client.create_tweet(
            text=sentiments_summary,
            media_ids=[sentiment_bar_media.media_id, sentiment_donut_media.media_id]
        )
        print(f"✅ Sentiment tweet posted: {tweet1.data['id']}")
        
        # Upload ideology charts
        ideology_bar.seek(0)
        ideology_donut.seek(0)
        ideology_bar_media = api_v1.media_upload(filename="ideology_bar.png", file=ideology_bar)
        ideology_donut_media = api_v1.media_upload(filename="ideology_donut.png", file=ideology_donut)
        
        # Post reply tweet with ideology charts
        tweet2 = client.create_tweet(
            text=ideologies_summary,
            media_ids=[ideology_bar_media.media_id, ideology_donut_media.media_id],
            in_reply_to_tweet_id=tweet1.data['id']
        )
        print(f"✅ Ideology tweet posted: {tweet2.data['id']}")
        
        return True
        
    except tweepy.TweepyException as e:
        print(f"❌ X API error: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"   Status: {e.response.status_code} - {e.response.text}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False


async def upload_to_x() -> bool:
    """Fetch daily sentiment and ideology data, create charts, and upload to X."""
    
    try:
        # Add a 30 second delay before making the request
        await asyncio.sleep(30)
        
        # Fetch data from back-api concurrently
        sentiments_data, ideologies_data = await asyncio.gather(
            make_request("/generaldaysentiments"),
            make_request("/generaldayideologies")
        )
        
        if not sentiments_data or not ideologies_data:
            print("❌ Failed to fetch data from back-api")
            return False
        
        # Create text summaries for tweets
        today = date.today()
        date_str = today.strftime('%A, %d %B %Y')
        total_articles = int(round(sum(item["count"] for item in sentiments_data.get("categorized", [])) / 3))
        
        # Calculate sentiment distribution
        sentiment_categories = {item["name"]: item["count"] for item in sentiments_data.get("categorized", [])}
        total = sentiment_categories.get("NEGATIVES", 0) + sentiment_categories.get("NEUTRALS", 0) + sentiment_categories.get("POSITIVES", 0)
        
        if total > 0:
            negatives = f"{(sentiment_categories.get('NEGATIVES', 0) / total * 100):.1f}%"
            neutrals = f"{(sentiment_categories.get('NEUTRALS', 0) / total * 100):.1f}%"
            positives = f"{(sentiment_categories.get('POSITIVES', 0) / total * 100):.1f}%"
        else:
            negatives = neutrals = positives = "0%"
        
        # Sort sentiments by percentage (descending - biggest first)
        sentiment_items = [
            ("❌  Negatives", negatives, sentiment_categories.get("NEGATIVES", 0)),
            ("➖  Neutrals", neutrals, sentiment_categories.get("NEUTRALS", 0)),
            ("✅  Positives", positives, sentiment_categories.get("POSITIVES", 0))
        ]
        sentiment_items.sort(key=lambda x: x[2], reverse=True)  # Sort by count (descending)
        
        sentiments_summary = (
            f"{date_str}\n\n"
            f"📰 Today, {total_articles:,} articles from media outlets on the platform were analyzed.\n\n"
            f"Daily Media Sentiment Report:\n\n"
            f"{sentiment_items[0][0]}: {sentiment_items[0][1]}\n"
            f"{sentiment_items[1][0]}: {sentiment_items[1][1]}\n"
            f"{sentiment_items[2][0]}: {sentiment_items[2][1]}\n\n"
            f"See the full breakdown below 👇\n\n"
            f"#MediaBias #MediaAnalysis #Medianalytics"
        )
        
        ideologies_summary = (
            f"🧭 Daily Media Ideological Landscape Report\n\n"
            f"📊 Full ideological breakdown in the charts 👇\n\n"
            f"For more information visit: https://medianalytics.org/\n\n"
            f"#MediaBias #MediaAnalysis #Medianalytics"
        )
        
        # Create all charts
        sentiment_bar = create_sentiment_bar_chart(sentiments_data)
        sentiment_donut = create_sentiment_donut_chart(sentiments_data)
        ideology_bar = create_ideology_bar_chart(ideologies_data)
        ideology_donut = create_ideology_donut_chart(ideologies_data)
        
        # Save charts to output folder for checking
        # output_dir = "/app/output"
        # os.makedirs(output_dir, exist_ok=True)
        
        # with open(os.path.join(output_dir, "sentiment_bar.png"), "wb") as f:
        #     f.write(sentiment_bar.getvalue())
        
        # with open(os.path.join(output_dir, "sentiment_donut.png"), "wb") as f:
        #     f.write(sentiment_donut.getvalue())
        
        # with open(os.path.join(output_dir, "ideology_bar.png"), "wb") as f:
        #     f.write(ideology_bar.getvalue())
        
        # with open(os.path.join(output_dir, "ideology_donut.png"), "wb") as f:
        #     f.write(ideology_donut.getvalue())
        
        # print("✅ Charts saved to output folder")
        # return True
        
        success = upload_images_to_x(
            sentiment_bar, sentiment_donut, ideology_bar, ideology_donut,
            sentiments_summary, ideologies_summary
        )
        
        if success:
            print("\n✅ Successfully uploaded daily report to X!")
            return True
        else:
            print("\n❌ Failed to upload to X")
            return False
            
    except ValueError as e:
        print(f"❌ Data validation error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error in upload_to_x: {e}")
        import traceback
        traceback.print_exc()
        return False


# async def main():
#     """Execute the upload to X."""
#     await upload_to_x()


# if __name__ == "__main__":
#     asyncio.run(main())