from __future__ import annotations

import asyncio
import json
import uuid

import google.genai.types as genai_types
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService

from pipeline.config import GEMINI_FLASH_LITE
from pipeline.extractors.base import ExtractedImage
from pipeline.image_evaluator import EVAL_PROMPT, ImageDecision, _maybe_resize


def resize_image(b64: str, fmt: str, max_side: int = 1200) -> str:
    """ADK tool: resize a base64-encoded image so neither side exceeds max_side."""
    return _maybe_resize(b64, fmt, max_side)


image_eval_agent = LlmAgent(
    name="image_evaluator",
    model=GEMINI_FLASH_LITE,
    instruction=EVAL_PROMPT,
    tools=[resize_image],
)

_session_service = InMemorySessionService()
_runner = Runner(session_service=_session_service)


async def evaluate_batch(
    images: list[ExtractedImage], concurrency: int = 5
) -> dict[str, ImageDecision]:
    semaphore = asyncio.Semaphore(concurrency)

    async def _eval_one(img: ExtractedImage) -> tuple[str, ImageDecision]:
        async with semaphore:
            if img.width > 0 and img.height > 0 and (img.width < 60 or img.height < 60):
                return img.id, ImageDecision(action="skip", reason="too_small")

            resized_b64 = _maybe_resize(img.b64, img.fmt, max_side=1200)
            session_id = str(uuid.uuid4())
            user_id = "pipeline"

            await _session_service.create_session(
                app_name=image_eval_agent.name,
                user_id=user_id,
                session_id=session_id,
            )

            message = genai_types.Content(
                parts=[
                    genai_types.Part(
                        inline_data=genai_types.Blob(
                            mime_type=f"image/{img.fmt}",
                            data=resized_b64,
                        )
                    ),
                    genai_types.Part(text=EVAL_PROMPT),
                ]
            )

            try:
                response_text: str | None = None
                async for event in _runner.run_async(
                    agent=image_eval_agent,
                    user_id=user_id,
                    session_id=session_id,
                    new_message=message,
                ):
                    if event.is_final_response():
                        response_text = event.content.parts[0].text
                        break

                if response_text is None:
                    return img.id, ImageDecision(action="skip", reason="eval_error")

                # Strip markdown code fences that some models add around JSON
                cleaned = response_text.strip()
                if cleaned.startswith("```"):
                    cleaned = cleaned.split("```")[1]
                    if cleaned.startswith("json"):
                        cleaned = cleaned[4:]
                    cleaned = cleaned.strip()

                data = json.loads(cleaned)
                score = float(data.get("score", 0.0))
                caption = data.get("caption")

                if score >= 0.55:
                    return img.id, ImageDecision(action="include", score=score, caption=caption)
                return img.id, ImageDecision(action="skip", reason="low_quality", score=score)

            except Exception:
                return img.id, ImageDecision(action="skip", reason="eval_error")

    results = await asyncio.gather(*[_eval_one(img) for img in images])
    return dict(results)
