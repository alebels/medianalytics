from pydantic import BaseModel, Field, HttpUrl, StringConstraints
from typing import Annotated
from config.constant_enums import (
    MediaTypeEnum,
    RegionsEnum,
    CountriesEnum,
)
from models.utils import ItemRead


class MediaItemRead(BaseModel):
    """
    Pydantic model for reading media items.
    """

    name: Annotated[str, StringConstraints(min_length=2, max_length=50)]
    full_name: Annotated[str, StringConstraints(min_length=2, max_length=150)] | None = None
    type: MediaTypeEnum
    country: CountriesEnum
    url: HttpUrl


class GeneralMedia(BaseModel):
    """
    Pydantic model for reading gather general table data.
    """

    id: int
    name: Annotated[str, StringConstraints(min_length=2, max_length=50)]
    full_name: Annotated[str, StringConstraints(min_length=2, max_length=150)] | None = None
    type: MediaTypeEnum
    region: RegionsEnum
    country: CountriesEnum
    url: HttpUrl
    total_articles: Annotated[int, Field(gt=0)]
    average_words_article: Annotated[int, Field(gt=0)]


class GeneralMediaItemRead(BaseModel):
    """
    Pydantic model for reading general table data.
    """

    name: Annotated[str, StringConstraints(min_length=2, max_length=50)]
    full_name: Annotated[str, StringConstraints(min_length=2, max_length=150)] | None = None
    type: MediaTypeEnum
    country: CountriesEnum
    region: RegionsEnum
    url: HttpUrl
    total_articles: Annotated[int, Field(gt=0)]
    average_words_article: Annotated[int, Field(gt=0)]
    top_words: list[ItemRead]
    top_sentiments: list[ItemRead]
    bottom_sentiments: list[ItemRead]
    top_ideologies: list[ItemRead]
    bottom_ideologies: list[ItemRead]
    top_grammar: list[ItemRead]