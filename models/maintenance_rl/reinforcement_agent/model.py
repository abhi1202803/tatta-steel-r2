"""Layer 6 – Reinforcement Learning maintenance optimization."""

import numpy as np

from api.schemas import HealthStatus, MaintenanceAction, RiskLevel
from models.base import BaseModel

ACTION_MAP = {
    0: MaintenanceAction.CONTINUE,
    1: MaintenanceAction.MONITOR,
    2: MaintenanceAction.SCHEDULE,
    3: MaintenanceAction.SHUTDOWN,
    4: MaintenanceAction.ORDER_SPARES,
}

RISK_TO_IDX = {"low": 0, "medium": 1, "high": 2, "critical": 3}


class MaintenanceRLAgent(BaseModel):
    """Q-table maintenance decision agent trained from synthetic transitions."""

    def __init__(self, artifacts_path):
        super().__init__(artifacts_path, "maintenance_rl")
        self.q_table = np.zeros((5, 5))
        self.policy: list[int] = []

    def _hydrate_from_artifact(self):
        if isinstance(self.model, dict):
            self.q_table = self.model.get("q_table", self.q_table)
            self.policy = self.model.get("policy", self.policy)

    def _extra_train_kwargs(self, data: dict) -> dict:
        return {"rewards": data.get("rewards")}

    def train(self, X: np.ndarray, y: np.ndarray | None = None, **kwargs):
        q = np.zeros((5, 5))
        for row, action in zip(X, y):
            state = min(int(row[0] * 4), 4)
            q[state, int(action)] += 1
        policy = q.argmax(axis=1).tolist()
        self.q_table = q
        self.policy = policy
        self.model = {"q_table": q, "policy": policy}
        self.is_trained = True

    def _state_index(self, risk_level: RiskLevel, rul_hours: float, anomaly_score: float) -> int:
        risk_norm = RISK_TO_IDX.get(risk_level.value, 1) / 3.0
        return min(int(risk_norm * 4), 4)

    def predict(
        self,
        risk_level: RiskLevel,
        rul_hours: float,
        health_status: HealthStatus,
        inventory: dict | None = None,
    ) -> dict:
        state = self._state_index(risk_level, rul_hours, 0.0)
        if isinstance(self.model, dict) and self.policy:
            action = ACTION_MAP.get(int(self.policy[state]), MaintenanceAction.MONITOR)
        else:
            action = MaintenanceAction.MONITOR

        if risk_level == RiskLevel.CRITICAL or rul_hours < 48:
            action = MaintenanceAction.SHUTDOWN
            window = "Immediate (within 4 hours)"
            savings = 50000
            plan = [
                "Emergency shutdown initiated",
                "Notify maintenance team",
                "Order critical spares",
                "Schedule emergency repair",
            ]
        elif risk_level == RiskLevel.HIGH or rul_hours < 168:
            if action == MaintenanceAction.CONTINUE:
                action = MaintenanceAction.SCHEDULE
            window = f"Within {max(24, int(rul_hours * 0.5))} hours"
            savings = 25000
            plan = [
                "Schedule preventive maintenance",
                "Verify spare parts availability",
                "Prepare maintenance work order",
                "Coordinate production downtime",
            ]
        elif risk_level == RiskLevel.MEDIUM or health_status == HealthStatus.WARNING:
            if action in (MaintenanceAction.CONTINUE, MaintenanceAction.SHUTDOWN):
                action = MaintenanceAction.MONITOR
            window = "Continue monitoring for 7 days"
            savings = 10000
            plan = [
                "Increase sensor monitoring frequency",
                "Review trend data daily",
                "Prepare contingency maintenance plan",
            ]
        else:
            if action == MaintenanceAction.SHUTDOWN:
                action = MaintenanceAction.CONTINUE
            window = None
            savings = 5000
            plan = ["Continue normal operation", "Routine inspection schedule"]

        if inventory:
            low_stock = [k for k, v in inventory.items() if v < 2]
            if low_stock:
                action = MaintenanceAction.ORDER_SPARES
                plan.append(f"Order spares: {', '.join(low_stock)}")

        reasoning = (
            f"Risk={risk_level.value}, RUL={rul_hours:.0f}h, Health={health_status.value}. "
            f"Q-table state={state}, action={action.value}."
        )

        return {
            "recommended_action": action,
            "maintenance_window": window,
            "cost_savings_estimate": savings,
            "autonomous_plan": plan,
            "reasoning": reasoning,
        }
