"""
This module sets up the database connection and session management.
"""

import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker


# Database connection URL
DATABASE_URL = os.getenv("DATABASE_URL")


# Create the SQLAlchemy async engine
engine = create_async_engine(DATABASE_URL)


# Create a SessionLocal class to manage sessions
SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provides a new database session for each request.
    """
    async with SessionLocal() as session:
        yield session
