"""Unified Layer 1 anomaly detection pipeline."""

from api.schemas import AnomalyResponse, HealthStatus, SensorReading
from models.registry import ModelRegistry


def unify_anomaly_scores(if_score: float, ae_score: float, lstm_score: float) -> tuple[float, HealthStatus]:
    unified = 0.35 * if_score + 0.35 * ae_score + 0.30 * lstm_score
    if unified < 0.3:
        status = HealthStatus.NORMAL
    elif unified < 0.6:
        status = HealthStatus.WARNING
    elif unified < 0.8:
        status = HealthStatus.ANOMALY
    else:
        status = HealthStatus.CRITICAL
    return unified, status


async def run_anomaly_detection(
    registry: ModelRegistry,
    equipment_id: str,
    sensor_data: SensorReading,
    historical_sequence: list[SensorReading] | None = None,
) -> AnomalyResponse:
    reading = sensor_data.model_dump()

    if_result = registry.isolation_forest.predict_from_reading(reading)
    ae_result = registry.autoencoder.predict_from_reading(reading)

    if historical_sequence and len(historical_sequence) >= 3:
        seq = [r.model_dump() for r in historical_sequence]
        lstm_result = registry.lstm_autoencoder.predict_from_sequence(seq)
    else:
        lstm_result = {"temporal_score": if_result["score"] * 0.5, "trend_alert": False}

    unified, health = unify_anomaly_scores(
        if_result["score"], ae_result["score"], lstm_result["temporal_score"]
    )

    return AnomalyResponse(
        equipment_id=equipment_id,
        unified_anomaly_score=round(unified, 4),
        health_status=health,
        isolation_forest_score=round(if_result["score"], 4),
        autoencoder_error=round(ae_result["reconstruction_error"], 4),
        lstm_temporal_score=round(lstm_result["temporal_score"], 4),
        is_anomaly=unified > 0.5,
        details={
            "isolation_forest_anomaly": if_result["is_anomaly"],
            "autoencoder_anomaly": ae_result["is_anomaly"],
            "lstm_trend_alert": lstm_result.get("trend_alert", False),
        },
    )
