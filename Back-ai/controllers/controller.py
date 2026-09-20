from fastapi import APIRouter
from typing import Final
from services.ai_core import make_ai_request
from models.py_models import TextRequest, ResponseAI

API_VERSION = "v1"
AI_ROUTER = APIRouter(prefix=f"/ai/{API_VERSION}", tags=["AI Requests"])


CONTENT_TEMPLATE: Final = "Text to analyze: '{text}'."


@AI_ROUTER.post("/generate_ideology")
async def generate_ideology(request: TextRequest) -> ResponseAI | None:
    contents = CONTENT_TEMPLATE.format(text=request.text)
    return await make_ai_request("ideologies", contents)


@AI_ROUTER.post("/generate_sentiment")
async def generate_sentiment(request: TextRequest) -> ResponseAI | None:
    contents = CONTENT_TEMPLATE.format(text=request.text)
    return await make_ai_request("sentiments", contents)