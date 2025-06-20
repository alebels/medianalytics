"""
This module contains repository functions for interacting with the database.
"""

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import SQLAlchemyError
from repository.database import get_session
import models.py_schemas as schemas
import config.db_models as models


async def get_media_id_url() -> list[schemas.MediaCompose]:
    """
    Retrieve a list of media IDs and URLs from the database.
    Returns:
        list[schemas.MediaCompose]: A list of media IDs and URLs.
    """
    async for db in get_session():
        result = await db.execute(select(models.Media.id, models.Media.url).filter(models.Media.active.is_(True)))
        medias = result.all()
        return [schemas.MediaCompose.model_validate(media).model_dump() for media in medias]


async def get_media_id_url_by_id(media_id: int) -> list[schemas.MediaCompose]:
    """
    Retrieve a specific media by its ID from the database.
    
    Args:
        media_id (int): The ID of the media to retrieve.
        
    Returns:
        list[schemas.MediaCompose]: A list containing the media data if found, empty list otherwise.
    """
    async for db in get_session():
        result = await db.execute(
            select(models.Media.id, models.Media.url)
            .filter(models.Media.id == media_id)
        )
        media = result.first()
        return [schemas.MediaCompose.model_validate(media).model_dump()] if media else []


async def update_media_active(media_id: int) -> bool:
    """
    Update a media's active status to false.
    Args:
        media_id (int): The ID of the media to update.
    Returns:
        bool: True if the update was successful, False if media not found.
    """
    async for db in get_session():
        try:
            media = await db.get(models.Media, media_id)
            if media is None:
                return False
            media.active = False
            await db.commit()
            return True
        except SQLAlchemyError:
            await db.rollback()
            return False


async def insert_article(db: AsyncSession, db_article: models.Article) -> int:
    """
    Insert an article into the database.
    Args:
        db (AsyncSession): The database session.
        db_article (models.Article): The article data to be inserted.
    Returns:
        int: The ID of the inserted article.
    Raises:
        SQLAlchemyError: If the article insertion fails.
    """
    stmt_article = (
        insert(models.Article)
        .values(
            media_id=db_article.media_id,
            title=db_article.title,
            url=db_article.url,
            article=db_article.article,
            sentiments=db_article.sentiments,
            ideologies=db_article.ideologies,
            common_words=db_article.common_words,
            entities=db_article.entities,
            count_words=db_article.count_words,
            length=db_article.length,
            insert_date=db_article.insert_date,
        )
        .on_conflict_do_nothing(index_elements=["url"])
        .returning(models.Article.id)
    )

    result_article = await db.execute(stmt_article)
    inserted_article_id = result_article.scalar()
    if inserted_article_id is None:
        raise SQLAlchemyError("Article insertion failed.")
    return inserted_article_id


async def insert_words_and_facts(
    db: AsyncSession,
    article_id: int,
    frequency_words: dict[str, int],
    pos_tags: dict[str, str],
) -> None:
    """
    Insert words and facts into the database.
    Args:
        db (AsyncSession): The database session.
        article_id (int): The ID of the article.
        frequency_words (dict[str, int]): A dictionary of words and their frequencies.
        pos_tags (dict[str, str]): A dictionary of words and their part-of-speech tags.
    Returns:
        None
    """
    for word, count in frequency_words.items():
        word_sche = schemas.WordCreate(
            name=word, grammar=pos_tags.get(word, "unknown"), count_repeated=count
        )
        stmt_word = (
            insert(models.Word)
            .values(
                name=word_sche.name,
                grammar=word_sche.grammar,
                count_repeated=word_sche.count_repeated,
            )
            .on_conflict_do_update(
                index_elements=["name"],
                set_={
                    "count_repeated": models.Word.count_repeated
                    + word_sche.count_repeated
                },
            )
            .returning(models.Word.id)
        )
        result_word = await db.execute(stmt_word)
        word_id = result_word.scalar()

        if word_id is None:
            raise SQLAlchemyError("Words insertion or update failed.")

        fact_sche = schemas.FactsCreate(
            id_article=article_id, id_word=word_id, frequency=count
        )
        stmt_fact = insert(models.Facts).values(
            id_article=fact_sche.id_article,
            id_word=fact_sche.id_word,
            frequency=fact_sche.frequency,
        )
        await db.execute(stmt_fact)


async def create_article_with_words_and_facts(
    article: schemas.ArticleCreate,
    frequency_words: dict[str, int],
    pos_tags: dict[str, str],
) -> None:
    """
    Create an article with associated words and facts in the database.
    Args:
        article (schemas.ArticleCreate): The article data to be inserted.
        frequency_words (dict[str, int]): A dictionary of words and their frequencies.
        pos_tags (dict[str, str]): A dictionary of words and their part-of-speech tags.
    Returns:
        None
    """
    db_article = models.Article(**article.model_dump())
    db_article.url = str(db_article.url)

    async for db in get_session():
        async with db.begin():
            try:
                article_id = await insert_article(db, db_article)
                await insert_words_and_facts(db, article_id, frequency_words, pos_tags)
                await db.commit()
            except SQLAlchemyError as e:
                await db.rollback()
                raise e


async def check_article_exists(url: str) -> bool:
    """
    Check if an article with the given URL already exists in the database.
    Args:
        url (str): The URL of the article.
    Returns:
        bool: True if the article exists, otherwise False.
    """
    async for db in get_session():
        result = await db.execute(select(models.Article.url).filter(models.Article.url == url.strip()))
        return result.scalar() is not None
