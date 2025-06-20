"""
This module contains the controller for handling media-related API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
import models.py_schemas as schemas
import repository.home as repo
import services.home as srv
from repository.database import get_session
from utils.limiter import LIMITER

API_VERSION = "api/v1"
HOME_ROUTER = APIRouter(prefix=f"/{API_VERSION}/home", tags=["Home"])
NUM_REQUESTS = 30


@HOME_ROUTER.get("/generaltotalmedias", response_model=int)
@LIMITER.limit(f"{NUM_REQUESTS}/minute")
async def get_general_total_medias(
    request: Request, db: AsyncSession = Depends(get_session)
):
    """
    Retrieve the total count of useful medias.
    
    Args:
        db (AsyncSession): The database session.
        
    Returns:
        Total number of useful medias in the database.
    """
    total = await repo.get_general_total_medias(db)
    if total is None:
        raise HTTPException(status_code=404, detail="No items found")
    return total


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
    total = await repo.get_general_total_articles(db)
    if total is None:
        raise HTTPException(status_code=404, detail="No items found")
    return total


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
    total = await repo.get_general_total_words(db)
    if total is None:
        raise HTTPException(status_code=404, detail="No words found")
    return total


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
    
    db_items = await repo.get_general_top_words(db)
    if not db_items:
        raise HTTPException(status_code=404, detail="No top words found")
    return db_items


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
    db_items = await repo.get_general_bottom_words(db)
    if not db_items:
        raise HTTPException(status_code=404, detail="No bottom words found")
    return db_items


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
    average = await repo.get_general_average_word_count(db)
    if average is None:
        raise HTTPException(status_code=404, detail="No articles found")
    return average


@HOME_ROUTER.get("/generalsentiments", response_model=schemas.CompoundRead)
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
    db_items = await srv.get_compound_sentiments(db)
    if not db_items:
        raise HTTPException(status_code=404, detail="No sentiments found")
    return db_items


@HOME_ROUTER.get("/generalideologies", response_model=schemas.CompoundRead)
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
    db_items = await srv.get_compound_ideologies(db)
    if not db_items:
        raise HTTPException(status_code=404, detail="No ideologies found")
    return db_items


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
    db_items = await repo.get_general_top_grammar(db)
    if not db_items:
        raise HTTPException(status_code=404, detail="No grammars found")
    return db_items


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
    db_items = await srv.get_general_table(db)
    if not db_items:
        raise HTTPException(status_code=404, detail="No items found")
    return db_items