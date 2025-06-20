import asyncio
import traceback
import json, re
from fastapi import HTTPException
from utils.config import API_KEY, GOOGLE_AI_API_URL
from openai import OpenAI
from models.py_models import ResponseSchema, ResponseAI


# Initialize clients
client = OpenAI(
    api_key=API_KEY,
    base_url=GOOGLE_AI_API_URL
)


async def make_ai_request(
    messages: list,
    max_retries: int = 2
) -> ResponseAI | None:
    """Make a request to the AI provider following OpenAI schema."""

    for attempt in range(1, max_retries + 1):
        try:
            # Add a 10 second delay before making the request to avoid rate limiting per minute
            await asyncio.sleep(10)

            response = client.chat.completions.create(
                model="gemma-3-27b-it",
                messages=messages,
                temperature=0.2,
                top_p=0.9,
            )
            print(f"Attempt {attempt}:", response)

            raw = response.choices[0].message.content
            clean = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.IGNORECASE).strip()
            parsed = json.loads(clean)
            
            if "ideologies" in parsed:
                parsed["ideologies"] = [ideology.replace("-", "_") for ideology in parsed["ideologies"]]
            
            validated = ResponseSchema(**parsed)
            
            if validated.ideologies is not None:
                return ResponseAI(response=validated.ideologies)
            
            if validated.sentiments is not None:
                return ResponseAI(response=validated.sentiments)

        except Exception as e:
            print(f"Error on attempt {attempt}: {e}")
            traceback.print_exc()
            if attempt == max_retries:
                raise HTTPException(
                    status_code=500,
                    detail=f"AI service error after {max_retries} attempts: {e}"
                )
    return None


def get_messages(role_description: str, content: any) -> list:
    """Reusable function to define messages."""
    system_text = (
        f"You are an expert analyst specialized in identifying {role_description} in text. "
        "Provide concise, accurate responses following the specified schema exactly."
    )
    formatting_instructions = (
        f"Respond with exactly one JSON object matching this schema:\n"
        f"{{\"type\": \"object\", "
        f"\"properties\": {{"
        f"    \"{role_description}\": {{"
        f"        \"type\": \"array\", "
        f"        \"items\": {{\"type\": \"string\"}}, "
        f"        \"minItems\": 3, "
        f"        \"maxItems\": 3, "
        f"        \"uniqueItems\": true "
        f"    }}"
        f"}}, "
        f"\"required\": [\"{role_description}\"] "
        f"}}"
    )
    return [
        {
            "role": "user",
            "content": "\n\n".join([system_text, formatting_instructions, content])
        }
    ]