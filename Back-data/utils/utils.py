"""
This module contains utility functions for web scraping.
"""

import re
from urllib.parse import urljoin
from media_sources.medias_map_scrapper import MediaMap

UNWRAP_TAGS = (
    "span",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "font",
    "small",
    "big",
    "mark",
    "a",
)

REMOVE_TAGS = (
    "br",
    "head",
    "button",
    "aside",
    "figure",
    "picture",
    "source",
    "img",
    "nav",
    "footer",
    "script",
    "style",
    "meta",
    "noscript",
    "iframe",
    "object",
    "embed",
    "link",
    "svg",
    "path",
    "use",
    "defs",
    "symbol",
    "desc",
    "base",
    "area",
    "map",
    "param",
    "track",
    "audio",
    "video",
    "input",
    "form",
    "fieldset",
    "legend",
    "label",
    "select",
    "option",
    "optgroup",
    "cite",
    "figcaption",
    "table",
    "sup",
)

DISMISS_WORDS = (
    "sign up",
    "newsletter",
    "log in",
    "sing in",
    "recaptcha",
    "signing up",
    "subscribe",
    "email us",
    "contact us",
    "advertising",
    "about us",
    "issued on",
)

def process_tag_texts(content:str):
    article = ""
    if not any(word in content.lower() for word in DISMISS_WORDS):
        if any(char in content for char in ["<", ">", "{", "}"]):
            article += " " + remove_content_between_brackets_braces(content)
        else:
            article += " " + content.strip()
    return article


def remove_content_between_brackets_braces(text):
    """
    Removes content enclosed in angle brackets (<>) and curly braces ({}) from the given text.
    """
    # print(text)
    text = re.sub(r"<.*?>", " ", text)
    text = re.sub(r"{.*?}", " ", text)
    # text = re.sub(r"\s+", " ", text)
    return text.strip()


def check_href(href: str, media: MediaMap) -> bool:
    """
    Checks if the href should be processed based on the given criteria.
    Args:
        href (str): The href to check.
        dismiss_hrefs (tuple): A tuple of hrefs to dismiss.
        is_generic_href (bool): A flag indicating if the href is generic.
    Returns:
        bool: True if the href should be processed, False otherwise.
    """
    # First check if href should be dismissed
    if any(dismiss_word in href for dismiss_word in media.dismiss_hrefs):
        return False
    
    # Check for numeric href requirement
    if media.numeric_hrefs > 0:
        return len(re.findall(r"\d", href)) >= media.numeric_hrefs
    
    # If generic href is set, no further checks needed
    if media.is_generic_href:
        return True
    
    # Check for target hrefs or html extension
    return any(word in href for word in media.target_hrefs) or href.endswith(".html")


def clean_text(text: str) -> str:
    """
    Cleans the text from numbers, special characters, and unnecessary spaces.
    Parameters:
        text (str): The text to clean.
    Returns:
        str: The cleaned text.
    """
    cleaned_text = re.sub(r"[0-9]", " ", text.lower())
    cleaned_text = re.sub(r"(?:_|[^\s\w])(?!(?<=\w\-)\w)", " ", cleaned_text)
    cleaned_text = re.sub(r"\b\w\b", " ", cleaned_text)
    return re.sub(r"\s+", " ", cleaned_text).strip()


def clean_href(url_media: str, href: str) -> str:
    """
    Joins the base URL with the href to form a complete URL.
    Args:
        url_media (str): The base URL.
        href (str): The href to be joined with the base URL.
    Returns:
        str: The complete URL formed by joining the base URL with the href.
    """
    return urljoin(url_media, href)
