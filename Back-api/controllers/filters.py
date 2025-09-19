"""
This module contains the controller for handling media-related API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
import models.filters as schemas
import repository.filters as repo
import services.filters as srv
from utils.constants import C_IDEOLOGIES, C_SENTIMENTS
from repository.database import get_session
from utils.limiter import LIMITER


API_VERSION = "api/v1"
FILTERS_ROUTER = APIRouter(prefix=f"/{API_VERSION}/filters", tags=["Filters"])
NUM_REQUESTS = 30


@FILTERS_ROUTER.get("/medias", response_model=list[schemas.MediaRead])
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_medias(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve all media items from the database.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        List of media items if found, otherwise raises a 404 HTTPException.
    """
    db_items = await repo.get_medias(db)
    if not db_items:
        raise HTTPException(status_code=404, detail="No items found")
    return db_items


@FILTERS_ROUTER.get("/sentimentsideologies", response_model=schemas.SentimentsIdeologiesRead)
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_sentiments_ideologies(
    request: Request
):
    """
    Returns:
        Sentiments and ideologies categorized by their groups.
    """
    if srv.SENTIMENTS_IDEOLOGIES_CATEGORIZED is None:
        raise HTTPException(status_code=404, detail="No items found")
    return srv.SENTIMENTS_IDEOLOGIES_CATEGORIZED


@FILTERS_ROUTER.get("/minmaxdate", response_model=schemas.MinMaxDateRead)
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_min_max_date(
    request: Request,
    db: AsyncSession = Depends(get_session)
):
    """
    Returns:
        Minimum and maximum dates of articles available from the database.
    """
    db_item = await repo.get_min_max_date(db)
    if db_item is None:
        raise HTTPException(status_code=404, detail="No items found")
    return db_item


@FILTERS_ROUTER.post("/sentimentsfilter", response_model=schemas.FilterChartsRead)
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def post_sentiments_filter(
    request: Request,
    filter_params: schemas.SentimentsIdeologiesFilter,
    db: AsyncSession = Depends(get_session)
):
    """
    Filter articles based on provided criteria for sentiments.
    
    Args:
        request: The FastAPI request object (required by rate limiter)
        filter_params: Object containing all filter parameters
        db: Database session
        
    Returns:
        List of articles items matching the filter criteria
    """
    db_items = await srv.get_sentiments_ideologies_filter(db, filter_params, C_SENTIMENTS)
    
    if not db_items:
        return schemas.FilterChartsRead(
            medias_count=[], 
            evolution=[], 
            total_count=0
        )
    
    return db_items


@FILTERS_ROUTER.post("/ideologiesfilter", response_model=schemas.FilterChartsRead)
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def post_ideologies_filter(
    request: Request,
    filter_params: schemas.SentimentsIdeologiesFilter,
    db: AsyncSession = Depends(get_session)
):
    """
    Filter articles based on provided criteria for ideologies.
    
    Args:
        request: The FastAPI request object (required by rate limiter)
        filter_params: Object containing all filter parameters
        db: Database session
        
    Returns:
        List of articles items matching the filter criteria
    """
    db_items = await srv.get_sentiments_ideologies_filter(db, filter_params, C_IDEOLOGIES)
    
    if not db_items:
        return schemas.FilterChartsRead(
            medias_count=[], 
            evolution=[], 
            total_count=0
        )
    
    return db_items


@FILTERS_ROUTER.post("/wordsfilter", response_model=list[schemas.ItemRead])
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def post_words_filter(
    request: Request,
    filter_params: schemas.WordsFilter,
    db: AsyncSession = Depends(get_session)
):
    """
    Filter articles based on provided criteria for words.
    
    Args:
        request: The FastAPI request object (required by rate limiter)
        filter_params: Object containing all filter parameters
        db: Database session
        
    Returns:
        List of articles items matching the filter criteria
    """
    db_items = await srv.get_words_filter(db, filter_params)
    
    if not db_items:
        return []
    
    return db_items