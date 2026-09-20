"""
This module contains information about different media sources and organizations.

The module defines a list of MediaInfo objects, each representing a media source 
or organization with details such as name, type, region, country, and URL.
This information is used to track and categorize media sources throughout the application.

The final MEDIAS_INFO is a tuple (immutable) version of the list to prevent modification.
"""

from models.py_schemas import MediaInfo

_MEDIAS_INFO_LIST: list[MediaInfo] = [
    MediaInfo(
        name="El País",
        type="MEDIA",
        region="EUROPE",
        country="SPAIN",
        url="https://english.elpais.com/"
    ),
    MediaInfo(
        name="BBC",
        full_name="British Broadcasting Corporation",
        type="MEDIA",
        region="EUROPE",
        country="UNITED_KINGDOM",
        url="https://www.bbc.com/"
    ),
    MediaInfo(
        name="Al Jazeera",
        type="MEDIA",
        region="MIDDLE_EAST",
        country="QATAR",
        url="https://www.aljazeera.com/"
    ),
    MediaInfo(
        name="The Guardian",
        type="MEDIA",
        region="EUROPE",
        country="UNITED_KINGDOM",
        url="https://www.theguardian.com/"
    ),
    MediaInfo(
        name="NBC",
        full_name="National Broadcasting Company",
        type="MEDIA",
        region="NORTH_AMERICA",
        country="UNITED_STATES",
        url="https://www.nbcnews.com/"
    ),
    MediaInfo(
        name="AP",
        full_name="Associated Press",
        type="MEDIA",
        region="NORTH_AMERICA",
        country="UNITED_STATES",
        url="https://apnews.com/"
    ),
    MediaInfo(
        name="CBS",
        full_name="Columbia Broadcasting System",
        type="MEDIA",
        region="NORTH_AMERICA",
        country="UNITED_STATES",
        url="https://www.cbsnews.com/"
    ),
    MediaInfo(
        name="Fox News",
        type="MEDIA",
        region="NORTH_AMERICA",
        country="UNITED_STATES",
        url="https://www.foxnews.com/world"
    ),
    MediaInfo(
        name="CNN",
        full_name="Cable News Network",
        type="MEDIA",
        region="NORTH_AMERICA",
        country="UNITED_STATES",
        url="https://edition.cnn.com/"
    ),
    MediaInfo(
        name="POLITICO",
        type="MEDIA",
        region="EUROPE",
        country="BELGIUM",
        url="https://www.politico.eu/"
    ),
    MediaInfo(
        name="DW",
        full_name="Deutsche Welle",
        type="MEDIA",
        region="EUROPE",
        country="GERMANY",
        url="https://www.dw.com/en/top-stories/s-9097"
    ),
    MediaInfo(
        name="France 24",
        type="MEDIA",
        region="EUROPE",
        country="FRANCE",
        url="https://www.france24.com/"
    ),
    MediaInfo(
        name="China Daily",
        type="MEDIA",
        region="EAST_ASIA",
        country="CHINA",
        url="https://www.chinadaily.com.cn/world"
    ),
    MediaInfo(
        name="Xinhua",
        full_name="New China News Agency",
        type="MEDIA",
        region="EAST_ASIA",
        country="CHINA",
        url="https://english.news.cn/home.htm"
    ),
    MediaInfo(
        name="Global Times",
        type="MEDIA",
        region="EAST_ASIA",
        country="CHINA",
        url="https://www.globaltimes.cn/index.html"
    ),
    MediaInfo(
        name="Hindustan Times",
        type="MEDIA",
        region="SOUTHEAST_ASIA",
        country="INDIA",
        url="https://www.hindustantimes.com/"
    ),
    MediaInfo(
        name="The Japan News",
        full_name="By The Yomiuri Shimbun",
        type="MEDIA",
        region="EAST_ASIA",
        country="JAPAN",
        url="https://japannews.yomiuri.co.jp/world/"
    ),
    MediaInfo(
        name="RT",
        full_name="Russia Today",
        type="MEDIA",
        region="EUROPE",
        country="RUSSIA",
        url="https://www.rt.com/"
    ),
    MediaInfo(
        name="Hürriyet Daily News",
        type="MEDIA",
        region="MIDDLE_EAST",
        country="TURKEY",
        url="https://www.hurriyetdailynews.com/"
    ),
    MediaInfo(
        name="The Times of Israel",
        type="MEDIA",
        region="MIDDLE_EAST",
        country="ISRAEL",
        url="https://www.timesofisrael.com/"
    ),
    MediaInfo(
        name="IMF",
        full_name="International Monetary Fund",
        type="ORGANIZATION",
        region="INTERNATIONAL",
        country="INTERNATIONAL",
        url="https://www.imf.org/en/News"
    ),
    MediaInfo(
        name="WEF",
        full_name="World Economic Forum",
        type="ORGANIZATION",
        region="INTERNATIONAL",
        country="INTERNATIONAL",
        url="https://www.weforum.org/stories"
    ),
    MediaInfo(
        name="UN",
        full_name="United Nations",
        type="ORGANIZATION",
        region="INTERNATIONAL",
        country="INTERNATIONAL",
        url="https://news.un.org/en/"
    ),
    MediaInfo(
        name="Press TV",
        type="MEDIA",
        region="MIDDLE_EAST",
        country="IRAN",
        url="https://www.presstv.ir/"
    ),
]

# Make it immutable
MEDIAS_INFO = tuple(_MEDIAS_INFO_LIST)