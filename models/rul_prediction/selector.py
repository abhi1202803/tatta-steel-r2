"""Automatic model selection between LSTM and TFT for RUL prediction."""

from models.registry import ModelRegistry


def predict_rul(
    registry: ModelRegistry,
    readings: list[dict],
    equipment_age_days: int = 365,
    production_load: float = 0.8,
    maintenance_records: list | None = None,
) -> dict:
    use_tft = (
        len(readings) >= 10
        or production_load > 0.7
        or equipment_age_days > 730
        or maintenance_records is not None
    )

    if use_tft:
        result = registry.tft_rul.predict(
            readings, equipment_age_days, production_load, maintenance_records
        )
        lstm_result = registry.lstm_rul.predict_from_sequence(readings, equipment_age_days)
        if lstm_result["confidence"] > result["confidence"]:
            lstm_result["model_used"] = "lstm"
            return lstm_result
        return result

    return registry.lstm_rul.predict_from_sequence(readings, equipment_age_days)
