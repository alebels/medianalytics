import asyncio

from sqlalchemy.future import select
from repository.database import get_session
import config.db_models as models
from media_sources.medias_info_db import MEDIAS_INFO


def _media_needs_update(existing_media, new_media):
    """
    Check if the existing media record needs to be updated based on the new media data.
    
    Args:
        existing_media (models.Media): The existing media record from the database.
        new_media (object): The new media data object to compare against.
        
    Returns:
        bool: True if the existing media needs to be updated, False otherwise.
    """
    return (
        existing_media.full_name != new_media.full_name or
        existing_media.url != str(new_media.url) or
        existing_media.type != new_media.type or
        existing_media.region != new_media.region or
        existing_media.country != new_media.country or
        existing_media.active is False
    )


def _update_media(existing_media, new_media):
    """
    Update only the changed fields in the existing media record with new data.
    
    Args:
        existing_media (models.Media): The existing media record from the database.
        new_media (object): The new media data object to update the existing record with.
    """
    if existing_media.full_name != new_media.full_name:
        existing_media.full_name = new_media.full_name
    
    if existing_media.url != str(new_media.url):
        existing_media.url = str(new_media.url)
    
    if existing_media.type != new_media.type:
        existing_media.type = new_media.type
    
    if existing_media.region != new_media.region:
        existing_media.region = new_media.region
    
    if existing_media.country != new_media.country:
        existing_media.country = new_media.country
    
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
    """
    async for db in get_session():
        try:
            # Get existing media records from database
            result = await db.execute(select(models.Media))
            existing_media_dict = {media.name: media for media in result.scalars().all()}
            
            media_objects = []
            updated_objects = []
            
            for media_data in MEDIAS_INFO:
                if media_data.name in existing_media_dict:
                    # Update existing media if needed
                    existing_media_record = existing_media_dict[media_data.name]
                    if _media_needs_update(existing_media_record, media_data):
                        updated_objects.append(_update_media(existing_media_record, media_data))
                else:
                    # Create new media
                    media = models.Media(
                        name=media_data.name,
                        full_name=media_data.full_name,
                        url=str(media_data.url),
                        type=media_data.type,
                        region=media_data.region,
                        country=media_data.country
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


async def init_db():
    """Initialize database tables with initial values"""
    await insert_medias()


if __name__ == "__main__":
    asyncio.run(init_db())

# If you need to reset the auto-increment value of the primary key in PostgreSQL, you can run the following command:
# SELECT setval(pg_get_serial_sequence('<tablename>', 'id'), COALESCE(max(id)+1, 1), false) FROM <tablename>;
