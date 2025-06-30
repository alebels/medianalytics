from datetime import date
from sqlalchemy import func, text, exists
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from utils.constants import C_SENTIMENTS, C_IDEOLOGIES
import models.py_schemas as schemas
import config.db_models as models


async def get_general_top_words(db: AsyncSession) -> list[schemas.ItemRead]:
    """
    Retrieve the top most repeated words.
    Args:
        db (AsyncSession): The database session.
    Returns:
        list[schemas.ItemRead]: A list of the top words.
    """
    result = await db.execute(
        select(models.Word.name, models.Word.count_repeated.label("count"))
        .where(models.Word.name != 'said')
        .order_by(models.Word.count_repeated.desc())
        .limit(100)
    )
    words = result.mappings().all()
    return [schemas.ItemRead.model_validate(word) for word in words]


async def get_general_bottom_words(db: AsyncSession) -> list[schemas.ItemRead]:
    """
    Retrieve the bottom most repeated words.
    Args:
        db (AsyncSession): The database session.
    Returns:
        list[schemas.ItemRead]: A list of the bottom words.
    """
    result = await db.execute(
        select(models.Word.name, models.Word.count_repeated.label("count"))
        .order_by(models.Word.count_repeated.asc())
        .limit(100)
    )
    words = result.mappings().all()
    return [schemas.ItemRead.model_validate(word) for word in words]


async def get_general_total_articles(db: AsyncSession) -> int:
    """
    Get the total count of articles in the database.
    Args:
        db (AsyncSession): The database session.
    Returns:
        int: The total number of articles.
    """
    result = await db.execute(select(func.count(models.Article.id)))
    return result.scalar()


async def get_general_total_medias(db: AsyncSession) -> int:
    """
    Get the total count of useful medias in the database.
    Args:
        db (AsyncSession): The database session.
    Returns:
        int: The total number of useful medias.
    """
    result = await db.execute(
        select(func.count(models.Media.id)).where(
            exists().where(models.Article.media_id == models.Media.id)
        )
    )
    return result.scalar()


async def get_general_total_words(db: AsyncSession) -> int:
    """
    Get the total count of words in the database.
    Args:
        db (AsyncSession): The database session.
    Returns:
        int: The total number of words.
    """
    result = await db.execute(select(func.count(models.Word.id)))
    return result.scalar()


async def get_general_average_word_count(db: AsyncSession) -> int:
    """
    Get the average word count across all articles.
    Args:
        db (AsyncSession): The database session.
    Returns:
        int: The average number of words per article.
    """
    result = await db.execute(select(func.round(func.avg(models.Article.count_words))))
    return result.scalar()


async def get_general_sentiments_ideologies(db: AsyncSession, type: str) -> list[schemas.ItemRead]:
    """
    Get the sentiments or ideologies by count across all articles.

    Args:
        db (AsyncSession): The database session.
    
    Returns:
        list[schemas.ItemRead]: A list of sentiment or ideology counts, ordered by frequency.
    """
    if type == C_SENTIMENTS:
        query = text("""
            SELECT unnest(sentiments) as name, COUNT(*) as count
            FROM public.article
            GROUP BY name
            ORDER BY count DESC
        """)
    elif type == C_IDEOLOGIES:
        query = text("""
            SELECT unnest(ideologies) as name, COUNT(*) as count
            FROM public.article
            GROUP BY name
            ORDER BY count DESC
        """)
    result = await db.execute(query)
    result_map = result.mappings().all()
    return [schemas.ItemRead.model_validate(item) for item in result_map]


async def get_general_top_grammar(db: AsyncSession) -> list[schemas.ItemRead]:
    """
    Get the top grammar types (parts of speech) by count.
    
    Args:
        db (AsyncSession): The database session.
    
    Returns:
        list[schemas.ItemRead]: A list of grammar types and their counts, ordered by frequency.
    """
    query = text("""
        SELECT UPPER(grammar) as name, SUM(count_repeated) as count
        FROM public.word
        WHERE UPPER(grammar) IN ('PROPN', 'NOUN', 'VERB', 'ADJ', 'ADV')
        GROUP BY UPPER(grammar)
        ORDER BY count DESC
    """)
    result = await db.execute(query)
    grammar_counts = result.mappings().all()
    return [schemas.ItemRead.model_validate(item) for item in grammar_counts]


async def get_general_media(db: AsyncSession) -> list[schemas.GeneralMedia]:
    """
    Get general table data including name, type, country, region and various statistics.
    
    Args:
        db (AsyncSession): The database session.
    
    Returns:
        list[schemas.GeneralMedia]: A list of general media items with complete statistics.
    """
    # Get basic media information with article counts and average word counts
    base_result = await db.execute(
        select(
            models.Media.id,
            models.Media.name,
            models.Media.full_name,
            models.Media.type,
            models.Media.country,
            models.Media.region,
            models.Media.url,
            func.count(models.Article.id).label("total_articles"),
            func.round(func.avg(models.Article.count_words)).label("average_words_article")
        )
        .join(models.Article, models.Article.media_id == models.Media.id)
        .group_by(models.Media.id)
        .order_by(models.Media.name.asc())
    )
    
    return [schemas.GeneralMedia.model_validate(item) for item in base_result.mappings().all()]


async def get_general_media_words(db: AsyncSession, id_media: int) -> list[schemas.ItemRead]:
    """
    Get the top words for a specific media item.
    
    Args:
        db (AsyncSession): The database session.
        id_media (int): The ID of the media to get top words for.
        
    Returns:
        list[schemas.ItemRead]: A list of the top 10 most repeated words for the media.
    """
    
    # Query to get top 10 most repeated words for a specific media
    query = text("""
        SELECT w.name, SUM(f.frequency) as count
        FROM word w
        JOIN facts f ON w.id = f.id_word
        JOIN article a ON a.id = f.id_article
        WHERE a.media_id = :media_id
        AND w.name != 'said'
        GROUP BY w.name
        ORDER BY count DESC, w.name
        LIMIT 10
    """)
    
    result = await db.execute(query, {"media_id": id_media})
    words = result.mappings().all()
    return [schemas.ItemRead.model_validate(word) for word in words]


async def get_general_media_top_sentiments_ideologies(db: AsyncSession, id_media: int, type: str) -> list[schemas.ItemRead]:
    """
    Get the top sentiments or ideologies for a specific media item.
    
    Args:
        db (AsyncSession): The database session.
        id_media (int): The ID of the media to get sentiments or ideologies for.
        type (str): The type to retrieve (C_SENTIMENTS or C_IDEOLOGIES).
        
    Returns:
        list[schemas.ItemRead]: A list of the top 5 sentiments or ideologies for the media.
    """
    
    if type == C_SENTIMENTS:
        query = text("""
            SELECT unnest(sentiments) as name, COUNT(*) as count
            FROM public.article
            WHERE media_id = :media_id
            GROUP BY name
            ORDER BY count DESC
            LIMIT 5
        """)
    elif type == C_IDEOLOGIES:
        query = text("""
            SELECT unnest(ideologies) as name, COUNT(*) as count
            FROM public.article
            WHERE media_id = :media_id
            GROUP BY name
            ORDER BY count DESC
            LIMIT 5
        """)
    
    result = await db.execute(query, {"media_id": id_media})
    items = result.mappings().all()
    return [schemas.ItemRead.model_validate(item) for item in items]


async def get_general_media_bottom_sentiments_ideologies(db: AsyncSession, id_media: int, type: str) -> list[schemas.ItemRead]:
    """
    Get the bottom sentiments or ideologies for a specific media item.
    
    Args:
        db (AsyncSession): The database session.
        id_media (int): The ID of the media to get sentiments or ideologies for.
        type (str): The type to retrieve (C_SENTIMENTS or C_IDEOLOGIES).
        
    Returns:
        list[schemas.ItemRead]: A list of the bottom 5 sentiments or ideologies for the media.
    """
    
    if type == C_SENTIMENTS:
        query = text("""
            SELECT unnest(sentiments) as name, COUNT(*) as count
            FROM public.article
            WHERE media_id = :media_id
            GROUP BY name
            ORDER BY count ASC
            LIMIT 5
        """)
    elif type == C_IDEOLOGIES:
        query = text("""
            SELECT unnest(ideologies) as name, COUNT(*) as count
            FROM public.article
            WHERE media_id = :media_id
            GROUP BY name
            ORDER BY count ASC
            LIMIT 5
        """)
    
    result = await db.execute(query, {"media_id": id_media})
    items = result.mappings().all()
    return [schemas.ItemRead.model_validate(item) for item in items]


async def get_general_media_top_grammar(db: AsyncSession, id_media: int) -> list[schemas.ItemRead]:
    """
    Get the top grammar types (parts of speech) for a specific media item.
    
    Args:
        db (AsyncSession): The database session.
        id_media (int): The ID of the media to get grammar types for.
        
    Returns:
        list[schemas.ItemRead]: A list of grammar types and their counts for the media.
    """
    
    query = text("""
        SELECT w.grammar as name, SUM(f.frequency) as count
        FROM public.word w
        JOIN public.facts f ON w.id = f.id_word
        JOIN public.article a ON a.id = f.id_article
        WHERE a.media_id = :media_id
        AND w.grammar IN ('PROPN', 'NOUN', 'VERB', 'ADJ', 'ADV')
        GROUP BY w.grammar
        ORDER BY count DESC
    """)
    
    result = await db.execute(query, {"media_id": id_media})
    grammar_counts = result.mappings().all()
    return [schemas.ItemRead.model_validate(item) for item in grammar_counts]


async def get_latest_insert_date(db: AsyncSession) -> date | None:
    """
    Get the latest insert_date from the articles table.
    
    Args:
        db (AsyncSession): The database session.
    
    Returns:
        date | None: The latest insert_date as a date object, or None if no articles exist.
    """
    result = await db.execute(select(func.max(models.Article.insert_date)))
    return result.scalar()  # Returns None if no articles exist


async def get_general_day_top_words(db: AsyncSession) -> list[schemas.ItemRead]:
    """
    Retrieve the top most repeated words for articles from the latest insert_date.
    Args:
        db (AsyncSession): The database session.
    Returns:
        list[schemas.ItemRead]: A list of the top words for the latest day.
    """
    # Get the latest insert_date from articles
    latest_date = await get_latest_insert_date(db)
    
    if latest_date is None:
        return []
    
    # Get top words for articles from the latest insert_date, using Facts table
    query = text("""
        SELECT w.name, SUM(f.frequency) as count
        FROM word w
        JOIN facts f ON w.id = f.id_word
        JOIN article a ON a.id = f.id_article
        WHERE a.insert_date = :latest_date
        AND w.name != 'said'
        GROUP BY w.name
        ORDER BY count DESC, w.name
        LIMIT 50
    """)
    
    result = await db.execute(query, {"latest_date": latest_date})
    words = result.mappings().all()
    return [schemas.ItemRead.model_validate(word) for word in words]


async def get_general_day_sentiments_ideologies(db: AsyncSession, type: str) -> list[schemas.ItemRead]:
    """
    Get the ideologies or sentiments by count for articles from the latest insert_date only.

    Args:
        db (AsyncSession): The database session.

    Returns:
        list[schemas.ItemRead]: A list of ideologies or sentiments counts for the latest day, ordered by frequency.
    """
    # Get the latest insert_date first
    latest_date = await get_latest_insert_date(db)

    if latest_date is None:
        return []
    
    if type == C_SENTIMENTS:
        query = text("""
            SELECT unnest(sentiments) as name, COUNT(*) as count
            FROM public.article
            WHERE insert_date = :latest_date
            GROUP BY name
            ORDER BY count DESC
        """)
    elif type == C_IDEOLOGIES:
        query = text("""
            SELECT unnest(ideologies) as name, COUNT(*) as count
            FROM public.article
            WHERE insert_date = :latest_date
            GROUP BY name
            ORDER BY count DESC
        """)

    result = await db.execute(query, {"latest_date": latest_date})
    result_map = result.mappings().all()
    return [schemas.ItemRead.model_validate(item) for item in result_map]