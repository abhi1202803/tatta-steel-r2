"""Prediction Agent – failure classification, RUL, and risk assessment."""

from api.schemas import (
    FailurePredictionResponse, FailureType, RiskLevel, RiskResponse,
    RULResponse, SensorReading,
)
from models.registry import ModelRegistry
from models.rul_prediction.selector import predict_rul


class PredictionAgent:
    def __init__(self, registry: ModelRegistry):
        self.registry = registry

    async def classify_failure(
        self, equipment_id: str, sensor_data: SensorReading, anomaly_score: float
    ) -> FailurePredictionResponse:
        result = self.registry.xgboost_failure.predict_from_context(
            sensor_data.model_dump(), anomaly_score
        )
        return FailurePredictionResponse(
            equipment_id=equipment_id,
            failure_type=FailureType(result["failure_type"]),
            confidence=result["confidence"],
            probabilities=result["probabilities"],
        )

    async def predict_rul(
        self, equipment_id: str, sequence: list[SensorReading], equipment_age_days: int
    ) -> RULResponse:
        readings = [r.model_dump() for r in sequence]
        result = predict_rul(self.registry, readings, equipment_age_days)
        return RULResponse(
            equipment_id=equipment_id,
            rul_hours=result["rul_hours"],
            rul_days=result["rul_days"],
            model_used=result.get("model_used", "lstm"),
            confidence=result["confidence"],
            feature_importance=result.get("feature_importance", {}),
        )

    async def assess_risk(
        self, equipment_id: str, anomaly_score: float, failure_type: FailureType,
        root_cause: str, rul_hours: float, equipment_age_days: int, downtime_cost: float,
    ) -> RiskResponse:
        result = self.registry.catboost_risk.predict(
            anomaly_score, failure_type.value, rul_hours, equipment_age_days, downtime_cost
        )
        return RiskResponse(
            equipment_id=equipment_id,
            risk_level=result["risk_level"],
            risk_score=result["risk_score"],
            confidence=result["confidence"],
            priority_rank=result["priority_rank"],
            financial_impact_estimate=result["financial_impact_estimate"],
        )
