"""
A configuration module that defines web scraping settings for various news websites.
This module contains a dictionary mapping news website URLs to their respective scraping configurations.
Each website configuration specifies:
- Scraping method to use
- How to locate main article links 
- Whether URLs are generic or need processing
- URLs/patterns to dismiss/ignore
- HTML tags and classes for locating article content
The configurations use the MediaMap and LocateTags data classes to structure the settings.
Constants:
    MEDIAS_MAPPING (dict): Maps news website URLs to their MediaMap configurations
Example:
    ```python
    # Get scraping config for El Pais
    el_pais_config = MEDIAS_MAPPING["https://english.elpais.com"]
    # Access scraping method
    method = el_pais_config.scrape_method
    # Get location tags
    tags = el_pais_config.locate_tags
    ```
This module contains data classes and constants used for web scraping media data.

--- THE URL KEY STRING MUST BE THE SAME AS IN THE medias_info_db.py, THE SAME AS IS IN THE DB ---
"""

from models.data_classes import LocateTags, MediaMap


MEDIAS_MAPPING: dict[str, MediaMap] = {
    "https://english.elpais.com/": MediaMap(
        scrape_method="get_article_from_script_tag",
        locate_main_hrefs=LocateTags(tag="main"),
        dismiss_hrefs=("#", "/elections/", "autoplay=1"),
        locate_tags={
            "locate": LocateTags(tag="script", type="application/ld+json"),
            "tags": LocateTags(tag="headline", type="description", tag_2="articleBody"),
        },
    ),
    "https://www.bbc.com/": MediaMap(
        locate_main_hrefs=LocateTags(tag="main"),
        dismiss_hrefs=("#", "/live/", "/videos/", "/resources/", "/election/"),
        locate_tags={
            "title": LocateTags(tag="h1"),
            "article": LocateTags(tag="main", tag_2="article", is_recursive=True),
        },
    ),
    "https://www.aljazeera.com/": MediaMap(
        locate_main_hrefs=LocateTags(tag="div", class_="trending-articles"),
        is_generic_href=True,
        dismiss_hrefs=("#", "/liveblog/", "/program/", "/results/", "/video/"),
        locate_tags={
            "title": LocateTags(tag="main", tag_2="h1"),
            "article": LocateTags(tag="div", class_="wysiwyg"),
        },
    ),
    "https://www.theguardian.com/": MediaMap(
        locate_main_hrefs=LocateTags(tag="main"),
        is_generic_href=True,
        dismiss_hrefs=("#", "/live/", "/gallery/"),
        locate_tags={
            "title": LocateTags(tag="h1"),
            "article": LocateTags(tag="main", tag_2="article", is_recursive=True),
        },
    ),
    "https://www.nbcnews.com/": MediaMap(
        locate_main_hrefs=LocateTags(tag="div", class_="multistory-container"),
        dismiss_hrefs=("#", "/live-blog/", "/video/"),
        locate_tags={
            "title": LocateTags(tag="header", tag_2="h1"),
            "article": LocateTags(
                tag="div", class_="article-body__content"
            ),
        },
    ),
    "https://apnews.com/": MediaMap(
        locate_main_hrefs=LocateTags(tag="main"),
        dismiss_hrefs=("#", "/live/", "/video/"),
        locate_tags={
            "title": LocateTags(tag="h1"),
            "article": LocateTags(
                tag="div", class_="RichTextStoryBody"
            ),
        },
    ),
    "https://www.cbsnews.com/": MediaMap(
        locate_main_hrefs=LocateTags(tag="div", class_="type--content-feature"),
        dismiss_hrefs=("#", "/live/", "/video/"),
        locate_tags={
            "title": LocateTags(tag="h1"),
            "article": LocateTags(
                tag="section", class_="content__body"
            ),
        },
    ),
    "https://www.foxnews.com/world": MediaMap(
        locate_main_hrefs=LocateTags(tag="main", class_="main-content"),
        dismiss_hrefs=("#", "/deals/", "/videos/", "/sports/", "/video", "/travel/","/lifestyle/","/tag/", "/us-regions/","/category/"),
        is_generic_href=True,
        locate_tags={
            "title": LocateTags(tag="h1", class_="headline"),
            "article": LocateTags(
                tag="div", class_="article-body", remove_tags=("strong",)
            ),
        },
    ),
    "https://edition.cnn.com/": MediaMap(
        locate_main_hrefs=LocateTags(tag="div", class_="scope"),
        dismiss_hrefs=("#", "/live-news/", "/videos/", "/sport/", "/video/", "/travel/"),
        numeric_hrefs=8,
        locate_tags={
            "title": LocateTags(tag="h1", class_="headline__text"),
            "article": LocateTags(
                tag="div", class_="article__content"
            ),
        },
    ),
    "https://www.politico.eu/": MediaMap(
        locate_main_hrefs=LocateTags(tag="main"),
        locate_tags={
            "title": LocateTags(tag="h1"),
            "article": LocateTags(tag="main", is_recursive=True),
        },
    ),
    "https://www.dw.com/en/top-stories/s-9097": MediaMap(
        locate_main_hrefs=LocateTags(tag="div", class_="content-blocks"),
        is_generic_href=True,
        dismiss_hrefs=("#", "/live-", "/video-"),
        locate_tags={
            "title": LocateTags(tag="h1"),
            "article": LocateTags(tag="div", class_="content-area", is_recursive=True),
        },
    ),
    "https://www.france24.com/": MediaMap(
        locate_main_hrefs=LocateTags(tag="main"),
        is_generic_href=True,
        dismiss_hrefs=("#", "-live-", "/tv-shows/", "/video/"),
        locate_tags={
            "title": LocateTags(tag="h1"),
            "article": LocateTags(
                tag="div", class_="t-content--article", is_recursive=True
            ),
        },
    ),
    "https://www.chinadaily.com.cn/world": MediaMap(
        locate_main_hrefs=LocateTags(tag="div", class_="mai_l_t"),
        dismiss_hrefs=("#", "/world/"),
        locate_tags={
            "title": LocateTags(tag="h1"),
            "article": LocateTags(
                tag="div", id="Content"
            ),
        },
    ),
    "https://english.news.cn/home.htm": MediaMap(
        locate_main_hrefs=LocateTags(tag="div", class_="headnews"),
        dismiss_hrefs=("#", "/live/", "/video/"),
        locate_tags={
            "title": LocateTags(tag="h1"),
            "article": LocateTags(
                tag="div", id="detailContent"
            ),
        },
    ),
    "https://www.globaltimes.cn/index.html": MediaMap(
        locate_main_hrefs=LocateTags(tag="div", class_="news_section"),
        target_hrefs=('/page/',),
        dismiss_hrefs=("#", "/live/", "/video/", "/opinion/", "/special-coverage/"),
        locate_tags={
            "title": LocateTags(tag="div", class_="top_title"),
            "article": LocateTags(
                tag="div", class_="article_right", is_get_text=True
            ),
        },
    ),
    "https://www.hindustantimes.com/": MediaMap(
        locate_main_hrefs=LocateTags(tag="section", class_="mainContainer"),
        dismiss_hrefs=("#", "/cricket/", "/lifestyle/", "/sports/", "/entertainment/"),
        locate_tags={
            "title": LocateTags(tag="h1", class_="hdg1"),
            "article": LocateTags(
                tag="div", class_="detail"
            ),
        },
    ),
    "https://japannews.yomiuri.co.jp/": MediaMap(
        locate_main_hrefs=LocateTags(tag="div", class_="front_bloc1_wrap1"),
        is_generic_href=True,
        dismiss_hrefs=("#", "/latestnews/", "/features/"),
        locate_tags={
            "title": LocateTags(tag="div", class_="bloc_1", tag_2="h1"),
            "article": LocateTags(
                tag="div", id="p-article-block"
            ),
        },
    ),
    "https://www.rt.com/": MediaMap(
        locate_main_hrefs=LocateTags(tag="ul", class_="main-promobox__list"),
        is_generic_href=True,
        dismiss_hrefs=("#", "/on-air/", "/video/"),
        locate_tags={
            "title": LocateTags(tag="h1", class_="article__heading"),
            "article": LocateTags(
                tag="div", class_="article__text"
            ),
        },
    ),
    "https://www.hurriyetdailynews.com/": MediaMap(
        locate_main_hrefs=LocateTags(tag="div", class_="container"),
        numeric_hrefs=6,
        locate_tags={
            "title": LocateTags(tag="h1"),
            "article": LocateTags(
                tag="div", class_="content"
            ),
        },
    ),
    "https://www.timesofisrael.com/": MediaMap(
        locate_main_hrefs=LocateTags(tag="section"),
        is_generic_href=True,
        dismiss_hrefs=("#", "/liveblog", "/writers/","/daily-briefing","/blogs.", "/latest/"),
        locate_tags={
            "title": LocateTags(tag="h1", class_="headline"),
            "article": LocateTags(
                tag="div", class_="the-content"
            ),
        },
    ),
    "https://www.imf.org/en/News": MediaMap(
        locate_main_hrefs=LocateTags(tag="div", class_="container-fluid"),
        is_generic_href=True,
        dismiss_hrefs=(
            "#",
            "/SearchNews",
            "/ar/news",
            "/Blogs/",
            "/Podcasts/",
            "/Videos/",
            "/Publications/",
        ),
        locate_tags={
            "title": LocateTags(tag="h2"),
            "article": LocateTags(
                tag="section",
                is_recursive=True,
                special_tags=("h3", "h4", "p", "ul", "li"),
            ),
        },
    ),
    "https://www.weforum.org/stories": MediaMap(
        locate_main_hrefs=LocateTags(tag="div", class_="wef-c7cl1o"),
        dismiss_hrefs=("#","/blogs/", "/videos/","/podcasts/"),
        numeric_hrefs=6,
        locate_tags={
            "title": LocateTags(tag="h1"),
            "article": LocateTags(
                tag="div", class_="wef-zw4tnc", is_find_all=True
            ),
        },
    ),
    "https://news.un.org/en/": MediaMap(
        locate_main_hrefs=LocateTags(tag="div", id="block-un-base-theme-content"),
        target_hrefs=('/story/',),
        locate_tags={
            "title": LocateTags(tag="h1", class_="title"),
            "article": LocateTags(
                tag="div", class_="text-formatted"
            ),
        },
    ),
}
