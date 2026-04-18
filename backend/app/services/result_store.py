import json
import os
from pathlib import Path
from typing import Any

from app.config.settings import settings

RESULTS_DIR = Path(settings.UPLOAD_DIR) / "results"


def _result_path(file_id: str) -> Path:
    safe_file_id = file_id.replace("/", "_").replace("\\", "_")
    return RESULTS_DIR / f"{safe_file_id}.json"


def save_result(file_id: str, payload: dict[str, Any]) -> None:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = _result_path(file_id)
    with open(out_path, "w", encoding="utf-8") as fp:
        json.dump(payload, fp, ensure_ascii=False, indent=2)


def get_result(file_id: str) -> dict[str, Any] | None:
    in_path = _result_path(file_id)
    if not in_path.exists():
        return None

    with open(in_path, "r", encoding="utf-8") as fp:
        return json.load(fp)
