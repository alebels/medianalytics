from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import config.db_models as models
from models.sentiment_ideology import CategoryValues, SentimentsIdeologiesConfig, SentimentsIdeologiesRead


async def get_sentiments_categorized(db: AsyncSession) -> list[CategoryValues]:
    """
    Retrieve all active sentiments grouped by their category from the database.

    Args:
        db (AsyncSession): The database session.

    Returns:
        list[CategoryValues]: A list of categories, each with its sentiment values.
    """
    result = await db.execute(
        select(
            models.SentimentCategory.category,
            models.SentimentCategory.color,
            models.SentimentCategory.icon,
            models.Sentiment.sentiment,
        )
        .join(models.Sentiment, models.Sentiment.id_category == models.SentimentCategory.id)
        .where(models.Sentiment.active == True)
    )
    rows = result.all()

    # Group sentiments by category
    category_map: dict[str, dict] = {}
    for category, color, icon, sentiment in rows:
        if category not in category_map:
            category_map[category] = {"color": color, "icon": icon, "values": []}
        category_map[category]["values"].append(sentiment)

    return [
        CategoryValues(category=cat, color=info["color"], icon=info["icon"], values=info["values"])
        for cat, info in category_map.items()
    ]


async def get_ideologies_categorized(db: AsyncSession) -> list[CategoryValues]:
    """
    Retrieve all active ideologies grouped by their category from the database.

    Args:
        db (AsyncSession): The database session.

    Returns:
        list[CategoryValues]: A list of categories, each with its ideology values.
    """
    result = await db.execute(
        select(
            models.IdeologyCategory.category,
            models.IdeologyCategory.color,
            models.IdeologyCategory.icon,
            models.Ideology.ideology,
        )
        .join(models.Ideology, models.Ideology.id_category == models.IdeologyCategory.id)
        .where(models.Ideology.active == True)
    )
    rows = result.all()

    # Group ideologies by category
    category_map: dict[str, dict] = {}
    for category, color, icon, ideology in rows:
        if category not in category_map:
            category_map[category] = {"color": color, "icon": icon, "values": []}
        category_map[category]["values"].append(ideology)

    return [
        CategoryValues(category=cat, color=info["color"], icon=info["icon"], values=info["values"])
        for cat, info in category_map.items()
    ]


async def get_sentiments_ideologies_categorized(db: AsyncSession) -> SentimentsIdeologiesRead:
    sentiments = await get_sentiments_categorized(db)
    ideologies = await get_ideologies_categorized(db)

    return SentimentsIdeologiesRead(
        sentiments=sentiments,
        ideologies=ideologies
    )


async def get_active_sentiments(db: AsyncSession) -> list[str]:
    result = await db.execute(
        select(models.Sentiment.sentiment)
        .where(models.Sentiment.active == True)
    )
    return list(result.scalars().all())


async def get_active_ideologies(db: AsyncSession) -> list[str]:
    result = await db.execute(
        select(models.Ideology.ideology)
        .where(models.Ideology.active == True)
    )
    return list(result.scalars().all())


async def get_plain_sentiments_ideologies(db: AsyncSession) -> SentimentsIdeologiesConfig:
    sentiments = await get_active_sentiments(db)
    ideologies = await get_active_ideologies(db)

    return SentimentsIdeologiesConfig(
        sentiments=sentiments,
        ideologies=ideologies
    )