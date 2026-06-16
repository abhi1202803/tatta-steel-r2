"""Diagnosis Agent – anomaly detection and root cause analysis."""

from api.schemas import AnomalyResponse, FailureType, RCARequest, RCAResponse, SensorReading
from models.anomaly_detection.pipeline import run_anomaly_detection
from models.registry import ModelRegistry


class DiagnosisAgent:
    def __init__(self, registry: ModelRegistry):
        self.registry = registry

    async def detect_anomaly(
        self, equipment_id: str, sensor_data: SensorReading, sequence: list[SensorReading] | None
    ) -> AnomalyResponse:
        return await run_anomaly_detection(self.registry, equipment_id, sensor_data, sequence)

    async def analyze_root_cause(
        self, equipment_id: str, failure_type: FailureType,
        sensor_data: SensorReading, anomaly_score: float,
    ) -> RCAResponse:
        result = self.registry.gnn_rca.predict(
            failure_type.value, sensor_data.model_dump(), anomaly_score
        )
        return RCAResponse(
            equipment_id=equipment_id,
            root_cause=result["root_cause"],
            confidence=result["confidence"],
            cause_chain=result["cause_chain"],
            affected_components=result["affected_components"],
        )
