from config.sentiments_ideologies_enums import (IdeologiesEnum, SentimentsEnum)
from pydantic import BaseModel, Field, StringConstraints
from typing import Annotated
from config.constant_enums import (
    MediaTypeEnum,
    RegionsEnum,
    CountriesEnum
)
from models.utils import (
    ItemRead,
    ItemDate,
    DateChartRead
)
from datetime import date


class MediaRead(BaseModel):
    """
    Pydantic model for reading media.
    """

    id: int
    name: Annotated[str, StringConstraints(min_length=2, max_length=50)]
    type: MediaTypeEnum
    region: RegionsEnum
    country: CountriesEnum

    class Config:
        """
        Configuration for MediaRead model.
        """

        from_attributes = True


class CategoryValues(BaseModel):
    """
    Pydantic model for reading category and values.
    """

    category: str
    values: list[str]


class SentimentsIdeologiesRead(BaseModel):
    """
    A Pydantic model representing sentiment and ideology results.
    """
    
    sentiments: list[CategoryValues]
    ideologies: list[CategoryValues]


class MinMaxDateRead(BaseModel):
    """
    Pydantic model for reading minimum and maximum dates.
    """

    min_date: date
    max_date: date


class FillQuery(BaseModel):
    """
    A model representing a query with its parameters for database operations.
    Attributes:
        query (str): The SQL query string to be executed.
        params (dict): A dictionary of parameters to be used with the query,
                       typically for parameterized queries to prevent SQL injection.
    """

    query: str
    params: dict


class FilterData(BaseModel):
    """
    Pydantic model for reading filter charts data.
    """

    plain: list[ItemRead] | None = None
    dated: list[ItemDate] | None = None


class FilterChartsRead(BaseModel):
    """
    Pydantic model for reading filter charts data.
    """

    plain: list[ItemRead] | None = None
    categorized: list[ItemRead] | None = None
    date_chart: DateChartRead | None = None


class BaseFilter(BaseModel):
    """
    Base filter model for articles and words.
    """

    media_id: Annotated[int, Field(gt=0)] | None = None
    type: MediaTypeEnum | None = None
    region: RegionsEnum | None = None
    country: CountriesEnum | None = None
    dates: list[date] | None = None

    class Config:
        """
        Configuration for BaseFilter model.
        """
        frozen = True


class SentimentsIdeologiesFilter(BaseFilter):
    """
    Filter model for sentiments and ideologies.
    All fields are optional and can be None if not provided by the frontend.
    """
    sentiments: list[SentimentsEnum] | None = None
    ideologies: list[IdeologiesEnum] | None = None

    class Config:
        """
        Configuration for SentimentsIdeologiesFilter model.
        """
        frozen = True


class WordsFilter(BaseFilter):
    """
    Filter model for words.
    """
    min_range: Annotated[int | None, Field(gt=-1, lt=100000)] = None
    max_range: Annotated[int, Field(gt=0, lt=100000)] = 200
    order_by_desc: bool = True

    class Config:
        """
        Configuration for WordsFilter model.
        """
        frozen = True