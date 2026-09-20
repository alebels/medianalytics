"""
This module contains the controller for handling shared lookup data API endpoints.
"""

import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
import config.shared_models as schemas
import repository.shared as repo
import repository.sentiment_ideology as sentiment_ideology_repo
from models.sentiment_ideology import SentimentsIdeologiesConfig
from repository.database import get_session, SessionLocal
from services.filters import clear_sentiments_ideologies_cache
from utils.limiter import LIMITER
from utils.redis_cache import cache_response, invalidate_cache_pattern

logger = logging.getLogger(__name__)

API_VERSION = "api/v1"
SHARED_ROUTER = APIRouter(prefix=f"/{API_VERSION}/config", tags=["Config"])
NUM_REQUESTS = 30


@SHARED_ROUTER.get("/regions", response_model=list[schemas.RegionBase])
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
@cache_response(key_prefix="v1:config:regions", ttl=2592000)
async def get_regions(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the list of regions.

    Args:
        request: FastAPI request object.
        db (AsyncSession): The database session.

    Returns:
        A list of regions.
    """
    try:
        db_items = await repo.get_regions(db)
        if not db_items:
            raise HTTPException(status_code=404, detail="No regions found")
        return db_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving regions")


@SHARED_ROUTER.get("/countries", response_model=list[schemas.CountryBase])
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
@cache_response(key_prefix="v1:config:countries", ttl=2592000)
async def get_countries(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the list of countries.

    Args:
        request: FastAPI request object.
        db (AsyncSession): The database session.

    Returns:
        A list of countries.
    """
    try:
        db_items = await repo.get_countries(db)
        if not db_items:
            raise HTTPException(status_code=404, detail="No countries found")
        return db_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving countries")


@SHARED_ROUTER.get("/mediatypes", response_model=list[schemas.MediaTypeBase])
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
@cache_response(key_prefix="v1:config:mediatypes", ttl=2592000)
async def get_media_types(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the list of media types.

    Args:
        request: FastAPI request object.
        db (AsyncSession): The database session.

    Returns:
        A list of media types.
    """
    try:
        db_items = await repo.get_media_types(db)
        if not db_items:
            raise HTTPException(status_code=404, detail="No media types found")
        return db_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving media types")


@SHARED_ROUTER.get("/sentimentsideologies", response_model=SentimentsIdeologiesConfig)
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
@cache_response(key_prefix="v1:config:sentimentsideologies", ttl=2592000)
async def get_plain_sentiments_ideologies(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Returns:
        Active sentiments and ideologies as plain flat lists.
    """
    try:
        data = await sentiment_ideology_repo.get_plain_sentiments_ideologies(db)
        if not data:
            raise HTTPException(status_code=404, detail="No items found")
        return data
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving sentiments and ideologies")


# TODO: Do I use it?
async def warm_shared_cache_async() -> None:
    """
    Warm cache for shared endpoints by calling controllers directly with mock Request.
    This ensures @cache_response decorator executes and populates Redis.
    """
    async with SessionLocal() as db:
        try:
            # Create mock Request for cache key generation
            scope = {
                "type": "http",
                "method": "GET",
                "scheme": "http",
                "server": ("internal", 80),
                "path": "/warmup",
                "query_string": b"",
                "headers": [],
                "app": None,
            }
            mock_request = Request(scope)

            # Call controllers sequentially to avoid concurrent operations on the same AsyncSession
            await get_regions(mock_request, db)
            await get_countries(mock_request, db)
            await get_media_types(mock_request, db)
            await get_plain_sentiments_ideologies(mock_request, db)

            logger.info("Shared cache warmup completed")

        except asyncio.TimeoutError:
            logger.error("Shared cache warmup timed out")
        except Exception as e:
            logger.error(f"Shared cache warmup failed: {e}", exc_info=True)


@SHARED_ROUTER.post("/internal/cache/invalidate")
@LIMITER.limit("5/minute")
async def invalidate_shared_cache(request: Request):
    """
    Invalidate all shared endpoint caches and warm them with fresh data.
    Protected by nginx - only accessible from Docker internal network.

    Args:
        request: FastAPI request object

    Returns:
        Status of cache invalidation and warmup
    """
    try:
        # Wait for ongoing transactions to complete
        await asyncio.sleep(30)

        # Clear process-level in-memory cache
        clear_sentiments_ideologies_cache()

        # Invalidate all shared config caches and filters sentiments/ideologies cache
        shared_deleted = await invalidate_cache_pattern("cache:*:v1:config:*")
        filters_deleted = await invalidate_cache_pattern("cache:*:v1:filters:sentimentsideologies*")
        total_deleted = shared_deleted + filters_deleted
        logger.info(
            f"Invalidated {total_deleted} cache keys ({shared_deleted} config, {filters_deleted} filters)"
        )

        # Warm cache asynchronously (don't block response)
        # Creates its own DB session to avoid connection lifecycle issues
        asyncio.create_task(warm_shared_cache_async())

        return {
            "status": "success",
            "message": f"Shared cache invalidated ({total_deleted} keys), warmup started"
        }

    except Exception as e:
        logger.error(f"❌ Shared cache invalidation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Shared cache invalidation failed")
