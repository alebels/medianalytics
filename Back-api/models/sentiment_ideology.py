from pydantic import BaseModel


class CategoryValues(BaseModel):
    """
    Pydantic model for a category with its associated values.
    """

    category: str
    color: str | None = None
    icon: str | None = None
    values: list[str]


class SentimentsIdeologiesRead(BaseModel):
    """
    Pydantic model representing compound sentiments and ideologies
    grouped by their categories.
    """

    sentiments: list[CategoryValues]
    ideologies: list[CategoryValues]


class SentimentsIdeologiesConfig(BaseModel):
    """
    Pydantic model for configuring sentiments and ideologies
    Contains lists of available sentiments and ideologies.
    """

    sentiments: list[str]
    ideologies: list[str]