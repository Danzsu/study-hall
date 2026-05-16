"""Main orchestrator entry point — called by generate-all.js --python."""
import asyncio
import argparse
import sys
import uuid
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from pipeline.extractors import ExtractorFactory
from pipeline.image_evaluator import evaluate_batch
from pipeline.section_pipeline import GenConfig, generate_all_sections, assemble_full_mdx
from pipeline.job_status import create_job, set_running, set_step, set_done, set_failed, add_warning


def parse_args():
    p = argparse.ArgumentParser(description="Study Hall Python pipeline")
    p.add_argument("--subject", required=True, help="Subject slug, e.g. it_biztonsag")
    p.add_argument("--name", default="", help="Subject display name")
    p.add_argument("--input", required=True, help="Path to source file")
    p.add_argument("--job-id", default=None, help="Job ID for status tracking")
    p.add_argument("--depth", default="exam", choices=["overview", "exam", "detailed"])
    p.add_argument("--diagram-mode", default="auto",
                   choices=["auto", "mermaid_only", "excalidraw_only", "off"])
    p.add_argument("--language", default="hu", choices=["hu", "en"])
    p.add_argument("--no-images", action="store_true", help="Skip image inclusion")
    return p.parse_args()


async def run(args):
    job_id = args.job_id or str(uuid.uuid4())[:8]
    source_path = Path(args.input)

    if not source_path.exists():
        print(f"ERROR: File not found: {source_path}", file=sys.stderr)
        sys.exit(1)

    create_job(job_id, args.subject, str(source_path))
    print(f"Job {job_id} started: {args.subject} <- {source_path.name}")

    try:
        # Step 1: Extract
        set_step(job_id, "extracting")
        print("  Extracting document...")
        doc = ExtractorFactory.extract(source_path)
        print(f"  Extracted {len(doc.sections)} sections, {len(doc.images)} images")

        # Step 2: Evaluate images
        set_step(job_id, "evaluating_images")
        image_decisions: dict[str, str] = {}
        if doc.images and not args.no_images:
            print(f"  Evaluating {len(doc.images)} images...")
            decisions = await evaluate_batch(doc.images)
            image_decisions = {img_id: d.action for img_id, d in decisions.items()}
            included = sum(1 for v in image_decisions.values() if v == "include")
            print(f"  Images: {included}/{len(doc.images)} included")

        # Step 3: Generate sections
        set_running(job_id, sections_total=len(doc.sections))
        set_step(job_id, "generating_sections")
        print(f"  Generating {len(doc.sections)} sections (parallel)...")

        config = GenConfig(
            subject_name=args.name or args.subject,
            language=args.language,
            depth=args.depth,
            include_images=not args.no_images,
        )
        results = await generate_all_sections(doc, config, image_decisions, job_id)

        for r in results:
            if r.warning:
                add_warning(job_id, f"{r.title}: {r.warning}")

        # Step 4: Assemble and save MDX
        full_mdx = assemble_full_mdx(results)
        output_dir = Path("content") / args.subject / "notes"
        output_dir.mkdir(parents=True, exist_ok=True)
        out_file = output_dir / "generated.mdx"
        out_file.write_text(full_mdx, encoding="utf-8")
        print(f"  Saved: {out_file}")

        set_done(job_id, str(output_dir))
        print(f"Job {job_id} done.")
        return job_id

    except Exception as e:
        set_failed(job_id, str(e))
        print(f"ERROR: {e}", file=sys.stderr)
        raise


def main():
    args = parse_args()
    asyncio.run(run(args))


if __name__ == "__main__":
    main()
