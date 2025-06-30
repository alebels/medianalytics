from sqlalchemy.ext.asyncio import AsyncSession
import models.py_schemas as schemas
import repository.home as repo
from utils.utils import categorize_items
from utils.constants import C_SENTIMENTS, C_IDEOLOGIES, C_GENERAL, C_DAY
import asyncio

async def get_compound_sentiments_ideologies(db: AsyncSession, mode: str, type: str) -> schemas.CompoundRead:
    """Get compound sentiments with both plain and categorized data."""
    from services.filters import SENTIMENTS_IDEOLOGIES_CATEGORIZED
    
    # Get plain data
    plain = []
    if mode == C_GENERAL:
        plain = await repo.get_general_sentiments_ideologies(db, type)
    elif mode == C_DAY:
        plain = await repo.get_general_day_sentiments_ideologies(db, type)
    
    categorized_values = []
    if type == C_SENTIMENTS:
        categorized_values = SENTIMENTS_IDEOLOGIES_CATEGORIZED.sentiments
    elif type == C_IDEOLOGIES:
        categorized_values = SENTIMENTS_IDEOLOGIES_CATEGORIZED.ideologies

    # Get categorized sentiments using the reusable function
    categorized = categorize_items(
        plain, 
        categorized_values
    )
    
    return schemas.CompoundRead(
        plain=plain,
        categorized=categorized
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
    
    async def process_media_item(item):
        # Run all database queries concurrently for each media item
        tasks = [
            repo.get_general_media_words(db, item.id),
            repo.get_general_media_top_sentiments_ideologies(db, item.id, C_SENTIMENTS),
            repo.get_general_media_bottom_sentiments_ideologies(db, item.id, C_SENTIMENTS),
            repo.get_general_media_top_sentiments_ideologies(db, item.id, C_IDEOLOGIES),
            repo.get_general_media_bottom_sentiments_ideologies(db, item.id, C_IDEOLOGIES),
            get_grammar_percentages(db, item.id)
        ]
        
        results = await asyncio.gather(*tasks)
        top_words, top_sentiments, bottom_sentiments, top_ideologies, bottom_ideologies, top_grammar = results
        
        return schemas.GeneralMediaItemRead(
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
    
    # Process all media items concurrently
    tasks = [process_media_item(item) for item in general_media]
    result = await asyncio.gather(*tasks)
    
    return result