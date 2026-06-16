"""Maintenance Agent – RL-based maintenance optimization."""

from api.schemas import HealthStatus, MaintenanceResponse, RiskLevel
from models.registry import ModelRegistry


class MaintenanceAgent:
    def __init__(self, registry: ModelRegistry):
        self.registry = registry

    async def optimize(
        self, equipment_id: str, risk_level: RiskLevel,
        rul_hours: float, health_status: HealthStatus, inventory: dict | None = None,
    ) -> MaintenanceResponse:
        result = self.registry.rl_agent.predict(risk_level, rul_hours, health_status, inventory)
        return MaintenanceResponse(
            equipment_id=equipment_id,
            recommended_action=result["recommended_action"],
            maintenance_window=result["maintenance_window"],
            cost_savings_estimate=result["cost_savings_estimate"],
            autonomous_plan=result["autonomous_plan"],
            reasoning=result["reasoning"],
        )
