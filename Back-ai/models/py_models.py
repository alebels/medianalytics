from pydantic import BaseModel
from config.sentiments_ideologies_enums import SentimentsEnum, IdeologiesEnum


SENTIMENTS = ", ".join(sentiment.value for sentiment in SentimentsEnum)
IDEOLOGIES = ", ".join(ideology.value.replace("_", "-") for ideology in IdeologiesEnum)


class TextRequest(BaseModel):
    text: str


# Define the Pydantic model for schema validation
class ResponseSchema(BaseModel):
    ideologies: list[IdeologiesEnum] | None = None
    sentiments: list[SentimentsEnum] | None = None


class ResponseAI(BaseModel):
    response: list[IdeologiesEnum] | list[SentimentsEnum]