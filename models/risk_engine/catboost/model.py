"""Layer 5 – CatBoost risk assessment engine."""

import numpy as np
from catboost import CatBoostClassifier

from api.schemas import RiskLevel
from models.base import BaseModel, OPS_DEFAULTS, SENSOR_DEFAULTS

RISK_MAP = {0: RiskLevel.LOW, 1: RiskLevel.MEDIUM, 2: RiskLevel.HIGH, 3: RiskLevel.CRITICAL}

CATBOOST_FEATURES = [
    "anomaly_score", "remaining_useful_life_hours", "operating_hours",
    "production_load", "downtime_cost_per_hour", "maintenance_days_ago",
    "vibration", "temperature",
]


class CatBoostRiskModel(BaseModel):
    def __init__(self, artifacts_path):
        super().__init__(artifacts_path, "catboost_risk")

    def train(self, X: np.ndarray, y: np.ndarray | None = None, **kwargs):
        self.model = CatBoostClassifier(
            iterations=200, depth=6, learning_rate=0.1,
            random_state=42, verbose=0,
        )
        self.model.fit(X, y)
        self.is_trained = True

    def _build_features(
        self,
        anomaly_score: float,
        rul_hours: float,
        equipment_age_days: int,
        downtime_cost: float,
        sensor_data: dict | None = None,
    ) -> np.ndarray:
        sensor_data = sensor_data or {}
        row = {
            "anomaly_score": anomaly_score,
            "remaining_useful_life_hours": rul_hours,
            "operating_hours": equipment_age_days * 24.0,
            "production_load": OPS_DEFAULTS["production_load"],
            "downtime_cost_per_hour": downtime_cost,
            "maintenance_days_ago": OPS_DEFAULTS["maintenance_days_ago"],
            "vibration": sensor_data.get("vibration", SENSOR_DEFAULTS["vibration"]),
            "temperature": sensor_data.get("temperature", SENSOR_DEFAULTS["temperature"]),
        }
        return np.array([[row[f] for f in CATBOOST_FEATURES]])

    def predict(
        self,
        anomaly_score: float,
        failure_type: str,
        rul_hours: float,
        equipment_age_days: int,
        downtime_cost: float,
        sensor_data: dict | None = None,
    ) -> dict:
        features = self._build_features(
            anomaly_score, rul_hours, equipment_age_days, downtime_cost, sensor_data
        )
        proba = self.model.predict_proba(features)[0]
        risk_idx = int(np.argmax(proba))
        risk_level = RISK_MAP.get(risk_idx, RiskLevel.MEDIUM)
        financial_impact = downtime_cost * max(1, (168 - rul_hours) / 24)
        return {
            "risk_level": risk_level,
            "risk_score": float(proba[risk_idx]),
            "confidence": float(max(proba)),
            "priority_rank": 4 - risk_idx,
            "financial_impact_estimate": round(financial_impact, 2),
        }
