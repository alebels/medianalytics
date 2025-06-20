from sqlalchemy.ext.asyncio import AsyncSession
import models.py_schemas as schemas
import repository.home as repo
from utils.utils import categorize_items


async def get_compound_sentiments(db: AsyncSession) -> schemas.CompoundRead:
    """Get compound sentiments with both plain and categorized data."""
    from services.filters import SENTIMENTS_IDEOLOGIES_CATEGORIZED
    
    # Get plain sentiments data
    plain_sentiments = await repo.get_general_sentiments(db)
    
    # Get categorized sentiments using the reusable function
    categorized_sentiments = categorize_items(
        plain_sentiments, 
        SENTIMENTS_IDEOLOGIES_CATEGORIZED.sentiments
    )
    
    return schemas.CompoundRead(
        plain=plain_sentiments,
        categorized=categorized_sentiments
    )


async def get_compound_ideologies(db: AsyncSession) -> schemas.CompoundRead:
    """Get compound ideologies with both plain and categorized data."""
    from services.filters import SENTIMENTS_IDEOLOGIES_CATEGORIZED
    
    # Get plain ideologies data
    plain_ideologies = await repo.get_general_ideologies(db)
    
    # Get categorized ideologies using the reusable function
    categorized_ideologies = categorize_items(
        plain_ideologies, 
        SENTIMENTS_IDEOLOGIES_CATEGORIZED.ideologies
    )
    
    return schemas.CompoundRead(
        plain=plain_ideologies,
        categorized=categorized_ideologies
    )


async def get_grammar_percentages(db: AsyncSession, id_media: int) -> list[schemas.ItemRead]:
    """
    Get grammar percentages data.
    Args:
        db (AsyncSession): The database session.
    Returns:
        list[schemas.ItemRead]: A list of grammar percentages with counts converted to percentages.
    """
    grammar_counts = await repo.get_general_media_top_grammar(db, id_media)
    
    # Calculate the total sum
    total_count = sum(item.count for item in grammar_counts)
    
    # Convert counts to percentages
    result = []
    if total_count > 0:  # Avoid division by zero
        for item in grammar_counts:
            percentage = (item.count / total_count) * 100
            result.append(schemas.ItemRead(name=item.name, count=round(percentage, 1)))
    
    return result


async def get_general_table(db: AsyncSession) -> list[schemas.GeneralMediaItemRead]:
    """
    Get general table data including name, type, and country.
    Args:
        db (AsyncSession): The database session.
    Returns:
        list[schemas.GeneralMediaItemRead]: A list of general media items.
    """
    general_media = await repo.get_general_media(db)
    
    result = []
    
    for item in general_media:
        top_words = await repo.get_general_media_words(db, item.id)
        top_sentiments = await repo.get_general_media_top_sentiments(db, item.id)
        bottom_sentiments = await repo.get_general_media_bottom_sentiments(db, item.id)
        top_ideologies = await repo.get_general_media_top_ideologies(db, item.id)
        bottom_ideologies = await repo.get_general_media_bottom_ideologies(db, item.id)
        top_grammar = await get_grammar_percentages(db, item.id)
        
        # Create and append the validated item
        media_item = schemas.GeneralMediaItemRead(
            name=item.name,
            full_name=item.full_name,
            type=item.type,
            country=item.country,
            region=item.region,
            url=item.url,
            total_articles=item.total_articles,
            average_words_article=item.average_words_article,
            top_words=top_words,
            top_sentiments=top_sentiments,
            bottom_sentiments=bottom_sentiments,
            top_ideologies=top_ideologies,
            bottom_ideologies=bottom_ideologies,
            top_grammar=top_grammar
        )
        result.append(media_item)
    
    return result