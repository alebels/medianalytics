"""
This module defines the database models for the web scraping project.
"""

from datetime import date
from sqlalchemy import (
    Boolean,
    Enum as SQLAlchemyEnum,
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
from config.constant_enums import (
    MediaTypeEnum,
    RegionsEnum,
    CountriesEnum
)
from config.sentiments_ideologies_enums import (
    SentimentsEnum,
    IdeologiesEnum
)


class Base(DeclarativeBase):
    """
    Base class for all database models.
    """

    pass


class Media(Base):
    """
    Database model for media.
    """

    __tablename__ = "media"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150), unique=True, nullable=True, default=None)
    url: Mapped[str] = mapped_column(String(80), unique=True)
    type: Mapped[str] = mapped_column(SQLAlchemyEnum(MediaTypeEnum), index=True)
    region: Mapped[str] = mapped_column(SQLAlchemyEnum(RegionsEnum), index=True)
    country: Mapped[str] = mapped_column(SQLAlchemyEnum(CountriesEnum), index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Article(Base):
    """
    Database model for articles.
    """

    __tablename__ = "article"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    media_id: Mapped[SmallInteger] = mapped_column(ForeignKey("media.id"))
    title: Mapped[str] = mapped_column(String(350))
    url: Mapped[str] = mapped_column(String(600), unique=True)
    article: Mapped[str] = mapped_column(Text)
    sentiments: Mapped[list[SentimentsEnum]] = mapped_column(
        ARRAY(
            SQLAlchemyEnum(
                SentimentsEnum, 
                name="sentimentsenum", 
                create_type=True
            )
        )
    )
    ideologies: Mapped[list[IdeologiesEnum]] = mapped_column(
        ARRAY(
            SQLAlchemyEnum(
                IdeologiesEnum,
                name="ideologiesenum",
                create_type=True,
            )
        )
    )
    common_words: Mapped[dict] = mapped_column(JSONB)
    entities: Mapped[dict] = mapped_column(JSONB)
    count_words: Mapped[int] = mapped_column(Integer, index=True)
    length: Mapped[int] = mapped_column(Integer)
    insert_date: Mapped[date] = mapped_column(
        Date, index=True, default=func.current_date
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
    grammar: Mapped[str] = mapped_column(String(30))
    count_repeated: Mapped[int] = mapped_column(Integer, index=True)


class Facts(Base):
    """
    Database model for facts.
    """

    __tablename__ = "facts"

    id_article: Mapped[int] = mapped_column(ForeignKey("article.id"), index=True)
    id_word: Mapped[int] = mapped_column(ForeignKey("word.id"), index=True)
    frequency: Mapped[int] = mapped_column(SmallInteger)
    __table_args__ = (PrimaryKeyConstraint("id_article", "id_word"),)