from fastapi import APIRouter
from services.ai_core import make_ai_request
from models.py_models import TextRequest
from models.ai_templates import (
    SYSTEM_IDEOLOGICAL, SYSTEM_SENTIMENT,
    CONTENT_TEMPLATE
)

API_VERSION = "v1"
AI_ROUTER = APIRouter(prefix=f"/ai/{API_VERSION}", tags=["AI Requests"])


# Define the API endpoints for ideology and sentiment generation
@AI_ROUTER.post("/generate_ideology")
async def generate_ideology(request: TextRequest):
    contents = CONTENT_TEMPLATE.format(text=request.text)
    return await make_ai_request(SYSTEM_IDEOLOGICAL, contents)


@AI_ROUTER.post("/generate_sentiment")
async def generate_sentiment(request: TextRequest):
    contents = CONTENT_TEMPLATE.format(text=request.text)
    return await make_ai_request(SYSTEM_SENTIMENT, contents)