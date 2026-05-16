"""Excalidraw design system — refactoring.guru + bytebytego visual style."""
from __future__ import annotations

COLORS = {
    "input":     "#a5d8ff",   # blue    — User / Input / source
    "process":   "#ffd8a8",   # amber   — Processing / agent / step
    "output":    "#b2f2bb",   # green   — Result / success / output
    "alert":     "#ffc9c9",   # red     — Error / warning / risk
    "config":    "#d0bfff",   # purple  — Config / special case
    "neutral":   "#e3e3e3",   # gray    — Infrastructure / system
    "highlight": "#fff3bf",   # yellow  — Important note / callout
}

ZONE_BACKGROUNDS = {
    "frontend": "#dbe4ff",    # blue zone   — UI / frontend layer
    "logic":    "#e5dbff",    # purple zone — Logic / agent / processing
    "data":     "#d3f9d8",    # green zone  — Data / storage layer
    "external": "#fff3bf",    # yellow zone — External system / API
}

_CANVAS_INIT = '{"type":"cameraUpdate","width":800,"height":600,"x":0,"y":0}'

_BASE_RULES = f"""CANVAS: 800x600px. First element must be: {_CANVAS_INIT}

COLOR SEMANTICS (always follow):
- Input/Start:   backgroundColor "{COLORS['input']}"
- Process/Step:  backgroundColor "{COLORS['process']}"
- Output/End:    backgroundColor "{COLORS['output']}"
- Alert/Error:   backgroundColor "{COLORS['alert']}"
- Config:        backgroundColor "{COLORS['config']}"
- Neutral:       backgroundColor "{COLORS['neutral']}"

SHAPES:
- All rectangles: "roundness": {{"type": 3}}
- roughness: 1 (hand-drawn feel)
- strokeWidth: 2 on shapes, 1.5 on arrows
- fontFamily: 1 (Virgil)

ARROWS: strokeColor "#1e1e1e", endArrowhead "arrow"
LABELS: fontSize 18 minimum, strokeColor "#1e1e1e"
ZONES (optional): type "rectangle", fillStyle "solid", opacity 35

Return ONLY a valid JSON array. No markdown fences, no explanation."""

FLOWCHART_SYSTEM = f"""You generate Excalidraw JSON flowcharts in refactoring.guru style.

{_BASE_RULES}

LAYOUT:
- Top-to-bottom (TD) default
- 80px vertical gap between nodes
- Node width 160-200px, height 50-60px
- Decision nodes: type "diamond", backgroundColor "{COLORS['config']}"
- Error paths: backgroundColor "{COLORS['alert']}"
- Max 10 nodes for readability"""

CONCEPT_MAP_SYSTEM = f"""You generate Excalidraw concept maps in bytebytego architectural style.

{_BASE_RULES}

LAYOUT:
- Central concept: large node center, backgroundColor "{COLORS['input']}", fontSize 22
- 1st level children: medium nodes around center, backgroundColor "{COLORS['process']}"
- 2nd level: small nodes at edges, backgroundColor "{COLORS['neutral']}"
- Labeled arrows showing relationships

ZONES (bytebytego style):
- Group related concepts in zone rectangles (opacity 35)
- Zone colors: {ZONE_BACKGROUNDS['frontend']} / {ZONE_BACKGROUNDS['logic']} / {ZONE_BACKGROUNDS['data']}"""

COMPARISON_SYSTEM = f"""You generate Excalidraw comparison tables (two-column layout).

{_BASE_RULES}

LAYOUT: Left half = Option A, Right half = Option B
- Header: two title nodes side by side
  Left: backgroundColor "{COLORS['input']}" (blue)
  Right: backgroundColor "{COLORS['output']}" (green)
- Feature rows: ✓ = "{COLORS['output']}", ✗ = "{COLORS['alert']}", ~ = "{COLORS['neutral']}"
- Vertical divider: dashed line, strokeColor "#868e96"
- roughness: 0 (clean bytebytego look)"""

SEQUENCE_SYSTEM = f"""You generate Excalidraw sequence/step diagrams.

{_BASE_RULES}

LAYOUT:
- Left column: actors/participants (rectangles, backgroundColor "{COLORS['input']}")
- Timeline: horizontal arrows between actors
- Steps numbered, labeled clearly
- Async operations: dashed arrows"""

ARCHITECTURE_SYSTEM = f"""You generate Excalidraw system architecture diagrams in bytebytego style.

{_BASE_RULES}

LAYOUT:
- Use zone rectangles to group layers (opacity 35)
  Frontend zone: backgroundColor "{ZONE_BACKGROUNDS['frontend']}"
  Logic/API zone: backgroundColor "{ZONE_BACKGROUNDS['logic']}"
  Data zone:      backgroundColor "{ZONE_BACKGROUNDS['data']}"
  External zone:  backgroundColor "{ZONE_BACKGROUNDS['external']}"
- roughness: 0 (clean, professional)
- Max 12 nodes"""

PROCESS_VISUAL_SYSTEM = f"""You generate Excalidraw process visualizations.

{_BASE_RULES}

LAYOUT:
- Left-to-right flow default
- Each step: labeled rectangle with color showing role
- Swimlanes optional: use zone rectangles for different actors
- Annotations: small text nodes beside main flow"""

DIAGRAM_SYSTEM_PROMPTS: dict[str, str] = {
    "flowchart":          FLOWCHART_SYSTEM,
    "concept_map":        CONCEPT_MAP_SYSTEM,
    "comparison":         COMPARISON_SYSTEM,
    "sequence":           SEQUENCE_SYSTEM,
    "architecture":       ARCHITECTURE_SYSTEM,
    "process_visual":     PROCESS_VISUAL_SYSTEM,
    "system_overview":    ARCHITECTURE_SYSTEM,
    "explanation_visual": CONCEPT_MAP_SYSTEM,
}

EXCALIDRAW_USER_TEMPLATE = """Create a {diagram_type} diagram.

Concept: {concept}
Elements: {elements}
Relationships: {relationships}

Return ONLY the JSON array."""


def build_user_prompt(concept: str, diagram_type: str, elements: list[str], relationships: list[str]) -> str:
    return EXCALIDRAW_USER_TEMPLATE.format(
        diagram_type=diagram_type,
        concept=concept,
        elements=", ".join(elements),
        relationships=", ".join(relationships),
    )
