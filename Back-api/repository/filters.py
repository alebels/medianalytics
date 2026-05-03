from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import models.filters as schemas
import config.db_models as models
from sqlalchemy import exists, text


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


async def get_sentiments_ideologies_filter(
    db: AsyncSession, query: str, params: dict
) -> schemas.FilterData:
    """
    Retrieve sentiment filter results and article count from the database.
    The query is expected to include a num_articles column via a CTE scalar subquery.
    
    Args:
        db (AsyncSession): The database session.
        query (str): The SQL query to execute.
        params (dict): The parameters to bind to the query.
        
    Returns:
        schemas.FilterData: Filter items (with dates if available) and total article count.
    """
    try:
        stmt = text(query).bindparams(**params)
        result = await db.execute(stmt)
        result_list = result.mappings().all()

        num_articles = result_list[0]['num_articles'] if result_list else 0
        
        if result_list and 'date' in result_list[0]:
            items = [schemas.ItemDate.model_validate(item) for item in result_list]
            return schemas.FilterData(dated=items, num_articles=num_articles)
        
        items = [schemas.ItemRead.model_validate(item) for item in result_list]
        return schemas.FilterData(plain=items, num_articles=num_articles)
    except Exception as e:
        print(f"Error executing query: {query}")
        print(f"Parameters: {params}")
        raise e


async def get_words_filter(db: AsyncSession, query: str, params: dict) -> schemas.FilterData:
    """
    Retrieve word filter results and article count from the database.
    The query is expected to include a num_articles column via a CTE scalar subquery.
    
    Args:
        db (AsyncSession): The database session.
        query (str): The SQL query to execute.
        params (dict): The parameters to bind to the query.
        
    Returns:
        schemas.FilterData: Words with counts and total article count.
    """
    try:
        stmt = text(query).bindparams(**params)
        result = await db.execute(stmt)
        result_list = result.mappings().all()

        num_articles = result_list[0]['num_articles'] if result_list else 0
        items = [schemas.ItemRead.model_validate(item) for item in result_list]
        return schemas.FilterData(plain=items, num_articles=num_articles)
    except Exception as e:
        print(f"Error executing query: {query}")
        print(f"Parameters: {params}")
        raise e


async def get_chart_dialog_paginated(
    db: AsyncSession,
    query: str,
    params: dict,
    page: int,
    page_size: int = 100
) -> tuple[list, int]:
    """
    Execute a paginated query and return results with total count.
    
    This function performs two database operations:
    1. Counts total matching records (for calculating has_more)
    2. Retrieves the specific page of results
    
    Args:
        db: The async database session
        query: The base SQL query string (should return individual URLs, not grouped)
        params: Dictionary of query parameters for safe parameterization
        page: The page number (1-indexed)
        page_size: Number of items per page (number of URLs to return)
        
    Returns:
        Tuple containing:
        - List of query results for the requested page (individual URL rows)
        - Total count of all matching URLs
    """
    try:
        # 1. Get total count first (without pagination)
        count_query = f"""
            SELECT COUNT(*) FROM ({query}) as count_subquery
        """
        count_result = await db.execute(text(count_query), params)
        total_count = count_result.scalar() or 0
        
        # 2. Add pagination to the original query
        offset = (page - 1) * page_size
        paginated_query = f"{query} LIMIT :limit OFFSET :offset"
        
        # Add pagination parameters
        paginated_params = {**params, "limit": page_size, "offset": offset}
        
        # 3. Execute paginated query
        result = await db.execute(text(paginated_query), paginated_params)
        items = result.fetchall()
        
        return items, total_count
    except Exception as e:
        print(f"Database error in get_chart_dialog_paginated: {e}")
        raise