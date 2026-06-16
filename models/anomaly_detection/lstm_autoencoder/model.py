"""Layer 1 – LSTM AutoEncoder for temporal anomaly detection."""

import numpy as np

from models.base import BaseModel, SENSOR_FEATURES


class LSTMAutoEncoderModel(BaseModel):
    """Statistical temporal anomaly detector (LSTM-inspired rolling window)."""

    SEQ_LEN = 24
    Z_THRESHOLD = 3.0

    def __init__(self, artifacts_path):
        super().__init__(artifacts_path, "lstm_autoencoder")
        self.baseline_mean: np.ndarray | None = None
        self.baseline_std: np.ndarray | None = None

    def _hydrate_from_artifact(self):
        if isinstance(self.model, dict):
            self.baseline_mean = self.model.get("mean")
            self.baseline_std = self.model.get("std")

    def train(self, X: np.ndarray, y: np.ndarray | None = None, **kwargs):
        flat = X.reshape(-1, X.shape[-1])
        self.baseline_mean = np.mean(flat, axis=0)
        self.baseline_std = np.std(flat, axis=0) + 1e-8
        self.model = {"mean": self.baseline_mean, "std": self.baseline_std}
        self.is_trained = True

    def predict(self, X: np.ndarray) -> dict:
        if self.baseline_mean is None or self.baseline_std is None:
            self._hydrate_from_artifact()
        if X.ndim == 2:
            X = X[np.newaxis, ...]
        z_scores = np.abs((X - self.baseline_mean) / self.baseline_std)
        temporal_score = float(np.max(z_scores))
        normalized = min(temporal_score / (self.Z_THRESHOLD * 2), 1.0)
        trend = float(np.mean(np.diff(X[0, :, 1]))) if X.shape[1] > 1 else 0.0
        return {
            "temporal_score": normalized,
            "trend": trend,
            "is_anomaly": temporal_score > self.Z_THRESHOLD,
            "trend_alert": abs(trend) > 0.5,
        }

    def predict_from_sequence(self, sequence: list[dict]) -> dict:
        seq = self._pad_sequence(sequence, SENSOR_FEATURES, self.SEQ_LEN)
        return self.predict(seq)
