from fastapi import APIRouter
from services.ai_core import make_ai_request, get_messages
from models.py_models import TextRequest, SENTIMENTS, IDEOLOGIES
from models.ai_templates import TEMPLATE_IDEOLOGICAL, TEMPLATE_SENTIMENT

API_VERSION = "v1"
AI_ROUTER = APIRouter(prefix=f"/ai/{API_VERSION}", tags=["AI Requests"])


# Define the API endpoints for ideology and sentiment generation
@AI_ROUTER.post("/generate_ideology")
async def generate_ideology(request: TextRequest):
    messages = get_messages("ideologies", TEMPLATE_IDEOLOGICAL.format(
        text=request.text,
        ideologies=IDEOLOGIES
    ))
    return await make_ai_request(messages)


@AI_ROUTER.post("/generate_sentiment")
async def generate_sentiment(request: TextRequest):
    messages = get_messages("sentiments", TEMPLATE_SENTIMENT.format(
        text=request.text,
        sentiments=SENTIMENTS
    ))
    return await make_ai_request(messages)