"""Synthetic training data – industry-grade pipeline facade."""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from scripts.industrial_dataset import (
    ALL_MODELS,
    FAILURE_TYPES,
    RISK_LEVELS,
    SENSOR_FEATURES,
    IndustrialDataPipeline,
)

# Re-export for backward compatibility
__all__ = [
    "ALL_MODELS",
    "FAILURE_TYPES",
    "RISK_LEVELS",
    "SENSOR_FEATURES",
    "generate_training_data",
    "load_dataset",
    "persist_all_datasets",
    "export_shared_industrial_data",
    "get_pipeline",
]

_pipeline: IndustrialDataPipeline | None = None


def get_pipeline(data_root: Path | None = None, force_regenerate: bool = False) -> IndustrialDataPipeline:
    global _pipeline
    if _pipeline is None or force_regenerate or (data_root and _pipeline.data_root != data_root):
        root = data_root or Path("data")
        _pipeline = IndustrialDataPipeline(data_root=root)
        _pipeline.generate(force=force_regenerate)
    elif not _pipeline._generated:
        _pipeline.generate()
    return _pipeline


def generate_training_data(model_name: str, data_root: Path | None = None) -> dict:
    """Return train-split arrays for a model (backward compatible API)."""
    if model_name not in ALL_MODELS:
        raise ValueError(f"Unknown model: {model_name}. Expected one of {ALL_MODELS}")
    pipeline = get_pipeline(data_root)
    return pipeline.get_model_data(model_name, split="train")


def load_dataset(model_name: str, data_dir: Path, split: str = "train") -> dict:
    """Load persisted split for a model."""
    path = data_dir / model_name / f"{split}.npz"
    if not path.exists():
        path = data_dir / model_name / "dataset.npz"
    if not path.exists():
        raise FileNotFoundError(f"No dataset for {model_name} at {data_dir}")

    archive = np.load(path, allow_pickle=True)
    has_y = bool(archive["has_y"])
    y = archive["y"] if has_y else None
    if y is not None and len(y) == 0:
        y = None
    result: dict = {"X": archive["X"], "y": y}
    if "rewards" in archive:
        result["rewards"] = archive["rewards"]
    return result


def persist_all_datasets(output_dir: Path, force: bool = True) -> dict[str, Path]:
    """Generate master industrial data and all model-specific train/val/test splits."""
    data_root = output_dir.parent if output_dir.name == "datasets" else output_dir
    pipeline = IndustrialDataPipeline(data_root=data_root)
    pipeline.generate(force=force)

    saved = {}
    for model_name in ALL_MODELS:
        saved[model_name] = data_root / "datasets" / model_name
        meta_path = saved[model_name] / "metadata.json"
        if meta_path.exists():
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            train_shape = meta.get("train", {}).get("X_shape", "?")
            print(f"  saved {model_name}: train X{train_shape}")

    stats_path = data_root / "master" / "statistics.json"
    if stats_path.exists():
        stats = json.loads(stats_path.read_text(encoding="utf-8"))
        print(f"\n  Master dataset: {stats['total_records']:,} records, {stats['equipment_count']} assets")
        print(f"  Failure distribution: {stats['failure_distribution']}")
        print(f"  Mean RUL: {stats['rul_stats']['mean']:.0f} hours")

    return saved


def export_shared_industrial_data(data_root: Path) -> None:
    """Export sensor, maintenance, and spare CSVs from the master dataset."""
    master_path = data_root / "master" / "industrial_master.csv"
    if not master_path.exists():
        get_pipeline(data_root)
    master = pd.read_csv(master_path, parse_dates=["timestamp"])

    sensor_dir = data_root / "sensor_data"
    maintenance_dir = data_root / "maintenance_logs"
    spare_dir = data_root / "spare_parts"
    for d in (sensor_dir, maintenance_dir, spare_dir):
        d.mkdir(parents=True, exist_ok=True)

    sensor_cols = ["timestamp", "equipment_id", "equipment_type"] + SENSOR_FEATURES
    master[sensor_cols].to_csv(sensor_dir / "industrial_sensor_readings.csv", index=False)

    failures = master[master["failure_type"] != "none"][
        ["timestamp", "equipment_id", "failure_type", "root_cause", "risk_level", "remaining_useful_life_hours"]
    ]
    failures.to_csv(maintenance_dir / "industrial_failure_events.csv", index=False)

    spare = master.groupby("equipment_id").agg(
        spare_inventory=("spare_inventory", "last"),
        downtime_cost_per_hour=("downtime_cost_per_hour", "mean"),
        risk_level=("risk_level", "last"),
    ).reset_index()
    spare.to_csv(spare_dir / "industrial_spare_snapshot.csv", index=False)
    print(f"  exported shared industrial data under {data_root}")
