"""
This module contains Pydantic models for media, articles, words, and facts schemas.
"""

from datetime import date
from pydantic import BaseModel, Field, HttpUrl, StringConstraints
from typing import Annotated

# TODO: Split this file into multiple files for better organization and maintainability.

# ----------------- MEDIA -----------------
class MediaInfo(BaseModel):
    """
    Pydantic model for media info schema.
    """
    
    name: Annotated[str, StringConstraints(min_length=2, max_length=50)]
    full_name: Annotated[str, StringConstraints(min_length=2, max_length=150)] | None = None
    url: HttpUrl
    type: Annotated[str, StringConstraints(min_length=2, max_length=80)]
    region: Annotated[str, StringConstraints(min_length=2, max_length=80)]
    country: Annotated[str, StringConstraints(min_length=2, max_length=80)]


class MediaCompose(BaseModel):
    """
    Pydantic model for media compose schema.
    """

    id: int
    url: HttpUrl

    class Config:
        """
        Configuration for MediaCompose model.
        """

        from_attributes = True


# ----------------- ARTICLE -----------------
class ArticleBase(BaseModel):
    """
    Pydantic model for article base schema.
    """

    media_id: int
    title: Annotated[str, StringConstraints(min_length=3, max_length=350)]
    url: HttpUrl
    article: Annotated[str, StringConstraints(min_length=3, max_length=40000)]
    sentiments: list[Annotated[str, StringConstraints(min_length=2, max_length=80)]]
    ideologies: list[Annotated[str, StringConstraints(min_length=2, max_length=80)]]
    common_words: dict[str, int]
    entities: dict[str, dict]
    count_words: int
    length: int
    insert_date: date = Field(default_factory=date.today)


class ArticleText(BaseModel):
    """
    Pydantic model for article text schema.
    """

    article: Annotated[str, StringConstraints(min_length=3, max_length=40000)]
    common_words: dict[str, int]
    entities: dict[str, dict]
    count_words: int
    length: int
    frequency_words: dict[str, int]
    pos_tags: dict[str, str]


class ArticleAi(BaseModel):
    """
    Pydantic model for article AI schema.
    """

    sentiments: list[Annotated[str, StringConstraints(min_length=2, max_length=80)]]
    ideologies: list[Annotated[str, StringConstraints(min_length=2, max_length=80)]]


class ArticleCreate(ArticleBase):
    """
    Pydantic model for creating an article.
    """

    pass


# ----------------- WORD -----------------
class WordBase(BaseModel):
    """
    Pydantic model for word base schema.
    """

    name: Annotated[str, StringConstraints(min_length=2, max_length=70)]
    grammar: Annotated[str, StringConstraints(min_length=1, max_length=30)]
    count_repeated: Annotated[int, Field(gt=0)]


class WordCreate(WordBase):
    """
    Pydantic model for creating a word.
    """

    pass


# ----------------- FACTS -----------------
class FactsBase(BaseModel):
    """
    Pydantic model for facts base schema.
    """

    id_article: int
    id_word: int
    frequency: Annotated[int, Field(gt=0)]


class FactsCreate(FactsBase):
    """
    Pydantic model for creating facts.
    """

    pass


# ----------------- SENTIMENTS -----------------
class SentimentCategoryBase(BaseModel):
    """
    Pydantic model for reading sentiment categories.
    """

    category: Annotated[str, StringConstraints(min_length=2, max_length=80)]
    color: Annotated[str, StringConstraints(min_length=1, max_length=10)]
    icon: Annotated[str, StringConstraints(min_length=1, max_length=50)]


class SentimentBase(BaseModel):
    """
    Pydantic model for reading sentiment values.
    """

    id_category: int | None = None
    sentiment: Annotated[str, StringConstraints(min_length=2, max_length=80)]
    active: bool = True


# ----------------- IDEOLOGIES -----------------
class IdeologyCategoryBase(BaseModel):
    """
    Pydantic model for reading ideology categories.
    """

    category: Annotated[str, StringConstraints(min_length=2, max_length=80)]
    color: Annotated[str, StringConstraints(min_length=1, max_length=10)]
    icon: Annotated[str, StringConstraints(min_length=1, max_length=50)]


class IdeologyBase(BaseModel):
    """
    Pydantic model for reading ideology values.
    """

    id_category: int | None = None
    ideology: Annotated[str, StringConstraints(min_length=2, max_length=80)]
    active: bool = True