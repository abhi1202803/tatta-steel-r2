"""Report Agent – generates executive and technician reports."""

from api.schemas import (
    AnomalyResponse, FailurePredictionResponse, MaintenanceResponse,
    RCAResponse, RiskResponse, RULResponse,
)


class ReportAgent:
    async def generate_executive_summary(
        self,
        equipment_id: str,
        anomaly: AnomalyResponse,
        failure: FailurePredictionResponse,
        rca: RCAResponse,
        rul: RULResponse,
        risk: RiskResponse,
        maintenance: MaintenanceResponse,
    ) -> str:
        return (
            f"**Equipment {equipment_id} – Executive Summary**\n\n"
            f"Health: {anomaly.health_status.value.upper()} | "
            f"Anomaly Score: {anomaly.unified_anomaly_score:.2f}\n"
            f"Predicted Failure: {failure.failure_type.value.replace('_', ' ').title()} "
            f"({failure.confidence:.0%} confidence)\n"
            f"Root Cause: {rca.root_cause} → {' → '.join(rca.cause_chain[-2:])}\n"
            f"RUL: {rul.rul_days:.0f} days ({rul.model_used.upper()} model)\n"
            f"Risk: {risk.risk_level.value.upper()} | "
            f"Financial Impact: ${risk.financial_impact_estimate:,.0f}\n"
            f"Action: {maintenance.recommended_action.value.replace('_', ' ').title()}"
            f"{f' | Window: {maintenance.maintenance_window}' if maintenance.maintenance_window else ''}\n"
            f"Est. Savings: ${maintenance.cost_savings_estimate:,.0f}"
        )
