"""Generate industry-grade datasets, train models, and run evaluation."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_ROOT = PROJECT_ROOT / "backend"
for path in (PROJECT_ROOT, BACKEND_ROOT):
    entry = str(path)
    if entry not in sys.path:
        sys.path.insert(0, entry)

from config.settings import settings
from scripts.synthetic_data import export_shared_industrial_data, persist_all_datasets


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Industry-grade dataset generation and model training.")
    parser.add_argument("--datasets-only", action="store_true", help="Only generate datasets.")
    parser.add_argument("--skip-shared", action="store_true", help="Skip shared CSV export.")
    parser.add_argument("--skip-eval", action="store_true", help="Skip evaluation pipeline.")
    parser.add_argument("--skip-train", action="store_true", help="Skip model training.")
    return parser.parse_args()


async def train_all_models() -> None:
    from models.registry import ModelRegistry

    registry = ModelRegistry()
    await registry.initialize()


def main() -> None:
    args = parse_args()
    datasets_dir = Path(settings.datasets_path)
    data_root = Path(settings.data_path)
    artifacts_dir = Path(settings.model_artifacts_path)

    print("=" * 60)
    print("Industrial Predictive Maintenance – Data Pipeline")
    print("=" * 60)
    print(f"Project root : {PROJECT_ROOT}")
    print(f"Data root    : {data_root}")
    print(f"Datasets dir : {datasets_dir}")
    print(f"Artifacts    : {artifacts_dir}")

    print("\n[1/4] Generating master industrial dataset + model splits...")
    persist_all_datasets(datasets_dir)

    if not args.skip_shared:
        print("\n[2/4] Exporting shared industrial CSVs...")
        export_shared_industrial_data(data_root)
    else:
        print("\n[2/4] Skipped shared CSV export.")

    if not args.skip_eval:
        print("\n[3/4] Running evaluation pipeline (train vs test metrics)...")
        from scripts.evaluation import evaluate_all_models

        metrics = evaluate_all_models(datasets_dir)
        print(f"  Metrics saved to {data_root / 'evaluation' / 'metrics.json'}")
    else:
        print("\n[3/4] Skipped evaluation.")
        metrics = {}

    if args.datasets_only or args.skip_train:
        print("\n[4/4] Skipped model artifact training.")
        print("\nDone.")
        return

    print("\n[4/4] Training all production models from datasets...")
    asyncio.run(train_all_models())

    if metrics:
        eval_dir = data_root / "evaluation"
        (artifacts_dir / "evaluation_metrics.json").write_text(
            json.dumps(metrics, indent=2), encoding="utf-8"
        )
        print(f"  Evaluation metrics copied to {artifacts_dir / 'evaluation_metrics.json'}")

    print(f"\nAll models trained. Artifacts: {artifacts_dir}")
    print("Done.")


if __name__ == "__main__":
    main()
