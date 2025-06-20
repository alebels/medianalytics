from sqlalchemy import func, text, exists
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
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


async def get_general_sentiments(db: AsyncSession) -> list[schemas.ItemRead]:
    """
    Get the sentiments by count across all articles.
    
    Args:
        db (AsyncSession): The database session.
    
    Returns:
        list[schemas.ItemRead]: A list of sentiment counts, ordered by frequency.
    """
    query = text("""
        SELECT unnest(sentiments) as name, COUNT(*) as count
        FROM public.article
        GROUP BY name
        ORDER BY count DESC
    """)
    result = await db.execute(query)
    sentiment_counts = result.mappings().all()
    return [schemas.ItemRead.model_validate(item) for item in sentiment_counts]


async def get_general_ideologies(db: AsyncSession) -> list[schemas.ItemRead]:
    """
    Get the ideologies by count across all articles.

    Args:
        db (AsyncSession): The database session.

    Returns:
        list[schemas.ItemRead]: A list of ideologies counts, ordered by frequency.
    """
    query = text("""
        SELECT unnest(ideologies) as name, COUNT(*) as count
        FROM public.article
        GROUP BY name
        ORDER BY count DESC
    """)
    result = await db.execute(query)
    ideologies_counts = result.mappings().all()
    return [schemas.ItemRead.model_validate(item) for item in ideologies_counts]


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


async def get_general_media_top_sentiments(db: AsyncSession, id_media: int) -> list[schemas.ItemRead]:
    """
    Get the top sentiments for a specific media item.
    
    Args:
        db (AsyncSession): The database session.
        id_media (int): The ID of the media to get sentiments for.
        
    Returns:
        list[schemas.ItemRead]: A list of the top 10 sentiments for the media.
    """
    
    # Query to get top 10 most repeated sentiments for a specific media
    query = text("""
        SELECT unnest(sentiments) as name, COUNT(*) as count
        FROM public.article
        WHERE media_id = :media_id
        GROUP BY name
        ORDER BY count DESC
        LIMIT 5
    """)
    
    result = await db.execute(query, {"media_id": id_media})
    sentiments = result.mappings().all()
    return [schemas.ItemRead.model_validate(sentiment) for sentiment in sentiments]


async def get_general_media_bottom_sentiments(db: AsyncSession, id_media: int) -> list[schemas.ItemRead]:
    """
    Get the bottom sentiments for a specific media item.
    
    Args:
        db (AsyncSession): The database session.
        id_media (int): The ID of the media to get sentiments for.
        
    Returns:
        list[schemas.ItemRead]: A list of the bottom 10 sentiments for the media.
    """
    
    # Query to get bottom 10 least repeated sentiments for a specific media
    query = text("""
        SELECT unnest(sentiments) as name, COUNT(*) as count
        FROM public.article
        WHERE media_id = :media_id
        GROUP BY name
        ORDER BY count ASC
        LIMIT 5
    """)
    
    result = await db.execute(query, {"media_id": id_media})
    sentiments = result.mappings().all()
    return [schemas.ItemRead.model_validate(sentiment) for sentiment in sentiments]


async def get_general_media_top_ideologies(db: AsyncSession, id_media: int) -> list[schemas.ItemRead]:
    """
    Get the top ideologies for a specific media item.
    
    Args:
        db (AsyncSession): The database session.
        id_media (int): The ID of the media to get ideologies for.
        
    Returns:
        list[schemas.ItemRead]: A list of the top 10 ideologies for the media.
    """
    
    # Query to get top 10 most repeated ideologies for a specific media
    query = text("""
        SELECT unnest(ideologies) as name, COUNT(*) as count
        FROM public.article
        WHERE media_id = :media_id
        GROUP BY name
        ORDER BY count DESC
        LIMIT 5
    """)
    
    result = await db.execute(query, {"media_id": id_media})
    ideologies = result.mappings().all()
    return [schemas.ItemRead.model_validate(ideology) for ideology in ideologies]


async def get_general_media_bottom_ideologies(db: AsyncSession, id_media: int) -> list[schemas.ItemRead]:
    """
    Get the bottom ideologies for a specific media item.
    
    Args:
        db (AsyncSession): The database session.
        id_media (int): The ID of the media to get ideologies for.
        
    Returns:
        list[schemas.ItemRead]: A list of the bottom 10 ideologies for the media.
    """
    
    # Query to get bottom 10 least repeated ideologies for a specific media
    query = text("""
        SELECT unnest(ideologies) as name, COUNT(*) as count
        FROM public.article
        WHERE media_id = :media_id
        GROUP BY name
        ORDER BY count ASC
        LIMIT 5
    """)
    
    result = await db.execute(query, {"media_id": id_media})
    ideologies = result.mappings().all()
    return [schemas.ItemRead.model_validate(ideology) for ideology in ideologies]


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