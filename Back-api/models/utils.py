from pydantic import BaseModel, Field, StringConstraints
from typing import Annotated
from datetime import date


class ItemRead(BaseModel):
    """
    Pydantic model for items schema used in most cases.
    """

    name: Annotated[str, StringConstraints(min_length=2, max_length=70)]
    count: Annotated[float | int, Field(gt=0)]


class ItemDate(ItemRead):
    """
    Pydantic model for reading item date.
    """
    count: Annotated[int | None, Field(default=None, gt=0, exclude_none=True)]
    date: date


class CompoundRead(BaseModel):
    """
    This class is used to organize read items into plain and categorized lists.
    """

    plain: list[ItemRead]
    categorized: list[ItemRead]


class ItemSerie(BaseModel):
    name: str
    data: list[int | None]


class DateChartRead(BaseModel):
    items: list[ItemSerie]
    labels: list[date]