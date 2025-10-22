"""
This module contains the controller for handling media-related API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
import models.home as schemas
from models.utils import CompoundRead
import repository.home as repo
import services.home as srv
from repository.database import get_session
from utils.limiter import LIMITER
from utils.constants import C_GENERAL, C_DAY, C_SENTIMENTS, C_IDEOLOGIES

API_VERSION = "api/v1"
HOME_ROUTER = APIRouter(prefix=f"/{API_VERSION}/home", tags=["Home"])
NUM_REQUESTS = 30


@HOME_ROUTER.get("/generalmedias", response_model=list[schemas.MediaItemRead])
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_medias(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the list of media items with their details.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        A list of media items.
    """
    try:
        db_items = await repo.get_general_medias(db)
        if not db_items:
            raise HTTPException(status_code=404, detail="No items found")
        return db_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving media items")


@HOME_ROUTER.get("/generaltotalarticles", response_model=int)
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_total_articles(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the total count of media articles.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        Total number of articles in the database.
    """
    try:
        total = await repo.get_general_total_articles(db)
        if total is None:
            raise HTTPException(status_code=404, detail="No items found")
        return total
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving article count")


@HOME_ROUTER.get("/generaltotalwords", response_model=int)
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_total_words(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the total count of words in the database.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        Total number of words in the database.
    """
    try:
        total = await repo.get_general_total_words(db)
        if total is None:
            raise HTTPException(status_code=404, detail="No words found")
        return total
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving word count")


@HOME_ROUTER.get("/generaltopwords", response_model=list[schemas.ItemRead])
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_top_words(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the top most repeated words.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        A list of the top words.
    """
    try:
        db_items = await repo.get_general_top_words(db)
        if not db_items:
            raise HTTPException(status_code=404, detail="No top words found")
        return db_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving top words")


@HOME_ROUTER.get("/generalbottomwords", response_model=list[schemas.ItemRead])
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_bottom_words(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the bottom less repeated words.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        A list of the bottom words.
    """
    try:
        db_items = await repo.get_general_bottom_words(db)
        if not db_items:
            raise HTTPException(status_code=404, detail="No bottom words found")
        return db_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving bottom words")


@HOME_ROUTER.get("/generalaveragewordcount", response_model=int)
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_average_word_count(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the average word count across all articles.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        The average number of words per article.
    """
    try:
        average = await repo.get_general_average_word_count(db)
        if average is None:
            raise HTTPException(status_code=404, detail="No articles found")
        return average
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error calculating average word count")


@HOME_ROUTER.get("/generalsentiments", response_model=CompoundRead)
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_sentiments(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the sentiments by frequency across all articles.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        A list of the sentiments with their counts.
    """
    try:
        db_items = await srv.get_compound_sentiments_ideologies(db, C_GENERAL, C_SENTIMENTS)
        if not db_items:
            raise HTTPException(status_code=404, detail="No sentiments found")
        return db_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving sentiments")


@HOME_ROUTER.get("/generalideologies", response_model=CompoundRead)
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_ideologies(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the ideologies by frequency across all articles.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        A list of the ideologies with their counts.
    """
    try:
        db_items = await srv.get_compound_sentiments_ideologies(db, C_GENERAL, C_IDEOLOGIES)
        if not db_items:
            raise HTTPException(status_code=404, detail="No ideologies found")
        return db_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving ideologies")


@HOME_ROUTER.get("/generaltopgrammar", response_model=list[schemas.ItemRead])
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_top_grammar(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the get_general_top_grammar
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        A list of the grammar with their counts.
    """
    try:
        db_items = await repo.get_general_top_grammar(db)
        if not db_items:
            raise HTTPException(status_code=404, detail="No grammars found")
        return db_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving grammar data")


@HOME_ROUTER.get("/generaltable", response_model=list[schemas.GeneralMediaItemRead])
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_table(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the general table data including name, type, and country.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        A list of general media items.
    """
    try:
        db_items = await srv.get_general_table(db)
        if not db_items:
            raise HTTPException(status_code=404, detail="No items found")
        return db_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving table data")


@HOME_ROUTER.get("/generaldaytopwords", response_model=list[schemas.ItemRead])
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_day_top_words(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the top most repeated words for the latest day.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        A list of the top words for the latest insert_date.
    """
    try:
        db_items = await repo.get_general_day_top_words(db)
        if not db_items:
            raise HTTPException(status_code=404, detail="No top words found for today")
        return db_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving daily top words")


@HOME_ROUTER.get("/generaldaysentiments", response_model=CompoundRead)
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_day_sentiments(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the sentiments by frequency for articles from the latest day.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        A list of the sentiments with their counts for the latest insert_date.
    """
    try:
        db_items = await srv.get_compound_sentiments_ideologies(db, C_DAY, C_SENTIMENTS)
        if not db_items:
            raise HTTPException(status_code=404, detail="No sentiments found for today")
        return db_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving daily sentiments")


@HOME_ROUTER.get("/generaldayideologies", response_model=CompoundRead)
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_day_ideologies(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the ideologies by frequency for articles from the latest day.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        A list of the ideologies with their counts for the latest insert_date.
    """
    try:
        db_items = await srv.get_compound_sentiments_ideologies(db, C_DAY, C_IDEOLOGIES)
        if not db_items:
            raise HTTPException(status_code=404, detail="No ideologies found for today")
        return db_items
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Error retrieving daily ideologies")