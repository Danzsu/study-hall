"""Adapter between study-hall questions.json shape and validator/dedup prompt shape."""
from __future__ import annotations

_LETTERS = "abcdefghijklmnopqrstuvwxyz"
_TYPE_TO_PROMPT = {
    "mcq": "multi_choice", "multi": "multi_choice", "written": "written",
    "true_false": "true_false", "fill_the_blanks": "fill_the_blanks",
    "drag_n_drop": "drag_n_drop", "simple_input": "simple_input",
    "formula_drag_drop": "formula_drag_drop", "calc_input": "calc_input",
}


def _idx_to_letter(i: int) -> str:
    return _LETTERS[i] if 0 <= i < len(_LETTERS) else str(i)


def _letter_to_idx(x: str) -> int:
    x = str(x).strip().lower()
    return _LETTERS.index(x) if len(x) == 1 and x in _LETTERS else -1


def to_prompt_shape(q: dict) -> dict:
    t = str(q.get("type", "mcq")).lower()
    out = {
        "ID": q.get("id", ""),
        "question_type": _TYPE_TO_PROMPT.get(t, "multi_choice"),
        "question_title": q.get("question", ""),
        "supervised": q.get("supervised", "generated"),
    }
    if t in ("mcq", "multi"):
        out["options"] = {_idx_to_letter(i): v for i, v in enumerate(q.get("options") or [])}
        out["answer"] = (
            [_idx_to_letter(int(q.get("correct", 0)))] if t == "mcq"
            else [_idx_to_letter(int(i)) for i in (q.get("correctMultiple") or [])]
        )
    elif t == "written":
        out["answer"] = q.get("idealAnswer", "") or q.get("model_answer", "")
    else:  # true_false / *_input / calc / drag / fill / formula — pass the answer field through
        out["answer"] = q.get("answer", q.get("blanks", q.get("choices", "")))
    return out


def build_new_question_refs(questions: list[dict]) -> list[dict]:
    return [
        {
            "id": q.get("id", ""),
            "question_title": q.get("question", ""),
            "question_type": _TYPE_TO_PROMPT.get(str(q.get("type", "mcq")).lower(), "multi_choice"),
        }
        for q in questions
    ]


def apply_validation(q: dict, validation: dict) -> dict:
    status = str(validation.get("status", "uncertain")).lower()
    q = dict(q)
    q["validation"] = validation
    q["supervised"] = status if status in ("confirmed", "corrected", "uncertain") else "generated"
    if status != "corrected":
        return q
    corrected = validation.get("corrected_answer")
    if corrected is None:
        return q
    t = str(q.get("type", "mcq")).lower()
    if t == "mcq":
        letters = corrected if isinstance(corrected, list) else [corrected]
        idx = _letter_to_idx(letters[0]) if letters else -1
        if idx >= 0:
            q["correct"] = idx
    elif t == "multi":
        idxs = [i for i in (_letter_to_idx(x) for x in (corrected if isinstance(corrected, list) else [corrected])) if i >= 0]
        if idxs:
            q["correctMultiple"] = idxs
    elif t == "written":
        if isinstance(corrected, str) and corrected.strip():
            q["idealAnswer"] = corrected
    else:  # true_false / *_input / calc etc. — replace the answer field verbatim
        q["answer"] = corrected
    return q
