"""4-step diagram generation pipeline: Plan → Generate → Evaluate → Refine."""
from __future__ import annotations
import asyncio
import base64
import json
import os
import re
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from pipeline.config import GEMINI_FLASH, GEMINI_FLASH_LITE, GOOGLE_AI_KEY
from pipeline.gemini_client import json_call as gemini_json, text as gemini_text, vision as gemini_vision
from pipeline.excalidraw_design_system import DIAGRAM_SYSTEM_PROMPTS, build_user_prompt


# ── Data types ───────────────────────────────────────────────────────────────

DiagramMethod = Literal["mermaid", "excalidraw", "imagen", "placeholder"]

DIAGRAM_TYPE_ROUTING: dict[str, DiagramMethod] = {
    "flowchart":          "mermaid",
    "sequence":           "mermaid",
    "er_diagram":         "mermaid",
    "class_diagram":      "mermaid",
    "gantt":              "mermaid",
    "state_diagram":      "mermaid",
    "concept_map":        "excalidraw",
    "comparison":         "excalidraw",
    "system_overview":    "excalidraw",
    "explanation_visual": "excalidraw",
    "architecture":       "excalidraw",
    "process_visual":     "excalidraw",
    "illustration":       "imagen",
    "anatomy":            "imagen",
    "chemistry":          "imagen",
    "circuit_schematic":  "imagen",
    "photo_realistic":    "imagen",
    "geographic_map":     "imagen",
}


@dataclass
class DiagramSpec:
    id: str
    concept: str
    diagram_type: str
    elements: list[str] = field(default_factory=list)
    relationships: list[str] = field(default_factory=list)
    method: DiagramMethod = "placeholder"

    def __post_init__(self):
        if self.method == "placeholder":
            self.method = DIAGRAM_TYPE_ROUTING.get(self.diagram_type, "excalidraw")


@dataclass
class GeneratedDiagram:
    spec: DiagramSpec
    method: DiagramMethod
    path: str | None = None      # relative path to PNG file
    mermaid_code: str | None = None
    excalidraw_json: str | None = None
    quality_score: float = 0.0
    error: str | None = None


@dataclass
class DiagramConfig:
    output_dir: Path
    diagram_mode: Literal["auto", "mermaid_only", "excalidraw_only", "off"] = "auto"
    max_per_section: int = 3


# ── Step 1: Plan ─────────────────────────────────────────────────────────────

PLAN_PROMPT = """Identify diagrams needed in these study notes.
For each diagram specify:
- concept: what concept it illustrates
- type: one of "flowchart" | "concept_map" | "sequence" | "comparison" | "architecture" | "process_visual" | "explanation_visual"
- elements: list of key items/nodes to show (3-8 items)
- relationships: how elements connect (3-6 relationships)

Return a JSON array. Maximum {max_diagrams} diagrams.
If no diagrams are needed, return [].

Study notes:
{notes_text}"""


async def plan_diagrams(section_mdx: str, max_diagrams: int = 3) -> list[DiagramSpec]:
    """Step 1: Identify needed diagrams from section MDX."""
    prompt = PLAN_PROMPT.format(
        notes_text=section_mdx[:3000],
        max_diagrams=max_diagrams,
    )
    result = await gemini_json(prompt, model=GEMINI_FLASH)
    if not isinstance(result, list):
        return []

    specs = []
    for i, item in enumerate(result[:max_diagrams]):
        if not isinstance(item, dict):
            continue
        specs.append(DiagramSpec(
            id=f"diag-{i+1:02d}",
            concept=str(item.get("concept", "")),
            diagram_type=str(item.get("type", "flowchart")),
            elements=list(item.get("elements", [])),
            relationships=list(item.get("relationships", [])),
        ))
    return specs


# ── Step 2: Generate ─────────────────────────────────────────────────────────

MERMAID_PROMPT = """Generate a Mermaid diagram for this concept.

Concept: {concept}
Type mapping:
  flowchart      → flowchart TD
  sequence       → sequenceDiagram
  concept_map    → graph LR
  comparison     → graph LR (two parallel branches)
  er_diagram     → erDiagram
  class_diagram  → classDiagram
  state_diagram  → stateDiagram-v2

Elements: {elements}
Relationships: {relationships}

Rules:
- Use simple node IDs (letters/underscores only, no spaces)
- Max 10 nodes
- Node labels can contain spaces in quotes: A["My Label"]
- Return ONLY the Mermaid code, starting with the diagram type keyword"""


async def _generate_mermaid(spec: DiagramSpec) -> str:
    prompt = MERMAID_PROMPT.format(
        concept=spec.concept,
        elements=", ".join(spec.elements),
        relationships=", ".join(spec.relationships),
    )
    raw = await gemini_text(prompt, model=GEMINI_FLASH_LITE)
    # Strip markdown fences if LLM wraps it
    raw = re.sub(r'^```(?:mermaid)?\s*', '', raw.strip(), flags=re.MULTILINE)
    raw = re.sub(r'\s*```$', '', raw.strip(), flags=re.MULTILINE)
    return raw.strip()


async def _generate_excalidraw(spec: DiagramSpec) -> str:
    system = DIAGRAM_SYSTEM_PROMPTS.get(spec.diagram_type, DIAGRAM_SYSTEM_PROMPTS["flowchart"])
    prompt = build_user_prompt(spec.concept, spec.diagram_type, spec.elements, spec.relationships)
    raw = await gemini_text(prompt, system=system, model=GEMINI_FLASH_LITE)
    # Strip markdown fences
    raw = re.sub(r'^```(?:json)?\s*', '', raw.strip(), flags=re.MULTILINE)
    raw = re.sub(r'\s*```$', '', raw.strip(), flags=re.MULTILINE)
    return raw.strip()


async def _generate_imagen(spec: DiagramSpec, output_dir: Path) -> str | None:
    """Generate image via Gemini Imagen API. Returns path or None."""
    if not GOOGLE_AI_KEY:
        return None
    try:
        from google import genai as _genai
        from google.genai import types as _types
        _client = _genai.Client(api_key=GOOGLE_AI_KEY)
        prompt = (
            f"Educational diagram: {spec.concept}. "
            f"Clean, professional illustration style. "
            f"Show: {', '.join(spec.elements[:5])}. "
            "White background, labeled clearly."
        )
        result = await _client.aio.models.generate_images(
            model="imagen-3.0-generate-002",
            prompt=prompt,
            config=_types.GenerateImagesConfig(number_of_images=1),
        )
        if result.generated_images:
            out_path = output_dir / f"{spec.id}.png"
            out_path.write_bytes(result.generated_images[0].image.image_bytes)
            return str(out_path.relative_to(output_dir.parent.parent))
    except Exception as e:
        print(f"  Imagen failed for {spec.id}: {e}")
    return None


# ── Render helpers ────────────────────────────────────────────────────────────

def _render_mermaid(mermaid_code: str, output_path: Path) -> bool:
    """Render Mermaid to PNG via mmdc CLI. Returns True on success."""
    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".mmd", delete=False) as f:
            f.write(mermaid_code)
            tmp_path = f.name
        result = subprocess.run(
            ["mmdc", "-i", tmp_path, "-o", str(output_path), "-w", "800", "-H", "600"],
            capture_output=True, text=True, timeout=30,
        )
        Path(tmp_path).unlink(missing_ok=True)
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def _render_excalidraw(excalidraw_json: str, output_path: Path) -> bool:
    """Render Excalidraw JSON to PNG via Node.js renderer. Returns True on success."""
    renderer = Path(__file__).parent.parent / "scripts" / "render-excalidraw.js"
    if not renderer.exists():
        return False
    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
            f.write(excalidraw_json)
            tmp_path = f.name
        result = subprocess.run(
            ["node", str(renderer), tmp_path, str(output_path)],
            capture_output=True, text=True, timeout=60,
        )
        Path(tmp_path).unlink(missing_ok=True)
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


# ── Step 3: Generate + route ──────────────────────────────────────────────────

async def generate_diagram(spec: DiagramSpec, config: DiagramConfig) -> GeneratedDiagram:
    """Step 3: Generate diagram using the appropriate method."""
    config.output_dir.mkdir(parents=True, exist_ok=True)
    output_path = config.output_dir / f"{spec.id}.png"

    effective_method = spec.method
    if config.diagram_mode == "mermaid_only":
        effective_method = "mermaid"
    elif config.diagram_mode == "excalidraw_only":
        effective_method = "excalidraw"

    # Mermaid path
    if effective_method == "mermaid":
        try:
            mermaid_code = await _generate_mermaid(spec)
            render_ok = _render_mermaid(mermaid_code, output_path)
            if render_ok:
                return GeneratedDiagram(
                    spec=spec, method="mermaid",
                    path=str(output_path),
                    mermaid_code=mermaid_code,
                )
            # mmdc not installed — fall through to excalidraw
            print(f"  mmdc not available for {spec.id}, falling back to excalidraw")
        except Exception as e:
            print(f"  Mermaid generation failed for {spec.id}: {e}")

    # Excalidraw path (also fallback from mermaid)
    if effective_method in ("mermaid", "excalidraw"):
        try:
            excalidraw_json = await _generate_excalidraw(spec)
            render_ok = _render_excalidraw(excalidraw_json, output_path)
            path = str(output_path) if render_ok else None
            return GeneratedDiagram(
                spec=spec, method="excalidraw",
                path=path,
                excalidraw_json=excalidraw_json,
            )
        except Exception as e:
            print(f"  Excalidraw generation failed for {spec.id}: {e}")

    # Imagen path
    if effective_method == "imagen":
        img_path = await _generate_imagen(spec, config.output_dir)
        if img_path:
            return GeneratedDiagram(spec=spec, method="imagen", path=img_path)

    return GeneratedDiagram(spec=spec, method="placeholder", error="all methods failed")


# ── Step 4: Evaluate + Refine ─────────────────────────────────────────────────

EVAL_PROMPT = """Does this diagram accurately represent the concept? Return JSON only:
{{"score": 0.0, "issue": null}}

score: 0.0-1.0
  1.0 = all elements present, relationships clear
  0.6 = most elements present, minor issues
  0.3 = missing key elements or misleading
  0.0 = wrong concept entirely

issue: one sentence describing the problem, or null if score >= 0.6

Concept: {concept}
Expected elements: {elements}"""


async def evaluate_diagram(diagram: GeneratedDiagram) -> tuple[float, str | None]:
    """Step 4a: Vision-evaluate a generated diagram. Returns (score, issue)."""
    if not diagram.path or not Path(diagram.path).exists():
        return 0.0, "no image file"
    try:
        img_bytes = Path(diagram.path).read_bytes()
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        prompt = EVAL_PROMPT.format(
            concept=diagram.spec.concept,
            elements=", ".join(diagram.spec.elements),
        )
        result = await gemini_vision(b64, prompt, model=GEMINI_FLASH_LITE)
        score = float(result.get("score", 0.0))
        issue = result.get("issue")
        return score, issue
    except Exception as e:
        return 0.0, str(e)


async def evaluate_and_refine(diagram: GeneratedDiagram, config: DiagramConfig) -> GeneratedDiagram:
    """Step 4: Evaluate quality; regenerate once if score < 0.6."""
    score, issue = await evaluate_diagram(diagram)
    diagram.quality_score = score

    if score >= 0.6 or not issue:
        return diagram

    # 1× refinement with issue hint
    print(f"  Refining {diagram.spec.id} (score={score:.2f}): {issue}")
    original_spec = diagram.spec
    refined_spec = DiagramSpec(
        id=f"{original_spec.id}-r",
        concept=original_spec.concept,
        diagram_type=original_spec.diagram_type,
        elements=original_spec.elements,
        relationships=original_spec.relationships + [f"IMPORTANT: {issue}"],
        method=original_spec.method,
    )
    try:
        refined = await generate_diagram(refined_spec, config)
        score2, _ = await evaluate_diagram(refined)
        if score2 > score:
            refined.quality_score = score2
            return refined
    except Exception as e:
        print(f"  Refinement failed for {diagram.spec.id}: {e}")

    return diagram


# ── Full diagram pipeline ─────────────────────────────────────────────────────

async def run_diagram_pipeline(
    section_mdx: str,
    config: DiagramConfig,
    concurrency: int = 3,
) -> list[GeneratedDiagram]:
    """Run the full Plan → Generate → Evaluate → Refine pipeline for one section."""
    if config.diagram_mode == "off":
        return []

    specs = await plan_diagrams(section_mdx, max_diagrams=config.max_per_section)
    if not specs:
        return []

    semaphore = asyncio.Semaphore(concurrency)

    async def _pipeline_one(spec: DiagramSpec) -> GeneratedDiagram:
        async with semaphore:
            diagram = await generate_diagram(spec, config)
            return await evaluate_and_refine(diagram, config)

    results = await asyncio.gather(*[_pipeline_one(s) for s in specs], return_exceptions=True)
    return [r for r in results if isinstance(r, GeneratedDiagram)]
