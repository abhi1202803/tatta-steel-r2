"""Project path helpers – keep imports working across backend, models, and scripts."""

from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_ROOT = PROJECT_ROOT / "backend"
DATA_ROOT = PROJECT_ROOT / "data"
DATASETS_ROOT = DATA_ROOT / "datasets"
ARTIFACTS_ROOT = BACKEND_ROOT / "artifacts"


def setup_python_path() -> tuple[Path, Path]:
    """Add project root and backend to sys.path (idempotent)."""
    for path in (PROJECT_ROOT, BACKEND_ROOT):
        entry = str(path)
        if entry not in sys.path:
            sys.path.insert(0, entry)
    return PROJECT_ROOT, BACKEND_ROOT