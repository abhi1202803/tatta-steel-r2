"""Layer 1 – AutoEncoder for unknown anomaly detection."""

import numpy as np
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler

from models.base import BaseModel


class AutoEncoderModel(BaseModel):
    def __init__(self, artifacts_path):
        super().__init__(artifacts_path, "autoencoder")
        self.scaler = StandardScaler()
        self.threshold = 0.5

    def _hydrate_from_artifact(self):
        if isinstance(self.model, dict):
            self.scaler = self.model.get("scaler", self.scaler)
            self.threshold = float(self.model.get("threshold", self.threshold))

    def train(self, X: np.ndarray, y: np.ndarray | None = None, **kwargs):
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        ae = MLPRegressor(
            hidden_layer_sizes=(64, 16, 64),
            max_iter=400,
            random_state=42,
            early_stopping=True,
        )
        ae.fit(X_scaled, X_scaled)
        recon = ae.predict(X_scaled)
        errors = np.mean((X_scaled - recon) ** 2, axis=1)
        self.threshold = float(np.percentile(errors, 95))
        self.model = {
            "encoder_decoder": ae,
            "scaler": self.scaler,
            "threshold": self.threshold,
        }
        self.is_trained = True

    def predict(self, X: np.ndarray) -> dict:
        scaler = self.model["scaler"]
        ae = self.model["encoder_decoder"]
        threshold = float(self.model.get("threshold", self.threshold))
        X_scaled = scaler.transform(X)
        recon = ae.predict(X_scaled)
        error = float(np.mean((X_scaled - recon) ** 2))
        is_anomaly = error > threshold
        normalized = min(error / (threshold * 2), 1.0)
        return {"reconstruction_error": error, "score": normalized, "is_anomaly": is_anomaly}

    def predict_from_reading(self, reading: dict) -> dict:
        return self.predict(self._autoencoder_features(reading))
