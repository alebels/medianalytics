from pydantic import BaseModel, field_validator
from services.shared_data import SHARED_STORE


class TextRequest(BaseModel):
    text: str


class ResponseSchema(BaseModel):
    ideologies: list[str] | None = None
    sentiments: list[str] | None = None

    @field_validator("ideologies", mode="before")
    @classmethod
    def validate_ideologies(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            invalid = next((item for item in v if item not in SHARED_STORE.ideologies), None)
            if invalid:
                raise ValueError(f"Invalid ideology: {invalid}")
        return v

    @field_validator("sentiments", mode="before")
    @classmethod
    def validate_sentiments(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            invalid = next((item for item in v if item not in SHARED_STORE.sentiments), None)
            if invalid:
                raise ValueError(f"Invalid sentiment: {invalid}")
        return v


class ResponseAI(BaseModel):
    response: list[str]