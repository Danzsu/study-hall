"""Async Google AI Studio client for text, JSON, and vision tasks."""
import base64
import json
import re

from google import genai
from google.genai import types
from pipeline.config import GOOGLE_AI_KEY, GEMINI_FLASH, GEMINI_FLASH_LITE

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=GOOGLE_AI_KEY)
    return _client


async def text(prompt: str, system: str = "", model: str = GEMINI_FLASH) -> str:
    """Generate text. Returns raw string."""
    config = types.GenerateContentConfig(system_instruction=system or None)
    r = await _get_client().aio.models.generate_content(
        model=model,
        contents=prompt,
        config=config,
    )
    return r.text.strip()


async def json_call(prompt: str, system: str = "", model: str = GEMINI_FLASH_LITE) -> dict | list:
    """Generate and parse JSON. Falls back to regex extraction if parse fails."""
    raw = await text(prompt, system, model)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raw = re.sub(r'^```(?:json)?\s*', '', raw.strip(), flags=re.MULTILINE)
        raw = re.sub(r'\s*```$', '', raw.strip(), flags=re.MULTILINE)
        match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', raw)
        if match:
            return json.loads(match.group(1))
        return {}


async def vision(b64_data: str, prompt: str, mime_type: str = "image/png", model: str = GEMINI_FLASH_LITE) -> dict | list:
    """Vision call with base64 image. Returns parsed JSON."""
    img_bytes = base64.b64decode(b64_data)
    contents = [
        types.Part.from_bytes(data=img_bytes, mime_type=mime_type),
        prompt,
    ]
    r = await _get_client().aio.models.generate_content(
        model=model,
        contents=contents,
    )
    raw = r.text.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raw = re.sub(r'^```(?:json)?\s*', '', raw, flags=re.MULTILINE)
        raw = re.sub(r'\s*```$', '', raw, flags=re.MULTILINE)
        match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', raw)
        if match:
            return json.loads(match.group(1))
        return {}
