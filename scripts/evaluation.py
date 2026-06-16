"""
Automated evaluation pipeline for all predictive-maintenance models.
Trains on train split, evaluates on test split datasets on low testing models, saves metrics JSON.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, IsolationForest, RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_absolute_percentage_error,
    precision_score,
    recall_score,
)
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler

from scripts.industrial_dataset import RISK_LEVELS, RL_ACTIONS


def _load_split(model_name: str, data_dir: Path, split: str) -> dict:
    path = data_dir / model_name / f"{split}.npz"
    archive = np.load(path, allow_pickle=True)
    has_y = bool(archive["has_y"])
    y = archive["y"] if has_y else None
    if y is not None and len(y) == 0:
        y = None
    out: dict = {"X": archive["X"], "y": y}
    if "rewards" in archive:
        out["rewards"] = archive["rewards"]
    return out


def _json_default(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (np.integer, np.floating)):
        return float(obj)
    raise TypeError(f"Not serializable: {type(obj)}")


def evaluate_all_models(data_dir: Path, output_dir: Path | None = None) -> dict:
    output_dir = output_dir or data_dir.parent / "evaluation"
    output_dir.mkdir(parents=True, exist_ok=True)

    evaluators = {
        "isolation_forest": _eval_isolation_forest,
        "autoencoder": _eval_autoencoder,
        "lstm_autoencoder": _eval_lstm_autoencoder,
        "xgboost_failure": _eval_xgboost,
        "gnn_rca": _eval_gnn,
        "lstm_rul": lambda d: _eval_rul_model("lstm_rul", d),
        "tft_rul": lambda d: _eval_rul_model("tft_rul", d),
        "catboost_risk": _eval_catboost,
        "maintenance_rl": _eval_rl,
        "prophet_forecast": _eval_prophet,
    }

    results: dict = {}
    for name, fn in evaluators.items():
        try:
            results[name] = fn(data_dir)
            print(f"  evaluated {name}: {results[name].get('summary', 'ok')}")
        except Exception as exc:
            results[name] = {"error": str(exc)}
            print(f"  evaluation failed {name}: {exc}")

    (output_dir / "metrics.json").write_text(
        json.dumps(results, indent=2, default=_json_default), encoding="utf-8"
    )
    _write_report(output_dir / "evaluation_report.md", results)
    return results

def _eval_isolation_forest(data_dir: Path) -> dict:
    train = _load_split("isolation_forest", data_dir, "train")
    test = _load_split("isolation_forest", data_dir, "test")
    contamination = float(np.clip(train["y"].mean(), 0.02, 0.45))
    model = IsolationForest(n_estimators=200, contamination=contamination, random_state=42, n_jobs=-1)
    model.fit(train["X"])
    pred = (model.predict(test["X"]) == -1).astype(int)
    y_test = test["y"]
    return {
        "precision": float(precision_score(y_test, pred, zero_division=0)),
        "recall": float(recall_score(y_test, pred, zero_division=0)),
        "f1": float(f1_score(y_test, pred, zero_division=0)),
        "summary": f"F1={f1_score(y_test, pred, zero_division=0):.3f}",
    }


def _eval_autoencoder(data_dir: Path) -> dict:
    train = _load_split("autoencoder", data_dir, "train")
    test = _load_split("autoencoder", data_dir, "test")
    scaler = StandardScaler()
    X_train = scaler.fit_transform(train["X"])
    X_test = scaler.transform(test["X"])
    ae = MLPRegressor(hidden_layer_sizes=(64, 16, 64), max_iter=300, random_state=42, early_stopping=True)
    ae.fit(X_train, X_train)
    errors = np.mean((X_test - ae.predict(X_test)) ** 2, axis=1)
    return {
        "mean_reconstruction_error": float(errors.mean()),
        "threshold_95pct": float(np.percentile(errors, 95)),
        "summary": f"MRE={errors.mean():.4f}",
    }


def _eval_lstm_autoencoder(data_dir: Path) -> dict:
    train = _load_split("lstm_autoencoder", data_dir, "train")
    test = _load_split("lstm_autoencoder", data_dir, "test")
    flat = train["X"].reshape(-1, train["X"].shape[-1])
    mean, std = flat.mean(axis=0), flat.std(axis=0) + 1e-8
    scores = np.abs((test["X"] - mean) / std).max(axis=(1, 2))
    return {
        "mean_temporal_score": float(scores.mean()),
        "anomaly_pct_above_3sigma": float((scores > 3).mean()),
        "summary": f"mean_z={scores.mean():.2f}",
    }


def _eval_xgboost(data_dir: Path) -> dict:
    from xgboost import XGBClassifier

    train = _load_split("xgboost_failure", data_dir, "train")
    test = _load_split("xgboost_failure", data_dir, "test")
    le = LabelEncoder()
    y_train = le.fit_transform(train["y"])
    y_test = le.transform(test["y"])
    clf = XGBClassifier(n_estimators=200, max_depth=6, learning_rate=0.1, random_state=42, eval_metric="mlogloss")
    clf.fit(train["X"], y_train)
    pred = clf.predict(test["X"])
    return {
        "accuracy": float(accuracy_score(y_test, pred)),
        "precision_macro": float(precision_score(y_test, pred, average="macro", zero_division=0)),
        "recall_macro": float(recall_score(y_test, pred, average="macro", zero_division=0)),
        "f1_macro": float(f1_score(y_test, pred, average="macro", zero_division=0)),
        "confusion_matrix": confusion_matrix(y_test, pred).tolist(),
        "classification_report": classification_report(y_test, pred, target_names=le.classes_, output_dict=True),
        "summary": f"Acc={accuracy_score(y_test, pred):.3f} F1={f1_score(y_test, pred, average='macro', zero_division=0):.3f}",
    }


def _eval_gnn(data_dir: Path) -> dict:
    train = _load_split("gnn_rca", data_dir, "train")
    test = _load_split("gnn_rca", data_dir, "test")
    le = LabelEncoder()
    y_train = le.fit_transform(train["y"])
    y_test = le.transform(test["y"])
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(train["X"], y_train)
    pred = clf.predict(test["X"])
    return {
        "accuracy": float(accuracy_score(y_test, pred)),
        "f1_macro": float(f1_score(y_test, pred, average="macro", zero_division=0)),
        "summary": f"Acc={accuracy_score(y_test, pred):.3f}",
    }


def _eval_rul_model(model_name: str, data_dir: Path) -> dict:
    train = _load_split(model_name, data_dir, "train")
    test = _load_split(model_name, data_dir, "test")
    X_train = train["X"].reshape(len(train["X"]), -1)
    X_test = test["X"].reshape(len(test["X"]), -1)
    reg = GradientBoostingRegressor(n_estimators=150, random_state=42)
    reg.fit(X_train, train["y"])
    pred = reg.predict(X_test)
    y_true = test["y"]
    mae = mean_absolute_error(y_true, pred)
    rmse = float(np.sqrt(np.mean((y_true - pred) ** 2)))
    mape = float(mean_absolute_percentage_error(y_true, pred))
    return {"mae": float(mae), "rmse": rmse, "mape": mape, "summary": f"MAE={mae:.1f}h RMSE={rmse:.1f}h"}


def _eval_catboost(data_dir: Path) -> dict:
    from catboost import CatBoostClassifier

    train = _load_split("catboost_risk", data_dir, "train")
    test = _load_split("catboost_risk", data_dir, "test")
    model = CatBoostClassifier(iterations=200, depth=6, learning_rate=0.1, random_state=42, verbose=0)
    model.fit(train["X"], train["y"])
    pred = model.predict(test["X"])
    return {
        "accuracy": float(accuracy_score(test["y"], pred)),
        "f1_macro": float(f1_score(test["y"], pred, average="macro", zero_division=0)),
        "labels": RISK_LEVELS,
        "summary": f"Acc={accuracy_score(test['y'], pred):.3f}",
    }


def _eval_rl(data_dir: Path) -> dict:
    test = _load_split("maintenance_rl", data_dir, "test")
    rewards = test["rewards"]
    optimal = test["y"]
    risk_states = np.clip((test["X"][:, 0] * 4).astype(int), 0, 4)
    policy_match = float((risk_states == optimal).mean())
    return {
        "mean_reward_test": float(np.mean(rewards)),
        "cost_saved_estimate": float(np.sum(rewards[rewards > 0])),
        "downtime_reduction_score": policy_match,
        "actions": RL_ACTIONS,
        "summary": f"Reward={np.mean(rewards):.2f}",
    }


def _eval_prophet(data_dir: Path) -> dict:
    train = _load_split("prophet_forecast", data_dir, "train")
    test = _load_split("prophet_forecast", data_dir, "test")
    naive = np.full_like(test["y"], train["y"][-30:].mean())
    result = {
        "mae_baseline": float(mean_absolute_error(test["y"], naive)),
        "mape_baseline": float(mean_absolute_percentage_error(test["y"], naive)),
    }
    result["summary"] = f"MAE={result['mae_baseline']:.2f}"
    cat_dir = data_dir / "prophet_forecast" / "categories"
    if cat_dir.exists():
        try:
            from prophet import Prophet

            dfs = [pd.read_csv(p) for p in sorted(cat_dir.glob("*.csv"))]
            full = pd.concat(dfs).groupby("ds", as_index=False)["y"].sum()
            full["ds"] = pd.to_datetime(full["ds"])
            split = int(len(full) * 0.85)
            m = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
            m.fit(full.iloc[:split])
            hold = full.iloc[split:]
            forecast = m.predict(hold[["ds"]])
            result["mae_prophet"] = float(mean_absolute_error(hold["y"], forecast["yhat"]))
            result["mape_prophet"] = float(mean_absolute_percentage_error(hold["y"], forecast["yhat"]))
            result["summary"] = f"Prophet MAE={result['mae_prophet']:.2f}"
        except ImportError:
            result["prophet_note"] = "Prophet not installed"
    return result


def _write_report(path: Path, results: dict) -> None:
    lines = ["# Model Evaluation Report\n\n"]
    for model, metrics in results.items():
        lines.append(f"## {model}\n\n")
        if "error" in metrics:
            lines.append(f"- Error: {metrics['error']}\n\n")
            continue
        lines.append(f"**Summary:** {metrics.get('summary', 'n/a')}\n\n")
        for k, v in metrics.items():
            if k in ("summary", "classification_report", "confusion_matrix"):
                continue
            lines.append(f"- {k}: {v}\n")
        lines.append("\n")
    path.write_text("".join(lines), encoding="utf-8")
