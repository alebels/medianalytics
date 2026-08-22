import asyncio

from sqlalchemy.future import select
from repository.database import get_session
import config.db_models as models
from media_sources.medias_info_db import MEDIAS_INFO
from media_sources.constants_db import _MEDIA_TYPES, _REGIONS, _COUNTRIES
from media_sources.sentiments_ideologies_db import (
    _SENTIMENT_CATEGORIES, _SENTIMENTS,
    _IDEOLOGY_CATEGORIES, _IDEOLOGIES,
)


# ==================== MEDIA TYPE ====================

async def insert_media_types():
    """
    Asynchronously inserts or updates media type records in the database.
    This function retrieves existing media type records and compares them with
    _MEDIA_TYPES data. If a record already exists, it will be updated if needed.
    Otherwise, a new record will be created.
    """
    async for db in get_session():
        try:
            result = await db.execute(select(models.MediaType))
            existing_dict = {mt.type: mt for mt in result.scalars().all()}

            new_objects = []
            updated_objects = []

            for data in _MEDIA_TYPES:
                if data.type in existing_dict:
                    existing = existing_dict[data.type]
                    if existing.icon != data.icon:
                        existing.icon = data.icon
                        print(f"Updated media type: {existing.type}")
                        updated_objects.append(existing)
                else:
                    obj = models.MediaType(
                        type=data.type,
                        icon=data.icon,
                    )
                    new_objects.append(obj)

            if new_objects:
                db.add_all(new_objects)

            await db.commit()
            print(f"Added {len(new_objects)} new media types and updated {len(updated_objects)} existing records")
            break

        except Exception as e:
            await db.rollback()
            print(f"Error updating media types: {e}")
            raise


# ==================== REGION ====================

async def insert_regions():
    """
    Asynchronously inserts or updates region records in the database.
    This function retrieves existing region records and compares them with
    _REGIONS data. If a record already exists, it will be updated if needed.
    Otherwise, a new record will be created.
    """
    async for db in get_session():
        try:
            result = await db.execute(select(models.Region))
            existing_dict = {r.region: r for r in result.scalars().all()}

            new_objects = []
            updated_objects = []

            for data in _REGIONS:
                if data.region in existing_dict:
                    existing = existing_dict[data.region]
                    if existing.icon != data.icon:
                        existing.icon = data.icon
                        print(f"Updated region: {existing.region}")
                        updated_objects.append(existing)
                else:
                    obj = models.Region(
                        region=data.region,
                        icon=data.icon,
                    )
                    new_objects.append(obj)

            if new_objects:
                db.add_all(new_objects)

            await db.commit()
            print(f"Added {len(new_objects)} new regions and updated {len(updated_objects)} existing records")
            break

        except Exception as e:
            await db.rollback()
            print(f"Error updating regions: {e}")
            raise


# ==================== COUNTRY ====================

async def insert_countries():
    """
    Asynchronously inserts or updates country records in the database.
    This function retrieves existing country records and compares them with
    _COUNTRIES data. If a record already exists, it will be updated if needed.
    Otherwise, a new record will be created.
    """
    async for db in get_session():
        try:
            result = await db.execute(select(models.Country))
            existing_dict = {c.country: c for c in result.scalars().all()}

            new_objects = []
            updated_objects = []

            for data in _COUNTRIES:
                if data.country in existing_dict:
                    existing = existing_dict[data.country]
                    if existing.icon != data.icon:
                        existing.icon = data.icon
                        print(f"Updated country: {existing.country}")
                        updated_objects.append(existing)
                else:
                    obj = models.Country(
                        country=data.country,
                        icon=data.icon,
                    )
                    new_objects.append(obj)

            if new_objects:
                db.add_all(new_objects)

            await db.commit()
            print(f"Added {len(new_objects)} new countries and updated {len(updated_objects)} existing records")
            break

        except Exception as e:
            await db.rollback()
            print(f"Error updating countries: {e}")
            raise


# ==================== MEDIA ====================

def _update_media(existing_media, new_media, type_id, region_id, country_id):
    """
    Update only the changed fields in the existing media record with new data.

    Args:
        existing_media (models.Media): The existing media record from the database.
        new_media (object): The new media data object to update the existing record with.
        type_id (int): The resolved foreign key ID for the media type.
        region_id (int): The resolved foreign key ID for the region.
        country_id (int): The resolved foreign key ID for the country.
    """
    if existing_media.full_name != new_media.full_name:
        existing_media.full_name = new_media.full_name

    if existing_media.url != str(new_media.url):
        existing_media.url = str(new_media.url)

    if existing_media.type_id != type_id:
        existing_media.type_id = type_id

    if existing_media.region_id != region_id:
        existing_media.region_id = region_id

    if existing_media.country_id != country_id:
        existing_media.country_id = country_id

    if existing_media.active is False:
        existing_media.active = True

    print(f"Updated media: {existing_media.name}")
    return existing_media


async def insert_medias():
    """
    Asynchronously inserts or updates media records in the database.
    This function retrieves existing media records from the database and compares
    them with the media information stored in MEDIAS_INFO. If a media record already
    exists, it will be updated if needed. Otherwise, a new media record will be created.
    The function performs operations in a single database transaction, committing
    changes if successful or rolling back if an error occurs.
    Returns:
        None
    Raises:
        Exception: If any error occurs during database operations, the transaction
                   is rolled back and the exception is re-raised.
    Notes:
        - Uses the get_session() generator to obtain a database session
        - Exits after processing with the first available session
        - Prints summary information about the number of records added or updated
        - Resolves type_id, region_id, country_id foreign keys from reference tables
    """
    async for db in get_session():
        try:
            # Build FK lookup dicts from reference tables
            types_result = await db.execute(select(models.MediaType))
            type_lookup = {t.type: t.id for t in types_result.scalars().all()}

            regions_result = await db.execute(select(models.Region))
            region_lookup = {r.region: r.id for r in regions_result.scalars().all()}

            countries_result = await db.execute(select(models.Country))
            country_lookup = {c.country: c.id for c in countries_result.scalars().all()}

            # Get existing media records from database
            result = await db.execute(select(models.Media))
            existing_media_dict = {media.name: media for media in result.scalars().all()}

            media_objects = []
            updated_objects = []

            for media_data in MEDIAS_INFO:
                type_id = type_lookup[media_data.type.value]
                region_id = region_lookup[media_data.region.value]
                country_id = country_lookup[media_data.country.value]

                if media_data.name in existing_media_dict:
                    # Update existing media if needed
                    existing_media_record = existing_media_dict[media_data.name]
                    if (
                        existing_media_record.full_name != media_data.full_name or
                        existing_media_record.url != str(media_data.url) or
                        existing_media_record.type_id != type_id or
                        existing_media_record.region_id != region_id or
                        existing_media_record.country_id != country_id or
                        existing_media_record.active is False
                    ):
                        updated_objects.append(_update_media(existing_media_record, media_data, type_id, region_id, country_id))
                else:
                    # Create new media
                    media = models.Media(
                        name=media_data.name,
                        full_name=media_data.full_name,
                        url=str(media_data.url),
                        type_id=type_id,
                        region_id=region_id,
                        country_id=country_id,
                    )
                    media_objects.append(media)

            # Bulk insert new records
            if media_objects:
                db.add_all(media_objects)

            await db.commit()
            print(f"Added {len(media_objects)} new media and updated {len(updated_objects)} existing records")
            break  # Exit after first session

        except Exception as e:
            await db.rollback()
            print(f"Error updating database: {e}")
            raise


# ==================== SENTIMENT CATEGORY ====================

async def insert_sentiment_categories():
    """
    Asynchronously inserts or updates sentiment category records in the database.
    This function retrieves existing sentiment category records and compares them
    with _SENTIMENT_CATEGORIES data. If a record already exists, it will be updated
    if needed. Otherwise, a new record will be created.
    """
    async for db in get_session():
        try:
            result = await db.execute(select(models.SentimentCategory))
            existing_dict = {sc.category: sc for sc in result.scalars().all()}

            new_objects = []
            updated_objects = []

            for data in _SENTIMENT_CATEGORIES:
                if data.category in existing_dict:
                    existing = existing_dict[data.category]
                    if existing.color != data.color or existing.icon != data.icon:
                        existing.color = data.color
                        existing.icon = data.icon
                        print(f"Updated sentiment category: {existing.category}")
                        updated_objects.append(existing)
                else:
                    obj = models.SentimentCategory(
                        category=data.category,
                        color=data.color,
                        icon=data.icon,
                    )
                    new_objects.append(obj)

            if new_objects:
                db.add_all(new_objects)

            await db.commit()
            print(f"Added {len(new_objects)} new sentiment categories and updated {len(updated_objects)} existing records")
            break

        except Exception as e:
            await db.rollback()
            print(f"Error updating sentiment categories: {e}")
            raise


# ==================== SENTIMENT ====================

async def insert_sentiments():
    """
    Asynchronously inserts or updates sentiment records in the database.
    This function retrieves existing sentiment records and compares them with
    _SENTIMENTS data. Resolves id_category from the sentiment_category table
    to ensure correctness regardless of auto-increment IDs.
    """
    async for db in get_session():
        try:
            # Build category lookup: map positional id_category to actual DB id
            cat_result = await db.execute(select(models.SentimentCategory))
            cat_by_name = {cat.category: cat.id for cat in cat_result.scalars().all()}

            position_to_db_id = {}
            for i, cat_data in enumerate(_SENTIMENT_CATEGORIES, start=1):
                position_to_db_id[i] = cat_by_name[cat_data.category]

            # Get existing sentiments
            result = await db.execute(select(models.Sentiment))
            existing_dict = {s.sentiment: s for s in result.scalars().all()}

            new_objects = []
            updated_objects = []

            for data in _SENTIMENTS:
                resolved_category_id = position_to_db_id[data.id_category]

                if data.sentiment in existing_dict:
                    existing = existing_dict[data.sentiment]
                    if existing.id_category != resolved_category_id or existing.active != data.active:
                        existing.id_category = resolved_category_id
                        existing.active = data.active
                        print(f"Updated sentiment: {existing.sentiment}")
                        updated_objects.append(existing)
                else:
                    obj = models.Sentiment(
                        id_category=resolved_category_id,
                        sentiment=data.sentiment,
                        active=data.active,
                    )
                    new_objects.append(obj)

            if new_objects:
                db.add_all(new_objects)

            await db.commit()
            print(f"Added {len(new_objects)} new sentiments and updated {len(updated_objects)} existing records")
            break

        except Exception as e:
            await db.rollback()
            print(f"Error updating sentiments: {e}")
            raise


# ==================== IDEOLOGY CATEGORY ====================

async def insert_ideology_categories():
    """
    Asynchronously inserts or updates ideology category records in the database.
    This function retrieves existing ideology category records and compares them
    with _IDEOLOGY_CATEGORIES data. If a record already exists, it will be updated
    if needed. Otherwise, a new record will be created.
    """
    async for db in get_session():
        try:
            result = await db.execute(select(models.IdeologyCategory))
            existing_dict = {ic.category: ic for ic in result.scalars().all()}

            new_objects = []
            updated_objects = []

            for data in _IDEOLOGY_CATEGORIES:
                if data.category in existing_dict:
                    existing = existing_dict[data.category]
                    if existing.color != data.color or existing.icon != data.icon:
                        existing.color = data.color
                        existing.icon = data.icon
                        print(f"Updated ideology category: {existing.category}")
                        updated_objects.append(existing)
                else:
                    obj = models.IdeologyCategory(
                        category=data.category,
                        color=data.color,
                        icon=data.icon,
                    )
                    new_objects.append(obj)

            if new_objects:
                db.add_all(new_objects)

            await db.commit()
            print(f"Added {len(new_objects)} new ideology categories and updated {len(updated_objects)} existing records")
            break

        except Exception as e:
            await db.rollback()
            print(f"Error updating ideology categories: {e}")
            raise


# ==================== IDEOLOGY ====================

async def insert_ideologies():
    """
    Asynchronously inserts or updates ideology records in the database.
    This function retrieves existing ideology records and compares them with
    _IDEOLOGIES data. Resolves id_category from the ideology_category table
    to ensure correctness regardless of auto-increment IDs.
    """
    async for db in get_session():
        try:
            # Build category lookup: map positional id_category to actual DB id
            cat_result = await db.execute(select(models.IdeologyCategory))
            cat_by_name = {cat.category: cat.id for cat in cat_result.scalars().all()}

            position_to_db_id = {}
            for i, cat_data in enumerate(_IDEOLOGY_CATEGORIES, start=1):
                position_to_db_id[i] = cat_by_name[cat_data.category]

            # Get existing ideologies
            result = await db.execute(select(models.Ideology))
            existing_dict = {ide.ideology: ide for ide in result.scalars().all()}

            new_objects = []
            updated_objects = []

            for data in _IDEOLOGIES:
                resolved_category_id = position_to_db_id[data.id_category]

                if data.ideology in existing_dict:
                    existing = existing_dict[data.ideology]
                    if existing.id_category != resolved_category_id or existing.active != data.active:
                        existing.id_category = resolved_category_id
                        existing.active = data.active
                        print(f"Updated ideology: {existing.ideology}")
                        updated_objects.append(existing)
                else:
                    obj = models.Ideology(
                        id_category=resolved_category_id,
                        ideology=data.ideology,
                        active=data.active,
                    )
                    new_objects.append(obj)

            if new_objects:
                db.add_all(new_objects)

            await db.commit()
            print(f"Added {len(new_objects)} new ideologies and updated {len(updated_objects)} existing records")
            break

        except Exception as e:
            await db.rollback()
            print(f"Error updating ideologies: {e}")
            raise


# ==================== INIT DB ====================

async def init_db():
    """Initialize database tables with initial values"""
    # 1. Reference/constant tables (no FK dependencies)
    await insert_media_types()
    await insert_regions()
    await insert_countries()

    # 2. Media (depends on media_type, region, country)
    await insert_medias()

    # 3. Sentiment & Ideology categories (no FK dependencies)
    await insert_sentiment_categories()
    await insert_ideology_categories()

    # 4. Sentiments & Ideologies (depend on their categories)
    await insert_sentiments()
    await insert_ideologies()


if __name__ == "__main__":
    asyncio.run(init_db())

# If you need to reset the auto-increment value of the primary key in PostgreSQL, you can run the following command:
# SELECT setval(pg_get_serial_sequence('<tablename>', 'id'), COALESCE(max(id)+1, 1), false) FROM <tablename>;
