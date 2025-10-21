import models.filters as schemas
from config.sentiments_ideologies_compound import SENTIMENTS, IDEOLOGIES
from utils.constants import C_SENTIMENTS, C_IDEOLOGIES
from sqlalchemy.ext.asyncio import AsyncSession
import repository.filters as repo
from utils.utils import categorize_items, normalize_data_item_dates, set_to_chart_normalized_data


# Global variable to store categorized data
SENTIMENTS_IDEOLOGIES_CATEGORIZED = None


def get_sentiments_ideologies_categorized() -> schemas.SentimentsIdeologiesRead:
    """
    Get sentiments and ideologies data grouped by category.
    
    Returns:
        schemas.SentimentsIdeologiesRead: Sentiments and ideologies grouped by categories.
    """
    global SENTIMENTS_IDEOLOGIES_CATEGORIZED
    
    if SENTIMENTS_IDEOLOGIES_CATEGORIZED is None:
        # Convert SENTIMENTS to the expected format
        sentiments = [
            schemas.CategoryValues(category=category, values=values)
            for category, values in SENTIMENTS.items()
        ]
        
        # Convert IDEOLOGIES to the expected format
        ideologies = [
            schemas.CategoryValues(category=category, values=values)
            for category, values in IDEOLOGIES.items()
        ]
        
        # Create the categorized data
        SENTIMENTS_IDEOLOGIES_CATEGORIZED = schemas.SentimentsIdeologiesRead(
            sentiments=sentiments,
            ideologies=ideologies
        )
    
    return SENTIMENTS_IDEOLOGIES_CATEGORIZED


def set_conditions_query(filters: schemas.SentimentsIdeologiesFilter, base_query: str) -> schemas.FillQuery:
    """
    Applies filtering conditions to a base SQL query string.
    This function takes a base SQL query and a filter object, then dynamically
    adds WHERE and JOIN clauses based on the criteria specified in the filters.
    It handles filtering by media_id, or alternatively by media type, region,
    and country if media_id is not provided. It also adds date range filtering.
    The function collects the necessary parameters for the SQL query execution.
    Args:
        filters (schemas.SentimentsIdeologiesFilter): An object containing the
            filter criteria. It can include media_id, type, region, country,
            and a list of dates (either one for exact match or two for a range).
        base_query (str): The initial SQL query string to which the conditions
            will be appended.
    Returns:
        schemas.FillQuery: An object containing two attributes:
            - query (str): The modified SQL query string with filter conditions applied.
            - params (dict): A dictionary containing the parameters and their values
              to be used safely with the generated query (e.g., for preventing
              SQL injection).
    """
    # Initialize parameters dictionary
    params = {}
    
    # Apply media_id filter if provided
    if filters.media_id is not None:
        base_query += " WHERE a.media_id = :media_id"
        params["media_id"] = filters.media_id
    else:
        base_query += " JOIN public.media m ON a.media_id = m.id"
        
        # collect all the filter conditions here
        conditions = []
        # and the corresponding params
        if filters.type is not None:
            conditions.append("m.type::text = :type")
            params["type"] = filters.type.value

        if filters.region is not None:
            conditions.append("m.region::text = :region")
            params["region"] = filters.region.value

        if filters.country is not None:
            conditions.append("m.country::text = :country")
            params["country"] = filters.country.value

        # if we had at least one condition, prepend WHERE and join with AND
        if len(conditions) > 0:
            base_query += " WHERE " + " AND ".join(conditions)
    
    # Add date filtering
    if filters.dates is not None and len(filters.dates) > 0:
        if len(filters.dates) == 1:
            base_query += " AND a.insert_date = :date_single"
            params["date_single"] = filters.dates[0]
        elif len(filters.dates) == 2:
            base_query += " AND a.insert_date BETWEEN :date_start AND :date_end"
            params["date_start"] = filters.dates[0]
            params["date_end"] = filters.dates[1]
    
    return schemas.FillQuery(query=base_query, params=params)


def set_query_subquery_article(filters: schemas.SentimentsIdeologiesFilter, mode: str) -> schemas.FillQuery:
    """
    Constructs a parameterized SQL query for analyzing sentiments or ideologies in articles based on provided filters.
    This function builds a SQL query that counts occurrences of specific sentiments or ideologies
    from the article table, with optional date filtering. The query uses array operations
    to filter and unnest the array fields in the database.
    Parameters:
    ----------
    filters : schemas.SentimentsIdeologiesFilter
        An object containing filter criteria:
        - sentiments: Optional list of sentiment enums to filter by
        - ideologies: Optional list of ideology enums to filter by
        - dates: Optional date range [start_date, end_date]
        - (other potential filters handled by set_conditions_query)
    mode : str
        Specifies which field to analyze, must be either:
        - C_SENTIMENTS: to analyze sentiment data
        - C_IDEOLOGIES: to analyze ideology data
    Returns:
    -------
    schemas.FillQuery
        An object containing:
        - query: The parameterized SQL query string
        - params: Dictionary of parameters to be used with the query
    Notes:
    -----
    - Uses array overlap operator (&&) for filtering arrays of sentiments/ideologies
    - When date range is specified, results are grouped by date
    - The function depends on set_conditions_query to apply additional filtering conditions
    """
    
    filter_values = []
    
    # If specific sentiments or ideologies are selected for filtering
    if mode == C_SENTIMENTS and filters.sentiments is not None:
        # Store enum values for parameterized query
        filter_values = [s.value for s in filters.sentiments]
    elif mode == C_IDEOLOGIES and filters.ideologies is not None:
        # Store enum values for parameterized query
        filter_values = [i.value for i in filters.ideologies]
    
    base_query = f"""
        SELECT name, COUNT(*) as count
        FROM (
            SELECT unnest(a.{mode}) as name
    """
    
    final_query = """
        GROUP BY name
        ORDER BY count DESC
    """
    
    if filters.dates is not None and len(filters.dates) == 2:
        # If we have a date range and sentiments or ideologies, we need to group by date as well
        base_query = f"""
            SELECT name, DATE(date) as date, COUNT(*) as count
            FROM (
                SELECT unnest(a.{mode}) as name, a.insert_date as date
        """
        final_query = """
            GROUP BY name, date
            ORDER BY date, count DESC
        """
    
    base_query += " FROM public.article a"
    
    result = set_conditions_query(filters, base_query)
    base_query = result.query
    params = result.params
    
    # Add the sentiment or ideology filter using the array overlap operator &&
    # Pass the list of enum values directly; the driver should handle it.
    if mode == C_SENTIMENTS and filters.sentiments:
        base_query += f" AND a.{mode} && :filter_sentiments"
        # Convert enum values to their string representation for the parameter
        params["filter_sentiments"] = filter_values
    elif mode == C_IDEOLOGIES and filters.ideologies:
        base_query += f" AND a.{mode} && :filter_ideologies"
        # Convert enum values to their string representation for the parameter
        params["filter_ideologies"] = filter_values
    
    # Use unnest() with array constructor for proper parameter handling
    base_query += """
        ) subquery
        WHERE name = ANY(:provided_list)
    """
    params["provided_list"] = filter_values if filter_values else ['']
    
    base_query += final_query
    
    return schemas.FillQuery(query=base_query, params=params)


def set_query_article(filters: schemas.SentimentsIdeologiesFilter, mode: str) -> schemas.FillQuery:
    """
    Constructs a SQL query to count occurrences of sentiments or ideologies in articles based on filters.
    This function builds a query that groups and counts items from an array column in the article table.
    The column to be analyzed is determined by the 'mode' parameter (e.g., 'sentiments', 'ideologies').
    Parameters:
    ----------
    filters : schemas.SentimentsIdeologiesFilter
        Filter criteria to be applied to the article query, including date ranges, sources, etc.
    mode : str
        Specifies which array column to analyze ('sentiments' or 'ideologies')
    Returns:
    -------
    schemas.FillQuery
        An object containing the constructed SQL query string and parameter dictionary
        for use with parameterized queries
    """
    # Start building the base query
    base_query = f"""
        SELECT unnest(a.{mode}) as name, COUNT(*) as count
        FROM public.article a
    """
    
    result = set_conditions_query(filters, base_query)
    base_query = result.query
    params = result.params
    
    base_query += f"""
        GROUP BY unnest(a.{mode})
        ORDER BY count DESC
    """
    
    return schemas.FillQuery(query=base_query, params=params)


async def get_sentiments_ideologies_filter(
    db: AsyncSession, 
    filters: schemas.SentimentsIdeologiesFilter, 
    mode: str
) -> schemas.FilterChartsRead:
    """
    Retrieve sentiments or ideologies filtered by the provided criteria.
    
    Args:
        db (AsyncSession): The database session.
        filters (schemas.SentimentsIdeologiesFilter): Filter criteria.
        mode (str): Specifies which field to analyze ('sentiments' or 'ideologies').
        
    Returns:
        schemas.FilterChartsRead: A list of sentiments or ideologies with counts or with dates and counts.
    """
    result_query: schemas.FillQuery
    
    is_categorized = False
    
    if (filters.sentiments is not None and len(filters.sentiments) > 0) or (filters.ideologies is not None and len(filters.ideologies) > 0):
        # If either sentiments or ideologies are provided, we need to filter by them
        result_query = set_query_subquery_article(filters, mode)
    else:
        # If no sentiments or ideologies are provided, we still need to set the base query
        result_query = set_query_article(filters, mode)
        is_categorized = True

    
    db_data = await repo.get_sentiments_ideologies_filter(db, result_query.query, result_query.params)
    
    result: schemas.FilterChartsRead = schemas.FilterChartsRead()
    if is_categorized:
        # If the db_data is categorized, we need to return it in a specific format
        if mode == C_SENTIMENTS:
            categorized_data = SENTIMENTS_IDEOLOGIES_CATEGORIZED.sentiments
        else:
            categorized_data = SENTIMENTS_IDEOLOGIES_CATEGORIZED.ideologies
            
        categorized = categorize_items(
            db_data.plain, 
            categorized_data
        )
        result.categorized = categorized
        result.plain = db_data.plain
    else:
        # If the db_data is not categorized, we need to return it as is
        result.plain = db_data.plain
    
    if db_data.dated is not None and len(db_data.dated) > 0:
        normalized = normalize_data_item_dates(db_data.dated)
        result.date_chart = set_to_chart_normalized_data(normalized)

    return schemas.FilterChartsRead.model_validate(result)


def set_query_word(filters: schemas.WordsFilter) -> schemas.FillQuery:
    """
    Constructs a SQL query to retrieve words from the word table based on provided filters.
    
    Args:
        filters (schemas.WordsFilter): Filter criteria for words including media filters,
                                      date range, min/max count, and ordering.
    
    Returns:
        schemas.FillQuery: An object containing the constructed SQL query string and 
                          parameter dictionary for use with parameterized queries.
    """
    # Start building the base query
    base_query = """
        SELECT w.name as name, SUM(f.frequency) as count
        FROM public.word w
        JOIN public.facts f ON f.id_word = w.id
        JOIN public.article a ON f.id_article = a.id
    """
    
    # Apply general conditions (media filters, date range)
    result = set_conditions_query(filters, base_query)
    base_query = result.query
    params = result.params
    
    # Exclude the word 'said'
    base_query += " AND w.name != 'said'"
    
    # Add grouping clause
    base_query += " GROUP BY w.name"
    
    # Add ordering based on filter parameter
    if filters.order_by_desc:
        base_query += " ORDER BY count DESC, name"
    else:
        base_query += " ORDER BY count ASC, name"

    # These parameters will be applied after the ORDER BY clause
    # to limit the number of rows returned
    if filters.min_range is not None:
        # Ensure offset is never negative
        offset_value = filters.min_range
        params["offset"] = offset_value
        
        if filters.max_range is not None:
            # Calculate how many elements to get
            params["limit"] = filters.max_range - filters.min_range
            base_query += " LIMIT :limit OFFSET :offset"
        else:
            # If only min_range, get all elements starting from that position
            base_query += " OFFSET :offset"
    elif filters.max_range is not None:
        # If only max_range, get first max_range elements
        params["limit"] = filters.max_range
        base_query += " LIMIT :limit"
    
    return schemas.FillQuery(query=base_query, params=params)


async def get_words_filter(
    db: AsyncSession, 
    filters: schemas.WordsFilter
) -> list[schemas.ItemRead]:
    """
    Retrieve words filtered by the provided criteria.
    
    Args:
        db (AsyncSession): The database session.
        filters (schemas.WordsFilter): Filter criteria.
        
    Returns:
        list[schemas.ItemRead]: A list of words with counts.
    """
    result_query = set_query_word(filters)
    
    return await repo.get_words_filter(db, result_query.query, result_query.params)


def set_query_chart_dialog(filters: schemas.ChartDialogPaginated) -> schemas.FillQuery:
    """
    Constructs a SQL query to retrieve individual article URLs with their media names
    based on sentiment, ideology, or word filters.
    
    This function builds a query that:
    1. Filters articles by the provided criteria (sentiment/ideology/word)
    2. Joins with media table to get media names
    3. Returns individual URLs with their media names (NOT grouped)
    4. If word filter is used, includes word frequency for each URL
    5. Allows pagination at the URL level, not media group level
    
    Args:
        filters: ChartDialogPaginated object containing filter criteria including:
                - sentiment: Optional sentiment filter
                - ideology: Optional ideology filter  
                - word: Optional word filter (includes frequency in results)
                - Other base filters (media_id, type, region, country, dates)
    
    Returns:
        FillQuery object containing:
        - query: The constructed SQL query string
        - params: Dictionary of parameters for safe query execution
    """
    # Determine if we need frequency column (only for word filters)
    include_frequency = filters.word is not None
    
    if include_frequency:
        base_query = """
        SELECT DISTINCT m.name as media_name, a.url as url, f.frequency as frequency
        FROM public.article a
        JOIN public.media m ON a.media_id = m.id
    """
    else:
        base_query = """
        SELECT DISTINCT m.name as media_name, a.url as url
        FROM public.article a
        JOIN public.media m ON a.media_id = m.id
    """
    
    # Initialize parameters dictionary
    params = {}
    
    # Build WHERE conditions manually (since we already have the media JOIN)
    conditions = []
    
    # Apply media_id filter if provided
    if filters.media_id is not None:
        conditions.append("a.media_id = :media_id")
        params["media_id"] = filters.media_id
    else:
        # Apply media type/region/country filters
        if filters.type is not None:
            conditions.append("m.type::text = :type")
            params["type"] = filters.type.value
        
        if filters.region is not None:
            conditions.append("m.region::text = :region")
            params["region"] = filters.region.value
        
        if filters.country is not None:
            conditions.append("m.country::text = :country")
            params["country"] = filters.country.value
    
    # Add date filtering
    if filters.dates is not None and len(filters.dates) > 0:
        if len(filters.dates) == 1:
            conditions.append("a.insert_date = :date_single")
            params["date_single"] = filters.dates[0]
        elif len(filters.dates) == 2:
            conditions.append("a.insert_date BETWEEN :date_start AND :date_end")
            params["date_start"] = filters.dates[0]
            params["date_end"] = filters.dates[1]
    
    # Add WHERE clause if we have conditions
    if conditions:
        base_query += " WHERE " + " AND ".join(conditions)
    
    # Add specific filters for sentiment, ideology, or word
    # Only one of these will be present per request (mutually exclusive)
    if filters.sentiment is not None:
        # Add WHERE or AND depending on whether we already have conditions
        connector = " AND " if conditions else " WHERE "
        base_query += f"{connector}:sentiment = ANY(a.sentiments)"
        params["sentiment"] = filters.sentiment.value
    
    elif filters.ideology is not None:
        connector = " AND " if conditions else " WHERE "
        base_query += f"{connector}:ideology = ANY(a.ideologies)"
        params["ideology"] = filters.ideology.value
    
    elif filters.word is not None:
        # Join with word and facts tables to filter by word and get frequency
        base_query = base_query.replace(
            "FROM public.article a",
            """FROM public.article a
            JOIN public.facts f ON f.id_article = a.id
            JOIN public.word w ON f.id_word = w.id"""
        )
        connector = " AND " if conditions else " WHERE "
        base_query += f"{connector}w.name = :word"
        params["word"] = filters.word
    
    # Order by media name and URL for consistent pagination
    base_query += """
        ORDER BY m.name, a.url
    """
    
    return schemas.FillQuery(query=base_query, params=params)


async def get_chart_dialog_paginated(
    db: AsyncSession,
    filters: schemas.ChartDialogPaginated
) -> schemas.ChartDialogPaginatedRead:
    """
    Retrieve paginated chart dialog data with metadata for infinite scroll.
    
    This service function coordinates the pagination workflow:
    1. Builds SQL query to get individual URLs with media names (and frequency if word filter)
    2. Executes paginated query (pagination by URL count, not media groups)
    3. Groups URLs by media name in-memory after pagination
    4. Returns formatted response with grouped items and metadata
    
    The key difference: total_count represents TOTAL URLs, not total media groups.
    This ensures that page_size=20 means "20 URLs" not "20 media groups with potentially hundreds of URLs each".
    
    When word filter is used, each URL includes its frequency (how many times the word appears in that article).
    
    Args:
        db: The async database session
        filters: ChartDialogPaginated object containing:
                - Filter criteria (sentiment/ideology/word/media/dates)
                - Pagination parameters (page, page_size)
    """
    # Build query using existing logic (returns individual URLs, with frequency if word filter)
    query_result = set_query_chart_dialog(filters)
    
    # Execute paginated query - now paginating by individual URLs
    items, total_count = await repo.get_chart_dialog_paginated(
        db,
        query_result.query,
        query_result.params,
        filters.pagination.page,
        filters.pagination.page_size
    )
    
    # Check if this is a word filter (frequency will be included in results)
    is_word_filter = filters.word is not None
    
    # Group URLs by media name in-memory
    # For word filters: items are (media_name, url, frequency) tuples
    # For sentiment/ideology: items are (media_name, url) tuples
    media_urls_map = {}
    for item in items:
        media_name = str(item.media_name)
        url = str(item.url)
        
        if media_name not in media_urls_map:
            media_urls_map[media_name] = []
        
        # Create ItemUrl with or without frequency
        if is_word_filter:
            frequency = int(item.frequency) if hasattr(item, 'frequency') else None
            item_url = schemas.ItemUrl(url=url, frequency=frequency)
        else:
            item_url = schemas.ItemUrl(url=url)
        
        media_urls_map[media_name].append(item_url)
    
    # Transform to Pydantic models
    results = [
        schemas.ItemDialog(
            media_name=media_name,
            urls=urls
        )
        for media_name, urls in media_urls_map.items()
    ]
    
    # Calculate if there are more pages based on total URL count
    total_pages = (total_count + filters.pagination.page_size - 1) // filters.pagination.page_size
    has_more = filters.pagination.page < total_pages
    
    return schemas.ChartDialogPaginatedRead(
        results=results,
        total_count=total_count,  # Now represents total URLs, not total media groups
        page=filters.pagination.page,
        has_more=has_more
    )