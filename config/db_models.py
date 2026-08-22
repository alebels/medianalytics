"""
This module defines the database models for the web scraping project.
"""

from datetime import date
from sqlalchemy import (
    Boolean,
    Integer,
    PrimaryKeyConstraint,
    String,
    Text,
    SmallInteger,
    Date,
    func,
    Index,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column


class Base(DeclarativeBase):
    """
    Base class for all database models.
    """

    pass


class Region(Base):
    """
    Database model for regions.
    """

    __tablename__ = "region"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    region: Mapped[str] = mapped_column(String(80), unique=True)
    icon: Mapped[str] = mapped_column(String(50), unique=True, nullable=True)


class Country(Base):
    """
    Database model for countries.
    """

    __tablename__ = "country"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    country: Mapped[str] = mapped_column(String(80), unique=True)
    icon: Mapped[str] = mapped_column(String(50), unique=True, nullable=True)


class MediaType(Base):
    """
    Database model for media types.
    """

    __tablename__ = "media_type"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String(80), unique=True)
    icon: Mapped[str] = mapped_column(String(50), unique=True)


class Media(Base):
    """
    Database model for media.
    """

    __tablename__ = "media"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), unique=True, nullable=True, default=None)
    url: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    logo: Mapped[str] = mapped_column(String(150), unique=True, nullable=True, default=None)
    type_id: Mapped[int] = mapped_column(ForeignKey("media_type.id"), index=True)
    region_id: Mapped[int] = mapped_column(ForeignKey("region.id"), index=True)
    country_id: Mapped[int] = mapped_column(ForeignKey("country.id"), index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    insert_date: Mapped[date] = mapped_column(
        Date, index=True, server_default=func.current_date() # TODO: Check this
    )


class Article(Base):
    """
    Database model for articles.
    """

    __tablename__ = "article"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    media_id: Mapped[SmallInteger] = mapped_column(ForeignKey("media.id"), index=True)
    title: Mapped[str] = mapped_column(String(350), index=True)
    url: Mapped[str] = mapped_column(String(600), unique=True, index=True)
    article: Mapped[str] = mapped_column(Text)
    sentiments: Mapped[list[str]] = mapped_column(ARRAY(String(80)))
    ideologies: Mapped[list[str]] = mapped_column(ARRAY(String(80)))
    common_words: Mapped[dict] = mapped_column(JSONB)
    entities: Mapped[dict] = mapped_column(JSONB)
    count_words: Mapped[int] = mapped_column(Integer, index=True)
    length: Mapped[int] = mapped_column(Integer , index=True)
    insert_date: Mapped[date] = mapped_column(
        Date, index=True, server_default=func.current_date() # TODO: Check this
    )

    __table_args__ = (
        Index(
            "ix_articles_sentiments",
            "sentiments",
            postgresql_using="gin"
        ),
        Index(
            "ix_articles_ideology_orientations",
            "ideologies",
            postgresql_using="gin",
        ),
        Index(
            "idx_common_words",
            "common_words",
            postgresql_using="gin",
            postgresql_ops={"common_words": "jsonb_ops"},
        ),
        Index(
            "idx_entities",
            "entities",
            postgresql_using="gin",
            postgresql_ops={"entities": "jsonb_ops"},
        )
    )


class Word(Base):
    """
    Database model for words.
    """

    __tablename__ = "word"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(70), unique=True, index=True)
    grammar: Mapped[str] = mapped_column(String(30), index=True)
    count_repeated: Mapped[int] = mapped_column(Integer, index=True)


class Facts(Base):
    """
    Database model for facts.
    """

    __tablename__ = "facts"

    id_article: Mapped[int] = mapped_column(ForeignKey("article.id"), index=True)
    id_word: Mapped[int] = mapped_column(ForeignKey("word.id"), index=True)
    frequency: Mapped[int] = mapped_column(SmallInteger, index=True)
    __table_args__ = (PrimaryKeyConstraint("id_article", "id_word"),)


class SentimentCategory(Base):
    """
    Database model for sentiments categories.
    """

    __tablename__ = "sentiment_category"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(80), unique=True)
    color: Mapped[str] = mapped_column(String(10), unique=True)
    icon: Mapped[str] = mapped_column(String(50), unique=True)


class Sentiment(Base):
    """
    Database model for sentiments values.
    """

    __tablename__ = "sentiment"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_category: Mapped[int] = mapped_column(ForeignKey("sentiment_category.id"))
    sentiment: Mapped[str] = mapped_column(String(80), unique=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class IdeologyCategory(Base):
    """
    Database model for ideologies categories.
    """

    __tablename__ = "ideology_category"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    category: Mapped[str] = mapped_column(String(80), unique=True)
    color: Mapped[str] = mapped_column(String(10), unique=True)
    icon: Mapped[str] = mapped_column(String(50), unique=True)


class Ideology(Base):
    """
    Database model for ideologies values.
    """

    __tablename__ = "ideology"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id_category: Mapped[int] = mapped_column(ForeignKey("ideology_category.id"))
    ideology: Mapped[str] = mapped_column(String(80), unique=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
