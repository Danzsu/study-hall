"""Job status tracking via JSON files in storage/jobs/."""
from __future__ import annotations
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

JOBS_DIR = Path(__file__).parent.parent / "storage" / "jobs"

JobStatus = Literal["pending", "running", "done", "failed"]
JobStep = Literal["extracting", "evaluating_images", "generating_sections", "generating_diagrams", "extras", "done"]


def _jobs_dir() -> Path:
    JOBS_DIR.mkdir(parents=True, exist_ok=True)
    return JOBS_DIR


def create_job(job_id: str, subject: str, source_file: str) -> dict:
    """Create a new job status entry."""
    status = {
        "job_id": job_id,
        "status": "pending",
        "subject": subject,
        "source_file": source_file,
        "created_at": _now(),
        "started_at": None,
        "completed_at": None,
        "current_step": "extracting",
        "sections_done": 0,
        "sections_total": 0,
        "overall_pct": 0,
        "warnings": [],
        "error": None,
        "output_dir": None,
    }
    _write(job_id, status)
    return status


def update_job(job_id: str, **kwargs) -> dict:
    """Update one or more fields in a job status."""
    status = read_job(job_id) or {"job_id": job_id}
    status.update(kwargs)
    _write(job_id, status)
    return status


def read_job(job_id: str) -> dict | None:
    path = _jobs_dir() / f"{job_id}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def set_running(job_id: str, sections_total: int) -> dict:
    return update_job(job_id, status="running", started_at=_now(),
                      sections_total=sections_total, overall_pct=5)


def advance_section(job_id: str) -> dict:
    """Increment sections_done and recalculate overall_pct."""
    status = read_job(job_id) or {}
    done = status.get("sections_done", 0) + 1
    total = status.get("sections_total", 1)
    pct = min(90, int(10 + (done / total) * 70))
    return update_job(job_id, sections_done=done, overall_pct=pct,
                      current_step="generating_sections")


def set_step(job_id: str, step: JobStep) -> dict:
    pct_map: dict[JobStep, int] = {
        "extracting": 5,
        "evaluating_images": 10,
        "generating_sections": 20,
        "generating_diagrams": 85,
        "extras": 92,
        "done": 100,
    }
    return update_job(job_id, current_step=step, overall_pct=pct_map.get(step, 50))


def set_done(job_id: str, output_dir: str) -> dict:
    return update_job(job_id, status="done", current_step="done",
                      overall_pct=100, completed_at=_now(), output_dir=output_dir)


def set_failed(job_id: str, error: str) -> dict:
    return update_job(job_id, status="failed", error=error, completed_at=_now())


def add_warning(job_id: str, warning: str) -> dict:
    status = read_job(job_id) or {}
    warnings = status.get("warnings", [])
    warnings.append(warning)
    return update_job(job_id, warnings=warnings)


def _write(job_id: str, status: dict) -> None:
    path = _jobs_dir() / f"{job_id}.json"
    path.write_text(json.dumps(status, ensure_ascii=False, indent=2), encoding="utf-8")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
