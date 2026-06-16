"""Base model interface for all ML pipeline components."""

import logging
from abc import ABC, abstractmethod
from pathlib import Path

import joblib
import numpy as np

logger = logging.getLogger(__name__)

SENSOR_FEATURES = [
    "temperature", "vibration", "pressure", "current", "voltage",
    "rpm", "flow_rate", "power_consumption",
]
THERMAL_FEATURES = ["oil_level", "bearing_temperature", "motor_temperature", "gearbox_temperature"]
OPS_FEATURES = [
    "operating_hours", "maintenance_days_ago", "production_load", "downtime_cost_per_hour",
]
SENSOR_DEFAULTS = {
    "temperature": 45.0, "vibration": 2.5, "pressure": 5.0, "current": 12.0,
    "voltage": 400.0, "rpm": 1500.0, "flow_rate": 50.0, "power_consumption": 15.0,
}
THERMAL_DEFAULTS = {
    "oil_level": 80.0, "bearing_temperature": 50.0,
    "motor_temperature": 55.0, "gearbox_temperature": 48.0,
}
OPS_DEFAULTS = {
    "operating_hours": 5000.0, "maintenance_days_ago": 30.0,
    "production_load": 0.8, "downtime_cost_per_hour": 10000.0,
}


class BaseModel(ABC):
    """Abstract base for pipeline models with load-or-train pattern."""

    def __init__(self, artifacts_path: Path, model_name: str):
        self.artifacts_path = artifacts_path
        self.model_name = model_name
        self.model_path = artifacts_path / f"{model_name}.joblib"
        self.model = None
        self.is_trained = False

    @abstractmethod
    def train(self, X: np.ndarray, y: np.ndarray | None = None, **kwargs):
        pass

    @abstractmethod
    def predict(self, X: np.ndarray) -> dict:
        pass

    def load_or_train(self):
        if self.model_path.exists():
            try:
                self.model = joblib.load(self.model_path)
                self.is_trained = True
                self._hydrate_from_artifact()
                logger.info(f"Loaded {self.model_name} from {self.model_path}")
                return
            except Exception as e:
                logger.warning(f"Failed to load {self.model_name}: {e}")

        logger.info(f"Training {self.model_name} with synthetic data...")
        from config.settings import settings
        from scripts.synthetic_data import generate_training_data, load_dataset

        datasets_path = Path(settings.datasets_path)
        train_file = datasets_path / self.model_name / "train.npz"
        legacy_file = datasets_path / self.model_name / "dataset.npz"
        if train_file.exists():
            data = load_dataset(self.model_name, datasets_path, split="train")
        elif legacy_file.exists():
            data = load_dataset(self.model_name, datasets_path, split="train")
        else:
            data = generate_training_data(self.model_name)
        self.train(data["X"], data.get("y"), **self._extra_train_kwargs(data))
        self._hydrate_from_artifact()
        self.save()

    def _extra_train_kwargs(self, data: dict) -> dict:
        return {}

    def _hydrate_from_artifact(self):
        """Restore runtime attributes from a loaded artifact dict."""
        pass

    def save(self):
        self.artifacts_path.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, self.model_path)
        logger.info(f"Saved {self.model_name} to {self.model_path}")

    def _sensor_to_features(self, reading: dict) -> np.ndarray:
        temp = reading.get("temperature", SENSOR_DEFAULTS["temperature"])
        thermal_defaults = {
            **THERMAL_DEFAULTS,
            "bearing_temperature": temp + 5.0,
            "motor_temperature": temp + 10.0,
            "gearbox_temperature": temp + 3.0,
        }
        return np.array([[
            reading.get(f, SENSOR_DEFAULTS.get(f, 0.0)) for f in SENSOR_FEATURES
        ]])

    def _autoencoder_features(self, reading: dict) -> np.ndarray:
        temp = reading.get("temperature", SENSOR_DEFAULTS["temperature"])
        thermal_defaults = {
            **THERMAL_DEFAULTS,
            "bearing_temperature": temp + 5.0,
            "motor_temperature": temp + 10.0,
            "gearbox_temperature": temp + 3.0,
        }
        row = [reading.get(f, SENSOR_DEFAULTS.get(f, 0.0)) for f in SENSOR_FEATURES]
        row.extend([reading.get(f, thermal_defaults[f]) for f in THERMAL_FEATURES])
        return np.array([row])

    def _xgboost_features(
        self, reading: dict, anomaly_score: float, rul_hours: float = 500.0
    ) -> np.ndarray:
        temp = reading.get("temperature", SENSOR_DEFAULTS["temperature"])
        thermal_defaults = {
            **THERMAL_DEFAULTS,
            "bearing_temperature": temp + 5.0,
            "motor_temperature": temp + 10.0,
            "gearbox_temperature": temp + 3.0,
        }
        row = [reading.get(f, SENSOR_DEFAULTS.get(f, 0.0)) for f in SENSOR_FEATURES]
        row.extend([reading.get(f, thermal_defaults[f]) for f in THERMAL_FEATURES])
        row.extend([reading.get(f, OPS_DEFAULTS[f]) for f in OPS_FEATURES])
        row.extend([anomaly_score, rul_hours])
        return np.array([row])

    def _pad_sequence(self, readings: list[dict], feat_names: list[str], seq_len: int) -> np.ndarray:
        defaults = {**SENSOR_DEFAULTS}
        seq = np.array([
            [r.get(f, defaults.get(f, 0.0)) for f in feat_names] for r in readings
        ], dtype=np.float32)
        if len(seq) == 0:
            return np.tile([defaults.get(f, 0.0) for f in feat_names], (seq_len, 1))
        if len(seq) < seq_len:
            pad = np.tile(seq[0], (seq_len - len(seq), 1))
            seq = np.vstack([pad, seq])
        return seq[-seq_len:]
