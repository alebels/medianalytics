from dataclasses import dataclass, field


@dataclass(frozen=True)
class LocateTags:
    """
    A class to represent the tags used for locating elements in web scraping.
    Attributes:
        tag (str): The primary tag to locate.
        type (str): The type of the tag. Default is an empty string.
        id (str): The id attribute of the tag. Default is an empty string.
        class_ (str): The class attribute of the tag. Default is an empty string.
        tag_2 (str): A secondary tag to locate. Default is an empty string.
        is_get_text : A flag indicating whether to get text from the article directly from the tag.
        is_find_all (bool): Indicates if find_all should be used instead of find. Default is False.
        is_recursive (bool): Indicates if the search should be recursive. Default is False.
        special_tags (tuple[str, ...]): A tuple of special tags. Default is an empty tuple.
    """

    tag: str
    type: str = ""
    id: str = ""
    class_: str = ""
    tag_2: str = ""
    is_get_text: bool = False
    is_find_all: bool = False
    is_recursive: bool = False
    special_tags: tuple[str, ...] = field(default_factory=tuple)
    remove_tags: tuple[str, ...] = field(default_factory=tuple)
    


@dataclass
class MediaMap:
    """
    A class to represent media data for web scraping.
    Attributes:
    -----------
    scrape_method : str
        The method used for scraping the media data.
    locate_main_hrefs : LocateTags
        The tags used to locate the main hrefs in the media data.
    is_generic_href : bool
        A flag indicating whether to get any href.
    dismiss_hrefs : tuple[str, ...]
        A tuple of hrefs to be dismissed during scraping.
    locate_tags : dict[str, LocateTags]
        A dictionary of tags used to locate various elements in the media data.
    numeric_hrefs : int, optional
        If the href is only useful when it has numbers, like date numbers /2025/05/ (default is 0 meaning consider numbers in href is not useful).
    id : int, optional
        An identifier for the media data from the database(default is 0).
    """

    locate_main_hrefs: LocateTags
    locate_tags: dict[str, LocateTags]
    scrape_method: str = "get_article_with_tags"
    is_generic_href: bool = False
    target_hrefs: tuple[str, ...] = (
        "/article/",
        "/articles/",
        "/news/",
        "/world/",
        "/politics/",
        "/business/",
        "/culture/",
        "/economy/",
        "/opinion/",
        "/society/",
    )
    dismiss_hrefs: tuple[str, ...] = ('#',)
    numeric_hrefs: int = 0
    id: int = 0