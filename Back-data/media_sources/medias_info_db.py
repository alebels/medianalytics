"""
This module contains information about different media sources and organizations.

The module defines a list of MediaInfo objects, each representing a media source 
or organization with details such as name, type, region, country, and URL.
This information is used to track and categorize media sources throughout the application.

The final MEDIAS_INFO is a tuple (immutable) version of the list to prevent modification.
"""

from config.constant_enums import MediaTypeEnum, RegionsEnum, CountriesEnum
from models.py_schemas import MediaInfo

_MEDIAS_INFO_LIST: list[MediaInfo] = [
    MediaInfo(
        name="El País",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.EUROPE,
        country=CountriesEnum.SPAIN,
        url="https://english.elpais.com/"
    ),
    MediaInfo(
        name="BBC",
        full_name="British Broadcasting Corporation",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.EUROPE, 
        country=CountriesEnum.UNITED_KINGDOM,
        url="https://www.bbc.com/"
    ),
    MediaInfo(
        name="Al Jazeera",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.MIDDLE_EAST,
        country=CountriesEnum.QATAR, 
        url="https://www.aljazeera.com/"
    ),
    MediaInfo(
        name="The Guardian",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.EUROPE,
        country=CountriesEnum.UNITED_KINGDOM,
        url="https://www.theguardian.com/"
    ),
    MediaInfo(
        name="NBC",
        full_name="National Broadcasting Company",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.NORTH_AMERICA,
        country=CountriesEnum.UNITED_STATES,
        url="https://www.nbcnews.com/"
    ),
    MediaInfo(
        name="AP",
        full_name="Associated Press",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.NORTH_AMERICA,
        country=CountriesEnum.UNITED_STATES,
        url="https://apnews.com/"
    ),
    MediaInfo(
        name="CBS",
        full_name="Columbia Broadcasting System",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.NORTH_AMERICA,
        country=CountriesEnum.UNITED_STATES,
        url="https://www.cbsnews.com/"
    ),
    MediaInfo(
        name="Fox News",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.NORTH_AMERICA,
        country=CountriesEnum.UNITED_STATES,
        url="https://www.foxnews.com/world"
    ),
    MediaInfo(
        name="CNN",
        full_name="Cable News Network",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.NORTH_AMERICA,
        country=CountriesEnum.UNITED_STATES,
        url="https://edition.cnn.com/"
    ),
    MediaInfo(
        name="POLITICO",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.EUROPE,
        country=CountriesEnum.BELGIUM,
        url="https://www.politico.eu/"
    ),
    MediaInfo(
        name="DW",
        full_name="Deutsche Welle",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.EUROPE,
        country=CountriesEnum.GERMANY,
        url="https://www.dw.com/en/top-stories/s-9097"
    ),
    MediaInfo(
        name="France 24",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.EUROPE,
        country=CountriesEnum.FRANCE,
        url="https://www.france24.com/"
    ),
    MediaInfo(
        name="China Daily",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.EAST_ASIA,
        country=CountriesEnum.CHINA,
        url="https://www.chinadaily.com.cn/world"
    ),
    MediaInfo(
        name="Xinhua",
        full_name="New China News Agency",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.EAST_ASIA,
        country=CountriesEnum.CHINA,
        url="https://english.news.cn/home.htm"
    ),
    MediaInfo(
        name="Global Times",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.EAST_ASIA,
        country=CountriesEnum.CHINA,
        url="https://www.globaltimes.cn/index.html"
    ),
    MediaInfo(
        name="Hindustan Times",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.SOUTHEAST_ASIA,
        country=CountriesEnum.INDIA,
        url="https://www.hindustantimes.com/"
    ),
    MediaInfo(
        name="The Japan News",
        full_name="By The Yomiuri Shimbun",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.EAST_ASIA,
        country=CountriesEnum.JAPAN,
        url="https://japannews.yomiuri.co.jp/"
    ),
    MediaInfo(
        name="RT",
        full_name="Russia Today",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.EUROPE,
        country=CountriesEnum.RUSSIA,
        url="https://www.rt.com/"
    ),
    MediaInfo(
        name="Hürriyet Daily News",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.MIDDLE_EAST,
        country=CountriesEnum.TURKEY,
        url="https://www.hurriyetdailynews.com/"
    ),
    MediaInfo(
        name="The Times of Israel",
        type=MediaTypeEnum.MEDIA,
        region=RegionsEnum.MIDDLE_EAST,
        country=CountriesEnum.ISRAEL,
        url="https://www.timesofisrael.com/"
    ),
    MediaInfo(
        name="IMF",
        full_name="International Monetary Fund",
        type=MediaTypeEnum.ORGANIZATION,
        region=RegionsEnum.INTERNATIONAL,
        country=CountriesEnum.INTERNATIONAL,
        url="https://www.imf.org/en/News"
    ),
    MediaInfo(
        name="WEF",
        full_name="World Economic Forum",
        type=MediaTypeEnum.ORGANIZATION,
        region=RegionsEnum.INTERNATIONAL,
        country=CountriesEnum.INTERNATIONAL,
        url="https://www.weforum.org/stories"
    ),
    MediaInfo(
        name="UN",
        full_name="United Nations",
        type=MediaTypeEnum.ORGANIZATION,
        region=RegionsEnum.INTERNATIONAL,
        country=CountriesEnum.INTERNATIONAL,
        url="https://news.un.org/en/"
    ),
]

# Make it immutable
MEDIAS_INFO = tuple(_MEDIAS_INFO_LIST)