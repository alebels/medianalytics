"""
Shared Pydantic models across services (back-api, back-data, back-ai).
Single source of truth for schema definitions matching database entities.
"""

from pydantic import BaseModel, StringConstraints
from typing import Annotated


# ----------------- REGION / COUNTRY / MEDIA TYPE -----------------
class RegionBase(BaseModel):
    """
    Pydantic model for region base schema.
    """

    region: Annotated[str, StringConstraints(min_length=2, max_length=80)]
    icon: Annotated[str, StringConstraints(min_length=1, max_length=50)] | None = None
    color: Annotated[str, StringConstraints(min_length=1, max_length=10)] | None = None


class CountryBase(BaseModel):
    """
    Pydantic model for country base schema.
    """

    country: Annotated[str, StringConstraints(min_length=2, max_length=80)]
    icon: Annotated[str, StringConstraints(min_length=1, max_length=50)] | None = None
    color: Annotated[str, StringConstraints(min_length=1, max_length=10)] | None = None


class MediaTypeBase(BaseModel):
    """
    Pydantic model for media type base schema.
    """

    type: Annotated[str, StringConstraints(min_length=2, max_length=80)]
    icon: Annotated[str, StringConstraints(min_length=1, max_length=50)]
    color: Annotated[str, StringConstraints(min_length=1, max_length=10)] | None = None