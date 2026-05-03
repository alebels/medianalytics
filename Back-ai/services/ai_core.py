import asyncio
import traceback
import json, re
from fastapi import HTTPException
from utils.config import API_KEY
from google import genai
from google.genai import types
from models.py_models import ResponseSchema, ResponseAI


# Initialize client
client = genai.Client(api_key=API_KEY)


async def make_ai_request(
    system_instruction: str,
    contents: str,
    max_retries: int = 2
) -> ResponseAI | None:
    """Make a request to the AI provider using Google GenAI SDK."""

    print("System Instruction:", system_instruction)
    print("Contents:", contents)
    for attempt in range(1, max_retries + 1):
        try:
            # Add a 10 second delay before making the request to avoid rate limiting per minute
            await asyncio.sleep(10)

            response = await client.aio.models.generate_content(
                # model="gemma-4-31b-it",
                model="gemma-4-26b-a4b-it",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3,
                    top_p=0.9,
                    max_output_tokens=256,
                    thinking_config=types.ThinkingConfig(thinking_level="MINIMAL")
                ),
            )
            print(f"Attempt {attempt}:", response)

            raw = response.text

            # Try to extract the first JSON object from the response
            json_match = re.search(r"\{[^{}]*\}", raw, flags=re.DOTALL)
            if json_match:
                clean = json_match.group(0)
            else:
                clean = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.IGNORECASE).strip()

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
