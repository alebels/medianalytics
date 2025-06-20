"""
Module for web scraping and analyzing articles.
"""

import os
import json
import logging
from typing import Final
from bs4 import BeautifulSoup, Comment
from services.ai_analyzer import AiAnalyzer
from models.py_schemas import ArticleAi, ArticleText, ArticleCreate
from repository.repository_services import create_article_with_words_and_facts
from services.text_analyzer import TextAnalyzer
from utils.utils import process_tag_texts, UNWRAP_TAGS, REMOVE_TAGS
from media_sources.medias_map_scrapper import LocateTags

HTML_PARSER: Final = "html5lib"

MIN_LEN_ARTICLE: Final = 500
MAX_LEN_ARTICLE: Final = 40000


def unwrap_tags(soup: BeautifulSoup) -> None:
    """
    Remove all HTML comments and unwrap specified tags from the BeautifulSoup object.
    Args:
        soup (BeautifulSoup): A BeautifulSoup object containing the parsed HTML content.
    Returns:
        None
    """
    for comment in soup.find_all(string=lambda text: isinstance(text, Comment)):
        comment.extract()
    for tag in UNWRAP_TAGS:
        for match in soup.find_all(tag):
            match.unwrap()


def remove_tags(soup: BeautifulSoup, add_remove: tuple) -> None:
    """
    Remove specified tags from a BeautifulSoup object.
    Args:
        soup (BeautifulSoup): The BeautifulSoup object from which tags will be removed.
    Returns:
        None
    """
    tags_to_remove = set(REMOVE_TAGS + add_remove if add_remove else REMOVE_TAGS)
    for match in soup.find_all(tags_to_remove):
        match.decompose()


def html_string_to_file(content: str, url: str) -> None:
    """
    Converts an HTML string to a formatted HTML file and saves it to the local filesystem.
    Args:
        content (str): The HTML content as a string.
        url (str): The URL from which the HTML content was retrieved.
    Returns:
        None
    """
    # Create htmls directory if it doesn't exist
    os.makedirs("./htmls/", exist_ok=True)
    
    soup = BeautifulSoup(content, HTML_PARSER)
    remove_tags(soup)
    url = url.rstrip("/").rstrip(".html")
    file_name = url.split("/")[-1]
    file_path = "./htmls/" + file_name
    with open(f"{file_path}.html", "w", encoding="utf-8") as write_file:
        write_file.write(soup.prettify())


def get_main_hrefs(content: str, hrefs_tags: LocateTags) -> list:
    """
    Extracts main hrefs from the given HTML content based on specified tags.
    Args:
        content (str): The HTML content as a string.
        hrefs_tags (LocateTags): The tags used to locate hrefs in the HTML.
    Returns:
        list: A list of href elements found in the HTML content.
    """
    soup = BeautifulSoup(content, HTML_PARSER)
    result = []
    if hrefs_tags.class_:
        containers = soup.find_all(hrefs_tags.tag, class_=hrefs_tags.class_)
    elif hrefs_tags.id:
        containers = soup.find_all(hrefs_tags.tag, id=hrefs_tags.id)
    else:
        containers = soup.find_all(hrefs_tags.tag)
        
    for container in containers:
        result.extend(container.find_all("a", href=True))
    return result


def get_title(soup: BeautifulSoup, title_tags: LocateTags) -> str:
    """
    Extracts the title text from a BeautifulSoup object based on specified tags and class.
    Args:
        soup (BeautifulSoup): The BeautifulSoup object containing the HTML content.
        title_tags (LocateTags): An object containing the tag names and optional class to locate the title.
    Returns:
        str: The extracted title text.
    """
    if title_tags.class_ and title_tags.tag_2:
        return soup.find(title_tags.tag, class_=title_tags.class_).find(title_tags.tag_2).get_text(strip=True)
    elif title_tags.class_:
        return soup.find(title_tags.tag, class_=title_tags.class_).get_text(strip=True)
    elif title_tags.tag_2:
        return soup.find(title_tags.tag).find(title_tags.tag_2).get_text(strip=True)
    return soup.find(title_tags.tag).get_text(strip=True)


def get_article(
    soup: BeautifulSoup, article_tags: LocateTags, target_tags: tuple
) -> list:
    """
    Extracts and returns a list of target tags from an article within a BeautifulSoup object.
    Args:
        soup (BeautifulSoup): The BeautifulSoup object containing the HTML content.
        article_tags (LocateTags): An object containing the tags and attributes to locate the article.
        target_tags (tuple): A tuple of tags to be extracted from the located article.
    Returns:
        list: A list of BeautifulSoup tag objects matching the target tags within the located article.
    """

    if article_tags.is_find_all:
        containers = soup.find_all(article_tags.tag, class_=article_tags.class_)
        results = []
        for item in containers:
            results.extend(item.find_all(target_tags))
        return results

    container = None

    if article_tags.class_:
        container = soup.find(article_tags.tag, class_=article_tags.class_)
    elif article_tags.id:
        container = soup.find(article_tags.tag, id=article_tags.id)
    elif article_tags.tag_2:
        container = soup.find(article_tags.tag).find(article_tags.tag_2)
    else:
        container = soup.find(article_tags.tag)
    
    if article_tags.is_get_text:
        return [container.get_text(strip=True)]

    if container:
        return container.find_all(target_tags, recursive=article_tags.is_recursive)
    return []


def assemble_article(texts: list) -> str:
    """
    Assembles an article from a list of text elements.
    This function processes a list of text elements, concatenating their contents
    into a single string while filtering out unwanted words and removing content
    between brackets and braces.
    Args:
        texts (list): A list of text elements, where each element has a 'contents' attribute.
    Returns:
        str: The assembled article as a single string.
    """
    article = ""
    for text in texts:
        if hasattr(text, 'contents'):
            for content in text.contents:
                if isinstance(content, str):
                    article += process_tag_texts(content)
        elif isinstance(text, str):
            article += process_tag_texts(text)
    return article


async def invoke_text_analyzer(article: str) -> ArticleText:
    """
    Analyzes the given article text using the TextAnalyzer class.
    Args:
        article (str): The article text to be analyzed.
    Returns:
        ArticleText: An object containing the analyzed text data.
    """
    logging.info(f"+++++++++\n{article}\n+++++++++")
    text_analyzer = TextAnalyzer(article)

    article_length = len(article)
    logging.info(f"Text length: {article_length}")
    count_words = len(article.split())
    logging.info(f"Word count: {count_words}")
    cleaned_article = await text_analyzer.remove_stop_words()
    common_words = await text_analyzer.most_common_words()
    logging.info(f"Most Common Words: {common_words}")

    frequency_words = await text_analyzer.frequency_all_words()
    logging.info(f"Frequency of All Words: {frequency_words}")
    pos_tags = await text_analyzer.get_pos_tags()
    logging.info(f"POS Tags: {pos_tags}")

    entities = await text_analyzer.get_entities()
    logging.info(f"Entities: {entities}")

    return ArticleText(
        article=cleaned_article,
        common_words=common_words,
        entities=entities,
        count_words=count_words,
        length=article_length,
        frequency_words=frequency_words,
        pos_tags=pos_tags,
    )


async def invoke_ai_analizer(article: str) -> ArticleAi:
    """
    Analyzes the given article text using the AiAnalyzer class.
    Args:
        article (str): The article text to be analyzed.
    Returns:
        ArticleAi: An object containing the analyzed AI data.
    """
    print("--------")
    ai_analyzer = AiAnalyzer(article)

    ideologies = await ai_analyzer.extract_ideology()
    logging.info(f"Extract ideology: {ideologies}")
    if not ideologies or len(ideologies) < 3:
        raise Exception("Ideology extraction failed.")

    sentiments = await ai_analyzer.extract_sentiment()
    logging.info(f"Extract main sentiment: {sentiments}")
    if not sentiments or len(sentiments) < 3:
        raise Exception("Sentiment extraction failed.")

    return ArticleAi(sentiments=sentiments, ideologies=ideologies)


async def create_article_to_db(
    media_id: int, title: str, href: str, article: str
) -> None:
    """
    Asynchronously creates an article record in the database after analyzing the text and invoking AI analysis.
    Args:
        media_id (int): The ID of the media source.
        title (str): The title of the article.
        href (str): The URL of the article.
        article (str): The content of the article.
    Returns:
        None
    """
    analyzer_text_obj = await invoke_text_analyzer(article)
    analyzer_ai_obj = await invoke_ai_analizer(article)

    db_article = ArticleCreate(
        media_id=media_id,
        title=title,
        url=href,
        article=analyzer_text_obj.article,
        common_words=analyzer_text_obj.common_words,
        entities=analyzer_text_obj.entities,
        count_words=analyzer_text_obj.count_words,
        length=analyzer_text_obj.length,
        sentiments=analyzer_ai_obj.sentiments,
        ideologies=analyzer_ai_obj.ideologies,
    )
    await create_article_with_words_and_facts(
        db_article, analyzer_text_obj.frequency_words, analyzer_text_obj.pos_tags
    )


async def get_article_with_tags(
    content, locate_tags: dict[str, LocateTags], media_id: int, href: str
) -> None:
    """
    Asynchronously retrieves an article with tags, processes it, and stores it in the database.
    Args:
        content (str): The HTML content of the article.
        locate_tags (dict[str, LocateTags]): A dictionary containing the tags to locate specific parts of the article.
        media_id (int): The ID of the media source.
        href (str): The URL of the article.
    Returns:
        None
    """
    soup = BeautifulSoup(content, HTML_PARSER)

    # Remove unwanted tags and unwrap formatting tags
    remove_tags(soup, locate_tags["article"].remove_tags or ())
    unwrap_tags(soup)

    # Extract the title
    title = get_title(soup, locate_tags["title"])
    
    # Determine target tags and get article content
    target_tags = locate_tags["article"].special_tags or ("h2", "h3", "h4", "p")
    texts = get_article(soup, locate_tags["article"], target_tags)

    # Assemble the article content
    body_article = assemble_article(texts)
    full_article = f"{title}. {body_article}"
    
    # Validate article length
    if not MIN_LEN_ARTICLE <= len(full_article) <= MAX_LEN_ARTICLE:
        raise Exception("Article is too short or too long to be valid.")

    # Store the article in the database
    await create_article_to_db(media_id, title, href, full_article)


async def get_article_from_script_tag(
    content, locate_tags: dict[str, LocateTags], media_id: int, href: str
) -> None:
    """
    Extracts an article from a script tag within the provided HTML content and saves it to the database.
    Args:
        content (str): The HTML content to parse.
        locate_tags (dict[str, LocateTags]): A dictionary containing the tags to locate the script and extract the article.
        media_id (int): The ID of the media source.
        href (str): The URL of the article.
    Returns:
        None
    """
    soup = BeautifulSoup(content, HTML_PARSER)
    scripts = soup.find_all(locate_tags["locate"].tag, type=locate_tags["locate"].type)

    for script in scripts:
        try:
            json_obj = json.loads(script.contents[0])

            if (
                locate_tags["tags"].tag in json_obj
                and locate_tags["tags"].type in json_obj
                and locate_tags["tags"].tag_2 in json_obj
            ):
                title = json_obj[locate_tags["tags"].tag]
                full_article = (
                    json_obj[locate_tags["tags"].tag]
                    + ". "
                    + json_obj[locate_tags["tags"].type]
                    + " "
                    + json_obj[locate_tags["tags"].tag_2]
                )
                
                if len(full_article) < MIN_LEN_ARTICLE or len(full_article) > MAX_LEN_ARTICLE:
                    raise Exception("Article is too short or too long to be valid.")
                
                await create_article_to_db(media_id, title, href, full_article)
                break

        except json.JSONDecodeError:
            logging.error("Error decoding JSON")
            continue
