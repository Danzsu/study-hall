"""Shared Groq API client with retry logic and rate limiting."""
import time
import json
import httpx
from pipeline.config import GROQ_API_KEY, OPENROUTER_API_KEY

GROQ_BASE = "https://api.groq.com/openai/v1/chat/completions"
OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions"

# Fallback model order
FALLBACK_MODELS = [
    ("groq", "llama-3.3-70b-versatile"),
    ("groq", "llama-3.1-8b-instant"),
    ("openrouter", "google/gemma-4-26b-a4b-it:free"),
    ("openrouter", "nvidia/nemotron-3-super-120b-a12b:free"),
]


def chat(
    messages: list[dict],
    model: str = "llama-3.3-70b-versatile",
    provider: str = "groq",
    max_tokens: int = 2000,
    temperature: float = 0.4,
    json_mode: bool = False,
    retries: int = 3,
    retry_delay: float = 5.0,
) -> str:
    """
    Call an LLM with retry + fallback logic.
    Returns the response text content.
    """
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    last_error = None

    for attempt in range(retries):
        try:
            if provider == "groq":
                if not GROQ_API_KEY:
                    raise ValueError("GROQ_API_KEY not set in .env.local")
                headers = {
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                }
                url = GROQ_BASE
            else:  # openrouter
                if not OPENROUTER_API_KEY:
                    raise ValueError("OPENROUTER_API_KEY not set in .env.local")
                headers = {
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://study-hall.vercel.app",
                    "X-Title": "Study Hall",
                }
                url = OPENROUTER_BASE

            with httpx.Client(timeout=60.0) as client:
                resp = client.post(url, headers=headers, json=payload)

            if resp.status_code == 429:
                # Rate limited — wait and retry
                wait = retry_delay * (attempt + 1)
                print(f"    Rate limited. Waiting {wait:.0f}s before retry {attempt+1}/{retries}...")
                time.sleep(wait)
                last_error = f"Rate limit (429)"
                continue

            if resp.status_code != 200:
                last_error = f"HTTP {resp.status_code}: {resp.text[:200]}"
                time.sleep(retry_delay)
                continue

            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

        except httpx.TimeoutException:
            last_error = "Timeout"
            print(f"    Timeout on attempt {attempt+1}/{retries}, retrying...")
            time.sleep(retry_delay)
        except Exception as e:
            last_error = str(e)
            print(f"    Error on attempt {attempt+1}/{retries}: {e}")
            time.sleep(retry_delay)

    raise RuntimeError(f"All {retries} attempts failed for {provider}/{model}. Last error: {last_error}")


def chat_with_fallback(
    messages: list[dict],
    max_tokens: int = 2000,
    temperature: float = 0.4,
    json_mode: bool = False,
    prefer_fast: bool = False,
) -> str:
    """
    Try models in fallback order. Uses fast model if prefer_fast=True.
    """
    models = FALLBACK_MODELS.copy()
    if prefer_fast:
        # Put fast model first
        models = [("groq", "llama-3.1-8b-instant")] + [m for m in models if m[1] != "llama-3.1-8b-instant"]

    for provider, model in models:
        if provider == "groq" and not GROQ_API_KEY:
            continue
        if provider == "openrouter" and not OPENROUTER_API_KEY:
            continue
        try:
            return chat(
                messages=messages,
                model=model,
                provider=provider,
                max_tokens=max_tokens,
                temperature=temperature,
                json_mode=json_mode,
                retries=2,
                retry_delay=3.0,
            )
        except RuntimeError as e:
            print(f"    Fallback: {provider}/{model} failed, trying next...")
            continue

    raise RuntimeError("All models and providers failed.")


def parse_json_response(raw: str) -> dict | list:
    """Parse JSON from LLM response, handling markdown code blocks."""
    raw = raw.strip()
    # Strip ```json ... ``` wrapper if present
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(raw)
