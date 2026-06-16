"""Equipment-centric context manager – aggregates registry, alerts, sensors, history."""

from sqlalchemy.ext.asyncio import AsyncSession

from api.data_store import EQUIPMENT_REGISTRY
from api.schemas import EquipmentContext, EquipmentInfo, HealthStatus
from services import db_repository as repo
from services.db_data import fetch_equipment_alerts, fetch_equipment_list, fetch_equipment_sensors


class EquipmentContextManager:
    """Provides unified equipment context to all agents."""

    def __init__(self):
        self._registry = {e.id: e for e in EQUIPMENT_REGISTRY}

    def get(self, equipment_id: str) -> EquipmentContext | None:
        info = self._registry.get(equipment_id)
        if not info:
            return None
        return EquipmentContext(
            equipment=info,
            criticality=info.criticality or "medium",
            active_alerts=[],
            latest_sensors={},
            maintenance_history=[],
            production_load=0.82,
            downtime_cost_per_hour=_criticality_cost(info.criticality or "medium"),
        )

    async def get_from_db(self, equipment_id: str, db: AsyncSession) -> EquipmentContext | None:
        info = self._registry.get(equipment_id)
        try:
            for eq in await fetch_equipment_list(db):
                if eq.id == equipment_id:
                    info = eq
                    self._registry[equipment_id] = eq
                    break
        except Exception:
            pass

        if not info:
            return None

        alerts = await fetch_equipment_alerts(db, equipment_id)
        history = await repo.list_logbook(db, equipment_id, limit=10)
        sensors = await fetch_equipment_sensors(db, equipment_id)

        return EquipmentContext(
            equipment=info,
            criticality=info.criticality or "medium",
            active_alerts=alerts,
            latest_sensors=sensors,
            maintenance_history=[h.model_dump() for h in history],
            production_load=0.82,
            downtime_cost_per_hour=_criticality_cost(info.criticality or "medium"),
        )

    def list_all(self) -> list[EquipmentInfo]:
        return list(self._registry.values())

    def resolve_id(self, equipment_id: str | None, payload_text: str = "") -> str:
        if equipment_id and equipment_id in self._registry:
            return equipment_id
        for eq in EQUIPMENT_REGISTRY:
            if eq.id.lower() in payload_text.lower() or eq.name.lower() in payload_text.lower():
                return eq.id
        return EQUIPMENT_REGISTRY[0].id if EQUIPMENT_REGISTRY else "PUMP-05"

    def update_health(self, equipment_id: str, health: HealthStatus, anomaly_score: float, rul_days: float):
        eq = self._registry.get(equipment_id)
        if eq:
            eq.health_status = health
            eq.anomaly_score = anomaly_score
            eq.rul_days = rul_days


def _criticality_cost(criticality: str) -> float:
    return {"low": 2000.0, "medium": 5000.0, "high": 12000.0, "critical": 25000.0}.get(
        criticality.lower(), 5000.0
    )


equipment_context = EquipmentContextManager()
