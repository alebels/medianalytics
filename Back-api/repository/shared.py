from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import config.db_models as models
import config.shared_models as schemas


async def get_regions(db: AsyncSession) -> list[schemas.RegionBase]:
    """
    Retrieve all regions from the database.

    Args:
        db (AsyncSession): The database session.

    Returns:
        list[schemas.RegionBase]: A list of regions.
    """
    result = await db.execute(
        select(models.Region.region, models.Region.icon, models.Region.color)
        .order_by(models.Region.region.asc())
    )
    regions = result.mappings().all()
    return [schemas.RegionBase.model_validate(region) for region in regions]


async def get_countries(db: AsyncSession) -> list[schemas.CountryBase]:
    """
    Retrieve all countries from the database.

    Args:
        db (AsyncSession): The database session.

    Returns:
        list[schemas.CountryBase]: A list of countries.
    """
    result = await db.execute(
        select(models.Country.country, models.Country.icon, models.Country.color)
        .order_by(models.Country.country.asc())
    )
    countries = result.mappings().all()
    return [schemas.CountryBase.model_validate(country) for country in countries]


async def get_media_types(db: AsyncSession) -> list[schemas.MediaTypeBase]:
    """
    Retrieve all media types from the database.

    Args:
        db (AsyncSession): The database session.

    Returns:
        list[schemas.MediaTypeBase]: A list of media types.
    """
    result = await db.execute(
        select(models.MediaType.type, models.MediaType.icon, models.MediaType.color)
        .order_by(models.MediaType.type.asc())
    )
    media_types = result.mappings().all()
    return [schemas.MediaTypeBase.model_validate(mt) for mt in media_types]
