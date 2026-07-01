# Study Hall — Mesterterv v3: Intelligens Jegyzetgeneráló Pipeline

> **v3 státusz**: ✅ IMPLEMENTÁLVA — minden fázis (F1–F7) kész  
> **Alapelv**: Egyszerűbb jobb. Csak amit valóban megér megcsinálni.

## Implementációs státusz

| Fázis | Mit szállít | Fájlok | Állapot |
| ----- | ----------- | ------ | ------- |
| **F1** | ExtractorFactory + formátum extractorok | `pipeline/extractors/` | ✅ Kész |
| **F2** | ImageEvaluator (Gemini vision scoring) | `pipeline/image_evaluator.py` | ✅ Kész |
| **F3** | Párhuzamos szekció generálás + template | `pipeline/section_pipeline.py` | ✅ Kész |
| **F4** | Többlépéses ábragenerálás (Plan→Gen→Eval→Refine) | `pipeline/diagram_pipeline.py` | ✅ Kész |
| **F5** | Job status JSON + Next.js polling endpoint | `pipeline/job_status.py` + `app/api/jobs/[jobId]/` | ✅ Kész |
| **F6** | Admin UI (config panel + progress nézet) | `src/screens/Admin/GenerationPanel.jsx` | ✅ Kész |
| **F7** | `generate-all.js --python` flag integráció | `scripts/generate-all.js` | ✅ Kész |

### Bemeneti formátumok — implementált extractorok

| Formátum | Extractor | Képkinyerés | Fájl |
| -------- | --------- | ----------- | ---- |
| `.pdf` | pymupdf4llm + fitz | ✅ fitz.get_images() | `pipeline/extractors/pdf.py` |
| `.docx` | mammoth | ✅ embedded images | `pipeline/extractors/docx.py` |
| `.pptx` / `.ppt` | python-pptx | ✅ Presentation.images + speaker notes | `pipeline/extractors/pptx.py` |
| `.txt` / `.md` | chardet + markdown-it-py | — | `pipeline/extractors/text.py` |
| `.png` / `.jpg` / `.jpeg` | közvetlen bemenet | ✅ maga a fájl | `pipeline/extractors/image.py` |

### Kulcskomponensek

| Komponens | Fájl | Szerepkör |
| --------- | ---- | --------- |
| `ExtractorFactory` | `pipeline/extractors/__init__.py` | Formátum detektálás + extrakció |
| `gemini_client` | `pipeline/gemini_client.py` | Google AI Studio async wrapper (text / json / vision) |
| `ImageEvaluator` | `pipeline/image_evaluator.py` | Gemini Flash Lite vision scoring (threshold: 0.55) |
| `generate_all_sections` | `pipeline/section_pipeline.py` | asyncio.gather, max 5 párhuzamos Gemini hívás |
| `DiagramPipeline` | `pipeline/diagram_pipeline.py` | 4-lépéses ábragenerálás: Plan→Generate→Evaluate→Refine |
| `excalidraw_design_system` | `pipeline/excalidraw_design_system.py` | Egységes vizuális stílus (refactoring.guru + bytebytego) |
| `update_status` | `pipeline/job_status.py` | JSON fájl alapú job tracking (`storage/jobs/{id}.json`) |
| `orchestrator.py` | `pipeline/orchestrator.py` | Belépési pont, koordinálja az összes réteget |

### LLM model routing (Google AI Studio, egyetlen `GOOGLE_AI_KEY`)

| Feladat | Model | Indok |
| ------- | ----- | ----- |
| Section MDX generálás | `gemini-2.5-flash` | Összetett tartalom, jobb minőség |
| Reflection / rubric validáció | `gemini-2.5-flash-lite` | Gyors, olcsó ellenőrzés |
| Image quality scoring | `gemini-2.5-flash-lite` | Vision, 1 kép = 1 API hívás |
| Diagram planning | `gemini-2.5-flash` | Fogalomfelismerés |
| Mermaid / Excalidraw generálás | `gemini-2.5-flash-lite` | Strukturált kimenet, olcsó |

---

---

## Mi a probléma most?

| Hiányosság | Hatás |
|-----------|-------|
| Csak PDF + DOCX bemenet | PPTX előadás, TXT/MD anyag, PNG ábra nem dolgozható fel |
| Képek kinyerődnek, de soha nem kerülnek LLM elé | Ábrák elvesznek, nincs felirat, nincs minőségdöntés |
| Ábrageneráló egy lépés, nincs finomítás | Gyenge minőségű diagramok, nincs visszacsatolás |
| Szekvenciális chunk generálás | Lassú (egymás utáni LLM hívások) |
| Nincs job status perzisztencia | Frissítéskor elvész a progress |
| Admin UI nincs | Nincs preview, nincs config a generálás előtt |

---

## Versenyképes kép (röviden)

- **NotebookLM**: legjobb multi-source beolvasás + Audio Overview — de nincs quiz/flashcard
- **Quizlet AI**: spaced repetition + kép bemenet — de nincs saját tartalom-struktúra
- **Nolej.io**: knowledge graph vizualizáció — de drága, zárt
- **Study Hall előnye**: ingyenes, self-hosted, magyar tartalom, MDX rendering, saját tantárgy

---

## Bemeneti formátumok

| Formátum | Extrakció | Képkinyerés |
|---------|-----------|-------------|
| `.pdf` | pymupdf4llm + fitz | ✅ fitz.get_images() |
| `.docx` | mammoth (meglévő) | ✅ mammoth embedded images |
| `.pptx` | python-pptx | ✅ Presentation.images |
| `.txt` | chardet + read | — |
| `.md` | markdown-it-py AST | — |
| `.png` / `.jpg` | — | ✅ közvetlen bemenet |

---

## Architektúra (LangGraph orchestrátor)

```
Input fájl(ok)
    ↓
[1. ExtractorNode]         format detection → ExtractedDocument
    ↓
[2. ImageEvalNode]         Gemini Flash Lite, párhuzamos kép scoring
    ↓
[3. DispatchNode]          LangGraph Send() → N párhuzamos SectionNode
    ├── SectionNode×N      template-first MDX, Pydantic + 1× reflection
    └── MergeNode          section_index szerinti rendezés → teljes MDX
    ↓
[4. DiagramNode]           Többlépéses ábragenerálás (lásd lentebb)
    ↓
[5. Extras]                Kérdések + flashcard + szójegyzék (meglévő Node.js)
    ↓
[6. Job status]            storage/jobs/{jobId}.json — polling az Admin UI-ból
```

### Google AI Studio — Model Routing Table

**Kizárólag Google AI Studio (Gemini) modelleket használunk.** Nincs Groq, nincs OpenRouter, nincs Claude a pipeline-ban.

| Feladat | Model | Indok |
| ------- | ----- | ----- |
| Image quality scoring | `gemini-2.5-flash-lite` | Gyors, olcsó vision; 1 kép = 1 API hívás |
| Section MDX generálás | `gemini-2.5-flash` | Komplexebb feladat, jobb minőség |
| Reflection / validáció | `gemini-2.5-flash-lite` | Rubric ellenőrzés, nem kell nagy model |
| Diagram planning | `gemini-2.5-flash` | Fogalmak azonosítása, típus döntés |
| Mermaid kód generálás | `gemini-2.5-flash-lite` | Szintaxis ismeret elegendő |
| Excalidraw JSON generálás | `gemini-2.5-flash-lite` | Strukturált JSON, olcsó és gyors |
| Diagram evaluate (vision) | `gemini-2.5-flash-lite` | Vision scoring, 1× per diagram |
| OCR (scanned PDF) | `gemini-2.5-flash` | Pontosabb szövegkinyerés képekből |

**API konfiguráció** (`GOOGLE_AI_KEY` env változó, egy kulcs mindenhol):
```python
import google.generativeai as genai
genai.configure(api_key=os.getenv("GOOGLE_AI_KEY"))
```

---

**Miért LangGraph?** A `Send()` API dinamikus fan-out-ot ad: N szekció = N párhuzamos worker, ahol N csak futásidőben derül ki. A beépített checkpointer (`SqliteSaver`) lehetővé teszi a folytatást hiba után. A gráf vizualizálható és tesztelhető egységenként.

### LangGraph State + Send API

```python
# pipeline/orchestrator.py
from langgraph.graph import StateGraph, START, END, Send
from typing import Annotated, TypedDict
import operator

class PipelineState(TypedDict):
    doc: ExtractedDocument
    config: GenConfig
    image_decisions: dict[str, ImageDecision]
    section_results: Annotated[list[SectionResult], operator.add]  # reducer: concat
    diagram_results: Annotated[list[DiagramResult], operator.add]
    final_mdx: str
    job_id: str

def dispatch_sections(state: PipelineState) -> list[Send]:
    """Fan-out: egy Send() per szekció — mind párhuzamosan indul"""
    return [
        Send("generate_section", {
            "section": s,
            "images": [img for img in state["doc"].images
                       if img.page in range(s.page_start, s.page_end + 1)
                       and state["image_decisions"].get(img.id, {}).get("action") == "include"],
            "config": state["config"],
            "section_index": s.index,
            "job_id": state["job_id"],
        })
        for s in state["doc"].sections
    ]

async def generate_section(state: dict) -> dict:
    section = state["section"]
    mdx = await fill_section_template(section, state["images"], state["config"])
    # 1× reflection ha quality < 70
    ok, issues = await validate_section(mdx, section.text)
    if not ok:
        mdx = await fill_section_template(section, state["images"], state["config"],
                                           feedback=issues)
    update_job_progress(state["job_id"])
    return {"section_results": [SectionResult(index=state["section_index"],
                                              title=section.title, mdx=mdx)]}

async def merge_sections(state: PipelineState) -> dict:
    sorted_sections = sorted(state["section_results"], key=lambda r: r.index)
    return {"final_mdx": "\n\n".join(r.mdx for r in sorted_sections)}

# Graph összerakás
builder = StateGraph(PipelineState)
builder.add_node("extract",          extract_node)
builder.add_node("eval_images",      eval_images_node)
builder.add_node("dispatch",         dispatch_sections)
builder.add_node("generate_section", generate_section)
builder.add_node("merge",            merge_sections)
builder.add_node("diagrams",         diagram_node)

builder.add_edge(START, "extract")
builder.add_edge("extract", "eval_images")
builder.add_edge("eval_images", "dispatch")
builder.add_conditional_edges("dispatch", lambda x: x)   # Returns list[Send]
builder.add_edge("generate_section", "merge")
builder.add_edge("merge", "diagrams")
builder.add_edge("diagrams", END)

from langgraph.checkpoint.sqlite import SqliteSaver
checkpointer = SqliteSaver.from_conn_string("storage/checkpoints.db")
graph = builder.compile(checkpointer=checkpointer)
```

---

## Réteg 1 — ExtractorFactory (`pipeline/extractors/`)

### Fájlstruktúra

```
pipeline/extractors/
  __init__.py       # ExtractorFactory class
  base.py           # ExtractedDocument, Section, ExtractedImage dataclassok
  pdf.py            # pymupdf4llm + fitz képkinyerés
  docx.py           # mammoth refaktorálva
  pptx.py           # python-pptx slide + images
  text.py           # TXT (chardet) + MD (markdown-it-py)
  image.py          # PNG/JPG közvetlen bemenet
```

### ExtractorFactory

```python
# pipeline/extractors/__init__.py
class ExtractorFactory:
    _EXT_MAP = {
        ".pdf": "pdf", ".docx": "docx", ".pptx": "pptx", ".ppt": "pptx",
        ".txt": "text", ".md": "text", ".png": "image", ".jpg": "image", ".jpeg": "image",
    }

    @staticmethod
    def detect(path: Path) -> str:
        ext = path.suffix.lower()
        if ext in ExtractorFactory._EXT_MAP:
            return ExtractorFactory._EXT_MAP[ext]
        # Magic bytes fallback: %PDF → pdf, PK\x03\x04 → pptx/docx
        with open(path, "rb") as f:
            header = f.read(8)
        if header.startswith(b"%PDF"): return "pdf"
        if header.startswith(b"PK\x03\x04"): return "pptx"  # ZIP = Office XML
        raise ValueError(f"Unsupported format: {path.name}")

    @staticmethod
    def extract(path: Path, images_dir: Path | None = None) -> ExtractedDocument:
        fmt = ExtractorFactory.detect(path)
        extractors = {"pdf": extract_pdf, "docx": extract_docx,
                      "pptx": extract_pptx, "text": extract_text, "image": extract_image}
        return extractors[fmt](path, images_dir)
```

### ExtractedDocument dataclass

```python
# pipeline/extractors/base.py
@dataclass
class Section:
    index: int
    title: str
    level: int          # 1=fejezet, 2=szakasz, 3=alszakasz
    text: str
    notes: str          # PPTX speaker notes, vagy ""
    page_start: int
    page_end: int

@dataclass
class ExtractedImage:
    id: str             # "img-p03-02"
    page: int
    fmt: str            # "png"|"jpg"
    b64: str            # base64 adat
    width: int
    height: int
    quality_score: float | None = None   # ImageEvaluator tölti ki
    caption: str | None = None

@dataclass
class ExtractedDocument:
    slug: str
    source_path: str
    fmt: str
    sections: list[Section]
    images: list[ExtractedImage]
    raw_text: str
    metadata: dict      # title, author, page_count
```

### PPTX szekció-logika

Csak két heurisztikával, egyszerűen:

```python
# pipeline/extractors/pptx.py
# Szekció-határ: az a dia, amelyiknek <= 2 szövegblokkja van ÉS az első < 80 karakter
# → ez valószínűleg cím-dia

def extract_pptx(path: Path, images_dir: Path | None) -> ExtractedDocument:
    prs = Presentation(str(path))
    sections, current = [], None

    for si, slide in enumerate(prs.slides):
        texts = [s.text.strip() for s in slide.shapes
                 if hasattr(s, "text") and s.text.strip()]
        notes = slide.notes_slide.notes_text_frame.text.strip() \
                if slide.has_notes_slide else ""
        is_title = len(texts) <= 2 and texts and len(texts[0]) < 80

        if is_title or current is None:
            if current: sections.append(current)
            current = {"title": texts[0] if texts else f"Slide {si+1}",
                       "slides": [], "notes_parts": []}

        current["slides"].append("\n".join(texts))
        if notes: current["notes_parts"].append(notes)

    if current: sections.append(current)

    result_sections = [Section(
        index=i, title=s["title"], level=1,
        text="\n\n".join(s["slides"]),
        notes="\n\n".join(s["notes_parts"]),
        page_start=0, page_end=0,
    ) for i, s in enumerate(sections)]
    ...
```

### Scanned PDF kezelés

Ha a kinyert szöveg < 200 karakter de vannak képek → `is_scanned=True` flag az `ExtractedDocument`-en. A SectionWorker ekkor a dia-képeket vision modellel dolgozza fel OCR-ként.

---

## Réteg 2 — ImageEvaluator (`pipeline/image_evaluator.py`)

Gyors heurisztika ELSŐ, LLM hívás csak ha érdemes:

```python
async def evaluate(img: ExtractedImage, client) -> ImageDecision:
    # Gyors reject (nem kell LLM)
    if img.width < 60 or img.height < 60:
        return ImageDecision(action="skip", reason="too_small")
    if img.width * img.height > 4_000_000:
        img = resize(img, max_side=1600)

    # Gemini Flash Lite vision scoring
    prompt = """Rate this image for study notes (JSON only):
{"score": 0.0-1.0, "caption": "one sentence or null"}
1.0 = clear diagram/chart/flowchart with educational value
0.5 = photo with labels or annotations
0.1 = decorative, logo, or unclear"""

    result = await client.vision(img.b64, prompt)
    if result["score"] >= 0.55:
        return ImageDecision(action="include", caption=result["caption"], score=result["score"])
    return ImageDecision(action="skip", reason="low_quality", score=result["score"])
```

Minden `include` döntésű kép bekerül az adott szekció `images` listájába → a SectionWorker `<StudyImage>` tagként illeszti be.

---

## Réteg 3 — Párhuzamos Section Generálás

Egyszerű asyncio, nem LangGraph:

```python
# pipeline/section_pipeline.py
import asyncio

async def generate_all_sections(doc: ExtractedDocument, config: GenConfig) -> list[SectionResult]:
    semaphore = asyncio.Semaphore(5)  # Max 5 párhuzamos Gemini API hívás

    async def worker(section: Section) -> SectionResult:
        async with semaphore:
            images = [img for img in doc.images
                      if img.page in range(section.page_start, section.page_end + 1)
                      and (img.quality_score or 0) >= 0.55]
            return await generate_section_mdx(section, images, config)

    results = await asyncio.gather(*[worker(s) for s in doc.sections])
    # Visszarendezés section.index szerint
    return sorted(results, key=lambda r: r.index)
```

### Template-First Generálás

Az LLM nem dönt a struktúráról — csak a megadott slotsokat tölti ki:

```
TEMPLATE (Pydantic modellel validálva):
  ## {section_title}
  ### Alapfogalmak
  {key_concepts}      ← bullet list, max 8 pont, kötelező
  ### Magyarázat
  {explanation}       ← 2-4 bekezdés, kötelező
  {images_block}      ← <StudyImage> tagek ha vannak képek
  ### Példák
  {examples}          ← konkrét esetek, kötelező ha van anyag
  {callout_block}     ← <Callout variant="note"> ha van fontos megjegyzés
  ### Összefoglalás
  {summary}           ← max 3 mondat, kötelező
```

### Pydantic Validáció (nem instructor — egyszerűbb)

```python
class SectionMDX(BaseModel):
    key_concepts: list[str] = Field(min_length=1, max_length=8)
    explanation: str = Field(min_length=50)
    examples: str = ""
    summary: str = Field(min_length=20, max_length=400)

# Ha parse hiba → 1 retry, ugyanazzal a prompttal + "Fix this JSON error: {err}"
# Max 1 retry (nem infinite loop)
```

---

## Réteg 4 — Többlépéses Ábragenerálás

### Jelenlegi flow (problémás)

```
Notes generálás → IMAGE_NEEDED: [concept] — [one-line description]
    ↓
generate-images.js → DALL-E/Flux prompt → kép → kész
```

**Probléma**: Az egy soros leírásból generált kép sokszor gyenge minőségű vagy pontatlan.

### Új flow (3 lépéses)

```
[Step 1: Plan]      LLM azonosítja a szükséges ábrákat a noteszből
                    Output: lista { concept, type, elements[], relationships[] }
    ↓
[Step 2: Spec]      Minden ábrához részletes specifikáció generálódik
                    Output: SVG spec VAGY DALL-E prompt (típustól függően)
    ↓
[Step 3: Generate]  Spec alapján generálás
                    • Folyamatábrák, logikai diagramok → SVG (LLM generálja, no API cost)
                    • Fotórealisztikus képek, komplex ábrák → DALL-E/Flux
    ↓
[Step 4: Evaluate]  Vision model ellenőrzi: stimmel az ábra a szöveggel?
                    Ha score < 0.6 → 1× regenerálás jobb prompttal
                    Ha score >= 0.6 → elfogadva, beillesztve a noteszbe
```

### Step 1: Diagram Plan

```python
# pipeline/diagram_pipeline.py
PLAN_PROMPT = """Identify diagrams needed in these study notes.
For each, specify:
- concept: what it illustrates
- type: "flowchart" | "concept_map" | "sequence" | "comparison" | "illustration"
- elements: list of key items to show
- relationships: how elements connect

Return JSON array. Max 3 diagrams per section.
Notes:
{notes_text}"""

async def plan_diagrams(section_mdx: str) -> list[DiagramSpec]:
    result = await llm.json(PLAN_PROMPT.format(notes_text=section_mdx[:3000]))
    return [DiagramSpec(**d) for d in result[:3]]
```

### Step 2: Mermaid/SVG generálás (Gemini Flash Lite — gyors és olcsó)

Az LLM először Mermaid kódot próbál generálni — ez szöveg alapú, LLM-baráti, ingyenesen renderelhető:

```python
MERMAID_PROMPT = """Generate a Mermaid diagram for this concept.
Concept: {concept}
Type mapping:
  flowchart → flowchart TD
  sequence  → sequenceDiagram
  concept_map → graph LR
  comparison → graph LR (two columns)
Elements: {elements}
Relationships: {relationships}

Rules:
- Use simple node names (no special chars except _)
- Max 10 nodes
- Return ONLY the Mermaid code, starting with the diagram type keyword"""

async def generate_mermaid(spec: DiagramSpec) -> str:
    """Gemini Flash Lite — gyors és olcsó, elegendő Mermaid szintaxishoz"""
    return await gemini_client.text(MERMAID_PROMPT.format(**spec.__dict__),
                                    model="gemini-2.5-flash-lite")
```

**Mermaid → kép renderelés** (szerver oldalon, Node.js `@mermaid-js/mermaid-js` CLI-vel):
```bash
mmdc -i diagram.mmd -o diagram.png -w 800 -H 600
```

### Step 3: Generate + Fallback logika

```python
async def generate_diagram(spec: DiagramSpec, config: GenConfig) -> GeneratedDiagram:
    if config.diagram_mode in ("mermaid_first", "svg_only"):
        # 1. Mermaid generálás (Gemini Flash Lite)
        mermaid_code = await generate_mermaid(spec)
        # 2. Renderelés PNG-be (mmdc subprocess)
        render_ok, img_path = await render_mermaid(mermaid_code, spec.id, config)
        if render_ok:
            return GeneratedDiagram(path=img_path, format="png",
                                     method="mermaid", spec=spec)
        # Renderelési hiba → fallback image gen

    # Fallback: Google AI Studio Imagen (ha GOOGLE_AI_KEY van)
    if config.diagram_mode != "svg_only" and os.getenv("GOOGLE_AI_KEY"):
        img_bytes = await google_imagen(spec)
        path = save_image(img_bytes, spec.id, config)
        return GeneratedDiagram(path=path, format="png",
                                 method="imagen", spec=spec)

    # Végső fallback: placeholder (ha nincs API key)
    return GeneratedDiagram(path=None, method="placeholder", spec=spec)
```

### Típus szerinti routing — 3 generálási módszer

```
MERMAID         EXCALIDRAW              GOOGLE IMAGEN
────────────    ───────────────────     ─────────────────────
flowchart       concept_map             illustration
sequence        comparison              anatomy
er_diagram      system_overview         chemistry
class_diagram   explanation_visual      circuit_schematic
gantt           architecture            photo_realistic
state_diagram   process_visual          geographic_map
```

```python
DIAGRAM_TYPE_ROUTING = {
    # Mermaid (technikai pontosság, szövegalapú)
    "flowchart":           "mermaid",
    "sequence":            "mermaid",
    "er_diagram":          "mermaid",
    "class_diagram":       "mermaid",
    "gantt":               "mermaid",
    "state_diagram":       "mermaid",
    # Excalidraw (vizuális, hand-drawn, refactoring.guru stílus)
    "concept_map":         "excalidraw",
    "comparison":          "excalidraw",
    "system_overview":     "excalidraw",
    "explanation_visual":  "excalidraw",
    "architecture":        "excalidraw",
    "process_visual":      "excalidraw",
    # Google Imagen (fotórealisztikus, fizikai)
    "illustration":        "imagen",
    "anatomy":             "imagen",
    "chemistry":           "imagen",
    "circuit_schematic":   "imagen",
    "photo_realistic":     "imagen",
    "geographic_map":      "imagen",
}
```

### Excalidraw pipeline (refactoring.guru-stílusú ábra)

**Miért Excalidraw?** Az Excalidraw MCP már elérhető (`mcp__claude_ai_Excalidraw__create_view`). Hand-drawn, pasztell stílusú — pontosan a refactoring.guru / bytebytego vizuális nyelv. Gemini Flash Lite natívan generálja a JSON-t.

**Saját Excalidraw Design System** — refactoring.guru + bytebytego stílusra optimalizálva. A design system egy dedikált fájlban él (`pipeline/excalidraw_design_system.py`) és template promptokat tartalmaz minden diagram típushoz. A stílusszabályok és minták a system promptba kerülnek → konzisztens, felismerhető vizuális nyelv minden generált ábránál. (Részletek: lásd "Réteg 4b" bekezdés lentebb.)

**Design System (a csatolt style guide alapján):**

```
SZÍNEK (szemantikus szerepkörök, konzisztensen alkalmazva):
  #a5d8ff  — User / Input / forrás elemek  (kék)
  #ffd8a8  — Process / feldolgozás          (sárga/amber)  
  #b2f2bb  — Output / eredmény / siker      (zöld)
  #ffc9c9  — Alert / hiba / figyelmeztetés  (piros)
  #d0bfff  — Config / beállítás / speciális (lila)
  #e3e3e3  — System / infrastruktúra        (szürke)

ZÓNA HÁTTÉR (opacity 35):
  #dbe4ff  — UI / frontend réteg
  #e5dbff  — Logic / agent / feldolgozás réteg  
  #d3f9d8  — Data / storage réteg

TIPOGRÁFIA:
  Titles:  fontSize 24-28, strokeColor #1e1e1e, bold
  Labels:  fontSize 18-20, strokeColor #1e1e1e
  Notes:   fontSize 14-16, strokeColor #757575

FLOW MINTA (Input → Process → Output):
  Input node:   backgroundColor #a5d8ff, rounded rectangle
  Process node: backgroundColor #ffd8a8, rounded rectangle  
  Output node:  backgroundColor #b2f2bb, rounded rectangle
  Arrows:       strokeColor #1e1e1e, endArrowhead "arrow"

IKONOK (Excalidraw primitívekből, hand-drawn stílusban):
  Person:   ellipse (fej) + rectangle (test) — #a5d8ff
  Robot:    rectangle (test) + ellipse (fej) + kis rectangle-ek (szemek)
  Document: rectangle + 3 vízszintes vonal (szövegsorok)
  Gear:     ellipse + körülötte kis téglalapok
  Laptop:   trapéz alakú rectangle + vízszintes vonal alján
```

**Szerver-oldali Excalidraw → PNG rendering** (Node.js, `@excalidraw/utils` + Puppeteer):
```js
// scripts/render-excalidraw.js
const puppeteer = require('puppeteer')

async function excalidrawToPng(elementsJson, outputPath) {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  await page.setViewport({ width: 1200, height: 900 })
  // Excalidraw statikus renderer HTML-be töltve
  await page.goto(`file://${__dirname}/excalidraw-renderer.html`)
  await page.evaluate((json) => window.renderExcalidraw(json), elementsJson)
  await page.screenshot({ path: outputPath, type: 'png', clip: { x:0,y:0,w:800,h:600 }})
  await browser.close()
}
```

**Excalidraw JSON generálás** — **Gemini Flash Lite** (`gemini-2.5-flash-lite`):

Gemini Flash Lite-ot használjuk, mert:
- Gyors és cost-hatékony Google AI Studio modell
- Ismeri a strukturált JSON formátumokat, elegendő Excalidraw JSON generáláshoz
- A style guide a system prompt részévé tehető → konzisztens kimenet
- Minden más pipeline lépéssel egységes API (GOOGLE_AI_KEY egy helyen konfigurálva)

```python
# A style guide a system promptba kerül egyszer, utána minden ábránál újra felhasználható
EXCALIDRAW_SYSTEM = """You generate Excalidraw JSON diagrams in the refactoring.guru visual style.

DESIGN SYSTEM (always follow):
- Input/User nodes:    backgroundColor "#a5d8ff" (blue)
- Process nodes:       backgroundColor "#ffd8a8" (amber)  
- Output/Result nodes: backgroundColor "#b2f2bb" (green)
- Alert/Warning nodes: backgroundColor "#ffc9c9" (red)
- Config/Special:      backgroundColor "#d0bfff" (purple)
- Zone backgrounds:    #dbe4ff / #e5dbff / #d3f9d8 at opacity 35

RULES:
- Always start with cameraUpdate {"type":"cameraUpdate","width":800,"height":600,"x":0,"y":0}
- Use labeled shapes: {"type":"rectangle","label":{"text":"Name","fontSize":18}}
- Rounded corners: "roundness":{"type":3} on all rectangles
- Draw order: zones → shapes → labels → arrows
- Max 12 nodes for readability
- Minimum fontSize 16
- Return ONLY valid JSON array"""

EXCALIDRAW_USER_PROMPT = """Create a refactoring.guru-style Excalidraw diagram.

Concept: {concept}
Type: {diagram_type}
Elements: {elements}
Relationships: {relationships}

Return ONLY the JSON array."""
```

**`config.diagram_mode` Admin panel opciók**:
| Mód | Leírás |
|-----|--------|
| `auto` | Típus szerint (fenti táblázat) — **default** |
| `excalidraw_only` | Minden Excalidraw (Mermaid és Imagen ki) |
| `mermaid_only` | Csak Mermaid, nincs vizuális ábra |
| `off` | Nem generál ábrákat |

### Réteg 4b — Egyedi Excalidraw Design System (`pipeline/excalidraw_design_system.py`)

**Cél**: Minden generált Excalidraw diagram azonos, felismerhető vizuális stílust kövessen — refactoring.guru hand-drawn pasztell és bytebytego tiszta architektúra-ábra stílus kombinációja.

#### Design System fájl struktúra

```
pipeline/
  excalidraw_design_system.py   # Teljes design system: színek, szabályok, template promptok
  excalidraw_templates/
    flowchart.py                # Folyamatábra template + példa
    concept_map.py              # Fogalomtérkép template + példa
    comparison.py               # Összehasonlítás (2 oszlop) template
    sequence.py                 # Szekvencia / lépéssoros template
    architecture.py             # Rendszerarchitektúra template
    process_visual.py           # Folyamat vizualizáció template
```

#### Színpaletta és szemantika (refactoring.guru + bytebytego)

```python
# pipeline/excalidraw_design_system.py

DESIGN_SYSTEM = {
    "colors": {
        # Szemantikus szerepkörök (refactoring.guru alapján)
        "input":      "#a5d8ff",   # kék    — User / Input / forrás
        "process":    "#ffd8a8",   # amber  — Feldolgozás / agent / lépés
        "output":     "#b2f2bb",   # zöld   — Eredmény / siker / output
        "alert":      "#ffc9c9",   # piros  — Hiba / figyelmeztetés / kockázat
        "config":     "#d0bfff",   # lila   — Konfiguráció / speciális eset
        "neutral":    "#e3e3e3",   # szürke — Infrastruktúra / rendszer elem
        "highlight":  "#fff3bf",   # sárga  — Kiemelés / fontos megjegyzés
    },
    "zone_backgrounds": {
        # Zóna háttér (opacity 35, bytebytego stílus)
        "frontend":   "#dbe4ff",   # kék zóna   — UI / frontend réteg
        "logic":      "#e5dbff",   # lila zóna  — Logic / agent / feldolgozás
        "data":       "#d3f9d8",   # zöld zóna  — Data / storage réteg
        "external":   "#fff3bf",   # sárga zóna — Külső rendszer / API
    },
    "typography": {
        "title":    {"fontSize": 26, "fontFamily": 1, "strokeColor": "#1e1e1e"},
        "label":    {"fontSize": 18, "fontFamily": 1, "strokeColor": "#1e1e1e"},
        "sublabel": {"fontSize": 14, "fontFamily": 1, "strokeColor": "#757575"},
        "note":     {"fontSize": 13, "fontFamily": 3, "strokeColor": "#495057"},  # monospace
    },
    "shapes": {
        "node":    {"roundness": {"type": 3}, "roughness": 1, "strokeWidth": 2},
        "zone":    {"roughness": 0, "strokeWidth": 1, "opacity": 35, "fillStyle": "solid"},
        "arrow":   {"strokeColor": "#1e1e1e", "endArrowhead": "arrow", "strokeWidth": 2},
        "dashed":  {"strokeColor": "#868e96", "strokeStyle": "dashed", "strokeWidth": 1},
    },
    "canvas": {"width": 800, "height": 600},
}
```

#### Template prompts (típusonként)

Minden diagram típushoz egy dedikált template prompt él. A system prompt egyszer bekerül, az user prompt csak a konkrét fogalmat és elemeket adja meg.

```python
FLOWCHART_SYSTEM = f"""You generate Excalidraw JSON in refactoring.guru + bytebytego style.

CANVAS: 800×600px. Start with: {{"type":"cameraUpdate","width":800,"height":600,"x":0,"y":0}}

COLOR RULES (strict — no deviation):
- Input/Start nodes:  backgroundColor "#a5d8ff", roundness type 3
- Process/Step nodes: backgroundColor "#ffd8a8", roundness type 3
- Output/End nodes:   backgroundColor "#b2f2bb", roundness type 3  
- Decision diamonds:  backgroundColor "#d0bfff", type "diamond"
- Error/Exception:    backgroundColor "#ffc9c9", roundness type 3
- All arrows:         strokeColor "#1e1e1e", endArrowhead "arrow"

LAYOUT:
- Top-to-bottom flow (TD) by default
- 80px vertical gap between nodes
- Node width 160-200px, height 50-60px
- Labels fontSize 18, strokeColor #1e1e1e

STYLE (hand-drawn, refactoring.guru):
- roughness: 1 on all shapes (slightly hand-drawn look)
- strokeWidth: 2 on nodes, 1.5 on arrows
- fontFamily: 1 (Virgil — hand-written)

Return ONLY a valid JSON array. No markdown, no explanation."""

CONCEPT_MAP_SYSTEM = f"""You generate Excalidraw concept maps in bytebytego architectural style.

CANVAS: 800×600px. Start with: {{"type":"cameraUpdate","width":800,"height":600,"x":0,"y":0}}

LAYOUT:
- Central concept: large node, center of canvas, backgroundColor "#a5d8ff", fontSize 22
- 1st level children: medium nodes around center, backgroundColor "#ffd8a8"
- 2nd level details: small nodes at edges, backgroundColor "#e3e3e3"
- Connections: labeled arrows showing relationships

ZONES (optional, bytebytego style):
- Group related concepts in zone rectangles (opacity 35)
- Zone colors: #dbe4ff / #e5dbff / #d3f9d8

STYLE:
- roughness: 1, fontFamily: 1 (Virgil)
- strokeWidth: 2 on nodes, 1.5 on arrows

Return ONLY a valid JSON array."""

COMPARISON_SYSTEM = f"""You generate Excalidraw comparison diagrams (two-column layout).

CANVAS: 800×600px. Left half: Option A. Right half: Option B.

STRUCTURE:
- Header row: two large title nodes side by side
  Left title: backgroundColor "#a5d8ff" (blue)
  Right title: backgroundColor "#b2f2bb" (green)
- Feature rows: alternating white/light-gray background
- Checkmark nodes (✓): backgroundColor "#b2f2bb"
- Cross nodes (✗):     backgroundColor "#ffc9c9"
- Neutral nodes (~):   backgroundColor "#e3e3e3"
- Vertical divider: dashed line center, strokeColor "#868e96"

STYLE: roughness 0 (clean, bytebytego style), fontFamily 1, strokeWidth 1.5

Return ONLY a valid JSON array."""
```

#### Minta output / referencia képek

A `pipeline/excalidraw_templates/examples/` könyvtárban referencia JSON-ok élnek minden típushoz. Ezeket:
1. Generáláskor példaként adjuk a modellnek (few-shot)
2. Admin UI preview-ban megmutatjuk mit várhatunk

```python
async def generate_excalidraw(spec: DiagramSpec, config: GenConfig) -> str:
    system = DIAGRAM_SYSTEM_PROMPTS[spec.diagram_type]
    few_shot = load_example(spec.diagram_type)  # JSON string példa

    prompt = f"""Create a {spec.diagram_type} diagram.

Concept: {spec.concept}
Elements: {spec.elements}
Relationships: {spec.relationships}

Reference example (adapt, don't copy):
{few_shot[:1500]}

Return ONLY the JSON array for this specific concept."""

    result = await gemini_client.text(prompt, system=system,
                                      model="gemini-2.5-flash-lite")
    return result  # JSON string
```

---

### Step 4: Evaluate + Refine

```python
EVAL_PROMPT = """Does this diagram accurately represent the concept?
Concept: {concept}
Expected elements: {elements}

Rate: {"score": 0.0-1.0, "issue": "what's wrong or null if ok"}
1.0 = all elements present, relationships clear
0.5 = most elements present but some missing
0.0 = wrong or misleading"""

async def evaluate_and_refine(diagram: GeneratedDiagram, spec: DiagramSpec, client) -> GeneratedDiagram:
    result = await client.vision(diagram.as_b64(), EVAL_PROMPT.format(
        concept=spec.concept, elements=spec.elements))

    if result["score"] >= 0.6:
        diagram.quality_score = result["score"]
        return diagram  # Elfogadva

    # 1× regenerálás javított prompttal
    if spec.method == "svg":
        spec.svg_code = await llm.text(
            SVG_SPEC_PROMPT.format(**spec.__dict__) +
            f"\n\nPrevious attempt was incorrect: {result['issue']}. Fix it.")
        return await generate_diagram(spec, config)
    else:
        spec.dalle_prompt += f" Important: include {result['issue']}."
        return await generate_diagram(spec, config)
```

**Cost**: 1-2 extra LLM hívás per ábra, csak hibás esetben. Átlagosan ~0.3 extra hívás/ábra.

---

## Réteg 5 — Job Status (`storage/jobs/{jobId}.json`)

Egyszerű JSON fájl — nincs SQLite, nincs Redis, csak fájl:

```python
# pipeline/job_status.py
STATUS_SCHEMA = {
    "job_id": str,
    "status": "pending|running|done|failed",
    "subject": str,
    "source_file": str,
    "created_at": "ISO8601",
    "started_at": "ISO8601|null",
    "completed_at": "ISO8601|null",
    "current_step": "extracting|evaluating_images|generating_sections|generating_diagrams|extras|done",
    "sections_done": int,
    "sections_total": int,
    "overall_pct": int,     # 0-100
    "warnings": ["string"],
    "error": "string|null",
    "output_dir": "string|null",
}

def update_status(job_id: str, **kwargs):
    path = Path(f"storage/jobs/{job_id}.json")
    status = json.loads(path.read_text()) if path.exists() else {"job_id": job_id}
    status.update(kwargs)
    path.write_text(json.dumps(status, ensure_ascii=False, indent=2))
```

### Next.js polling endpoint

```js
// app/api/jobs/[jobId]/route.js
export async function GET(req, { params }) {
  const p = path.join(process.cwd(), 'storage', 'jobs', `${params.jobId}.json`)
  if (!fs.existsSync(p)) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(JSON.parse(fs.readFileSync(p, 'utf-8')))
}
```

Frontend: poll 2s-onként, amíg `status !== 'done' && status !== 'failed'`.

---

## Réteg 6 — Admin UI (`src/screens/Admin/GenerationPanel.jsx`)

### Config panel (generálás előtt)

| Beállítás | Opciók | Default |
|-----------|--------|---------|
| Nyelv | Magyar / Angol | Auto |
| Mélység | Áttekintő / Vizsga-prep / Részletes | Vizsga-prep |
| Képek beillesztése | Be / Ki | Be |
| Ábragenerálás | Be / Ki / Csak SVG | Be |

### Progress nézet

```jsx
// Skeleton + élő progress csíkok szekciónként
{job.sections.map((s, i) => (
  <SectionRow key={i} title={s.title}
    status={i < job.sections_done ? 'done' : i === job.sections_done ? 'running' : 'pending'} />
))}
<ProgressBar value={job.overall_pct} />
<Button disabled={job.status !== 'done'} onClick={saveToContent}>
  Publikálás
</Button>
```

---

## Reflection Agent (egyszerű, 1 körös)

Nem komplex REFLEXION architektúra — csak egy rubric ellenőrzés és 1× retry:

```python
RUBRIC = """Score this MDX section (0-100):
- 40pts: All required fields present (key_concepts, explanation, summary)
- 30pts: Factually accurate to source material
- 30pts: Clear, student-friendly language

Return JSON: {"score": 0-100, "issues": ["issue1"]}"""

async def validate_section(mdx: str, source: str) -> tuple[bool, list[str]]:
    # Gemini Flash Lite — gyors rubric ellenőrzés, nem kell nagy model
    result = await gemini_client.json(RUBRIC + f"\n\nSource:\n{source[:1000]}\n\nMDX:\n{mdx[:2000]}",
                                      model="gemini-2.5-flash-lite")
    return result["score"] >= 70, result.get("issues", [])

# SectionWorker-ben: ha score < 70 → 1× újragenerálás az issues alapján
# Ha 2. próbálkozás is < 70 → elfogadjuk és warning-ba kerül
```

---

## Új Python fájlok (teljes lista)

```
pipeline/
  gemini_client.py                       # Google AI Studio client (szöveg + vision + JSON)
  extractors/__init__.py                 # ExtractorFactory
  extractors/base.py                     # Dataclassok: Section, ExtractedImage, ExtractedDocument
  extractors/pdf.py                      # pymupdf4llm + fitz
  extractors/docx.py                     # mammoth refaktorálva
  extractors/pptx.py                     # python-pptx
  extractors/text.py                     # TXT (chardet) + MD (markdown-it-py)
  extractors/image.py                    # PNG/JPG közvetlen bemenet
  image_evaluator.py                     # Gemini Flash Lite vision scoring
  section_pipeline.py                    # asyncio.gather alapú párhuzamos generálás
  diagram_pipeline.py                    # 4-lépéses ábragenerálás
  excalidraw_design_system.py            # Design system konstansok + system promptok
  excalidraw_templates/flowchart.py      # Típusonkénti template prompt
  excalidraw_templates/concept_map.py
  excalidraw_templates/comparison.py
  excalidraw_templates/sequence.py
  excalidraw_templates/architecture.py
  excalidraw_templates/examples/         # Referencia JSON-ok (few-shot)
  orchestrator.py                        # LangGraph pipeline
  job_status.py                          # JSON fájl alapú job tracking
```

```python
# pipeline/gemini_client.py — async wrapper a Google AI Studio API-ra (google-genai SDK)
from google import genai
from google.genai import types
from pipeline.config import GOOGLE_AI_KEY, GEMINI_FLASH, GEMINI_FLASH_LITE
import json, re, base64

_client = None
def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=GOOGLE_AI_KEY)
    return _client

async def text(prompt: str, system: str = "", model: str = GEMINI_FLASH) -> str:
    config = types.GenerateContentConfig(system_instruction=system or None)
    r = await _get_client().aio.models.generate_content(model=model, contents=prompt, config=config)
    return r.text.strip()

async def json_call(prompt: str, system: str = "", model: str = GEMINI_FLASH_LITE) -> dict | list:
    raw = await text(prompt, system, model)
    try: return json.loads(raw)
    except:
        raw = re.sub(r'^```(?:json)?\s*', '', raw.strip(), flags=re.MULTILINE)
        raw = re.sub(r'\s*```$', '', raw.strip(), flags=re.MULTILINE)
        match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', raw)
        return json.loads(match.group(1)) if match else {}

async def vision(b64: str, prompt: str, mime_type: str = "image/png", model: str = GEMINI_FLASH_LITE) -> dict | list:
    contents = [types.Part.from_bytes(data=base64.b64decode(b64), mime_type=mime_type), prompt]
    r = await _get_client().aio.models.generate_content(model=model, contents=contents)
    return await json_call.__wrapped__(r.text.strip())
```

---

## Párhuzamos pipeline integrálása a meglévő rendszerbe

Az új Python pipeline **párhuzamosan él** a meglévő Node.js-sel:

```
generate-all.js (meglévő)              pipeline/orchestrator.py (új)
    ↓                                      ↓
PDF/DOCX → chunk → Node LLM calls     PDF/DOCX/PPTX/TXT/MD/PNG →
    ↓                                  ExtractorFactory → sections →
content/{slug}/notes/*.mdx             asyncio.gather → MDX →
                                       DiagramPipeline → content/{slug}/
```

A `generate-all.js` egy új `--python` flaggel indítható Python-os úton:
```bash
node scripts/generate-all.js it_biztonsag --python  # → Python pipeline
node scripts/generate-all.js it_biztonsag           # → meglévő Node.js pipeline (default)
```

---

## Megvalósítási fázisok

| Fázis | Mit szállítunk | Érintett fájlok | Becsült idő |
|-------|---------------|-----------------|-------------|
| **F1** | ExtractorFactory + minden formátum extractor | `pipeline/extractors/` | 1-2 nap |
| **F2** | ImageEvaluator (Gemini) | `pipeline/image_evaluator.py` | 0.5 nap |
| **F3** | Párhuzamos section generálás + template | `pipeline/section_pipeline.py` | 1-2 nap |
| **F4** | Többlépéses ábragenerálás (Plan→Spec→Gen→Eval) | `pipeline/diagram_pipeline.py` | 1-2 nap |
| **F5** | Job status JSON + Next.js polling endpoint | `pipeline/job_status.py` + `app/api/jobs/` | 0.5 nap |
| **F6** | Admin UI (config panel + progress nézet) | `src/screens/Admin/` | 1 nap |
| **F7** | generate-all.js --python flag integráció | `scripts/generate-all.js` | 0.5 nap |

**Összesen: ~7-10 nap** — de F1+F2 önmagában is értékes és leszállítható.

---

## Amit most NEM csinálunk (egyszerűség elvén)

| Ötlet | Miért nem most |
|-------|----------------|
| LangGraph orchestrator | asyncio.gather elegendő ezen a skálán |
| Chroma snippet store | Nincs elég adat a reuse-hoz egyelőre |
| Knowledge graph vizualizáció | Értékes, de F1-F4 előbb kell |
| Incremental regeneration (hash-based) | Ritka use case, később könnyen hozzáadható |
| In-graph RAG retrieval | Cross-subject reference ritka, nem sürgős |
| Redis/BullMQ job queue | JSON fájl elegendő 1 admin usernek |

---

## Ellenőrzési lépések

1. `python -m pipeline.extractors test.pptx` → ExtractedDocument JSON log
2. `python -m pipeline.image_evaluator test.png` → `{"action":"include","score":0.82,...}`
3. `python -m pipeline.orchestrator it_biztonsag` → párhuzamos log, 3 section egyszerre
4. `python -m pipeline.diagram_pipeline it_biztonsag` → SVG fájlok + quality scores
5. `npm run dev` → Admin UI → config panel → generálás → progress bars → preview
6. `npm run test:unit` → zöld
