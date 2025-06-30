from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import models.py_schemas as schemas
import config.db_models as models
from sqlalchemy import exists, text, func


async def get_medias(db: AsyncSession) -> list[schemas.MediaRead]:
    """
    Retrieve all media records from the database.
    Args:
        db (AsyncSession): The database session.
    Returns:
        list[schemas.MediaRead]: A list of all media records.
    """
    # Query media that have at least one related article using a join
    query = select(
        models.Media.id, models.Media.name, models.Media.type, 
        models.Media.region, models.Media.country
    ).where(
        exists().where(models.Article.media_id == models.Media.id)
    )
    
    result = await db.execute(query)
    medias = result.all()
    return [schemas.MediaRead.model_validate(media).model_dump() for media in medias]


async def get_min_max_date(db: AsyncSession) -> schemas.MinMaxDateRead:
    """
    Retrieve the minimum and maximum dates from the database.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        schemas.MinMaxDateRead: The minimum and maximum dates.
    """
    # Get minimum date
    min_date_result = await db.execute(
        select(func.min(models.Article.insert_date))
    )
    min_date = min_date_result.scalar()
    
    # Get maximum date
    max_date_result = await db.execute(
        select(func.max(models.Article.insert_date))
    )
    max_date = max_date_result.scalar()

    # Create MinMaxDateRead with date values
    return schemas.MinMaxDateRead(
        min_date=min_date,
        max_date=max_date
    )


async def get_sentiments_ideologies_filter(db: AsyncSession, query: str, params: dict) -> schemas.FilterData:
    """
    Retrieve sentiment filter results from the database.
    
    Args:
        db (AsyncSession): The database session.
        query (str): The SQL query to execute.
        params (dict): The parameters to bind to the query.
        
    Returns:
        schemas.FilterData: A list of filter items, with dates if available.
    """
    # Create a bindparam statement with explicit parameter binding
    stmt = text(query).bindparams(**params)
    
    try:
        result = await db.execute(stmt)
        result_list = result.mappings().all()
        
        # Check if the list is not empty and the first item has a 'date' key
        if result_list and 'date' in result_list[0]:
            # If the result has a date attribute, return ItemDate
            items = [schemas.ItemDate.model_validate(item) for item in result_list]
            return schemas.FilterData(dated=items)
        
        items = [schemas.ItemRead.model_validate(item) for item in result_list]
        return schemas.FilterData(plain=items)
    except Exception as e:
        # Log the error with the query and parameters for debugging
        print(f"Error executing query: {query}")
        print(f"Parameters: {params}")
        raise e


async def get_words_filter(db: AsyncSession, query: str, params: dict) -> list[schemas.ItemRead]:
    """
    Retrieve word filter results from the database.
    
    Args:
        db (AsyncSession): The database session.
        query (str): The SQL query to execute.
        params (dict): The parameters to bind to the query.
        
    Returns:
        list[schemas.ItemRead]: A list of filter items (words with counts).
    """
    # Create a bindparam statement with explicit parameter binding
    stmt = text(query).bindparams(**params)
    
    try:
        result = await db.execute(stmt)
        result_list = result.mappings().all()
        
        # Return a list of ItemRead directly, not wrapped in FilterData
        return [schemas.ItemRead.model_validate(item) for item in result_list]
    except Exception as e:
        # Log the error with the query and parameters for debugging
        print(f"Error executing query: {query}")
        print(f"Parameters: {params}")
        raise e
