"""Layer 1 – Isolation Forest anomaly detection."""

import numpy as np
from sklearn.ensemble import IsolationForest

from models.base import BaseModel


class IsolationForestModel(BaseModel):
    def __init__(self, artifacts_path):
        super().__init__(artifacts_path, "isolation_forest")

    def train(self, X: np.ndarray, y: np.ndarray | None = None, **kwargs):
        contam = max(0.01, float(y.mean())) if y is not None else 0.1
        self.model = IsolationForest(
            n_estimators=200, contamination=contam, random_state=42, n_jobs=-1
        )
        self.model.fit(X)
        self.is_trained = True

    def predict(self, X: np.ndarray) -> dict:
        raw = self.model.decision_function(X)
        scores = -raw
        normalized = (scores - scores.min()) / (scores.max() - scores.min() + 1e-8)
        is_anomaly = self.model.predict(X) == -1
        return {
            "score": float(normalized[0]),
            "is_anomaly": bool(is_anomaly[0]),
            "raw_score": float(scores[0]),
        }

    def predict_from_reading(self, reading: dict) -> dict:
        return self.predict(self._sensor_to_features(reading))
