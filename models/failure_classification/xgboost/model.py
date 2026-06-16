"""Layer 2 – XGBoost failure classification."""

import numpy as np
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

from models.base import BaseModel


class XGBoostFailureModel(BaseModel):
    def __init__(self, artifacts_path):
        super().__init__(artifacts_path, "xgboost_failure")
        self.label_encoder = LabelEncoder()

    def train(self, X: np.ndarray, y: np.ndarray | None = None, **kwargs):
        self.label_encoder = LabelEncoder()
        y_encoded = self.label_encoder.fit_transform(y)
        clf = XGBClassifier(
            n_estimators=200, max_depth=6, learning_rate=0.1,
            random_state=42, eval_metric="mlogloss",
        )
        clf.fit(X, y_encoded)
        self.model = {"classifier": clf, "label_encoder": self.label_encoder}
        self.is_trained = True

    def predict(self, X: np.ndarray) -> dict:
        clf = self.model["classifier"]
        le = self.model["label_encoder"]
        proba = clf.predict_proba(X)[0]
        pred_idx = int(np.argmax(proba))
        failure_type = le.inverse_transform([pred_idx])[0]
        return {
            "failure_type": failure_type,
            "confidence": float(proba[pred_idx]),
            "probabilities": {le.inverse_transform([i])[0]: float(p) for i, p in enumerate(proba)},
        }

    def predict_from_context(
        self, reading: dict, anomaly_score: float, rul_hours: float = 500.0
    ) -> dict:
        return self.predict(self._xgboost_features(reading, anomaly_score, rul_hours))
