"""Inventory Agent – spare parts procurement forecasting."""

from api.schemas import ProcurementResponse, RiskLevel
from models.registry import ModelRegistry


class InventoryAgent:
    def __init__(self, registry: ModelRegistry):
        self.registry = registry

    async def forecast(
        self, equipment_id: str | None, predicted_failures: list[dict],
        risk_levels: dict[str, RiskLevel], horizon_days: int = 30,
    ) -> ProcurementResponse:
        result = self.registry.prophet_forecast.predict(
            predicted_failures, {k: v.value for k, v in risk_levels.items()}, horizon_days
        )
        return ProcurementResponse(
            forecasts=result["forecasts"],
            procurement_recommendations=result["procurement_recommendations"],
            reorder_quantities=result["reorder_quantities"],
            stockout_risk=result["stockout_risk"],
        )
