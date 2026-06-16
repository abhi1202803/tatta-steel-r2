"""Multi-agent orchestrator with dynamic workflow selection."""

import logging
from datetime import datetime, timezone
from typing import Any

from agents.diagnosis_agent.agent import DiagnosisAgent
from agents.inventory_agent.agent import InventoryAgent
from agents.knowledge_agent.agent import KnowledgeAgent
from agents.maintenance_agent.agent import MaintenanceAgent
from agents.planner_agent.agent import PlannerAgent
from agents.prediction_agent.agent import PredictionAgent
from agents.report_agent.agent import ReportAgent
from api.schemas import (
    HealthStatus,
    InputType,
    PipelineRequest,
    PipelineResponse,
    RiskLevel,
    RoutingDecision,
    SensorReading,
    WorkflowType,
)
from database.database.postgres import get_db_session
from models.registry import ModelRegistry
from services.db_repository import create_logbook_entry as db_create_logbook
from services.equipment_context import equipment_context

logger = logging.getLogger(__name__)


async def _persist_logbook(
    equipment_id: str,
    event_type: str,
    diagnosis: str | None = None,
    recommendation: str | None = None,
    root_cause: str | None = None,
    action_taken: str | None = None,
    metadata: dict | None = None,
):
    async with get_db_session() as db:
        return await db_create_logbook(
            db, equipment_id, event_type,
            diagnosis=diagnosis, recommendation=recommendation,
            root_cause=root_cause, action_taken=action_taken, metadata=metadata,
        )


async def _get_ctx(equipment_id: str):
    async with get_db_session() as db:
        ctx = await equipment_context.get_from_db(equipment_id, db)
        if ctx:
            return ctx
    return equipment_context.get(equipment_id)


class SupervisorOrchestrator:
    """Orchestrates agentic maintenance workflows with dynamic agent selection."""

    def __init__(self, registry: ModelRegistry):
        self.registry = registry
        self.planner = PlannerAgent()
        self.diagnosis = DiagnosisAgent(registry)
        self.prediction = PredictionAgent(registry)
        self.maintenance = MaintenanceAgent(registry)
        self.inventory = InventoryAgent(registry)
        self.knowledge = KnowledgeAgent()
        self.report = ReportAgent()

    async def run_workflow(
        self,
        request: PipelineRequest,
        routing: RoutingDecision,
        query: str = "",
    ) -> dict[str, Any]:
        plan = await self.planner.create_plan(request, routing.workflow, routing.detected_type)
        logger.info("Planner: workflow=%s steps=%d", routing.workflow.value, len(plan["steps"]))
        agents_needed = set(routing.agents)

        result: dict[str, Any] = {"plan": plan, "workflow": routing.workflow.value}
        ctx = await _get_ctx(request.equipment_id)

        if routing.workflow == WorkflowType.KNOWLEDGE_QUERY:
            q = query or f"maintenance guidance for {request.equipment_id}"
            knowledge = await self.knowledge.retrieve(q, equipment_id=request.equipment_id)
            result["knowledge"] = knowledge.model_dump()
            if "diagnosis" in agents_needed and ctx:
                sensor = _sensor_from_context(ctx.latest_sensors, request.sensor_data)
                rca = await self.diagnosis.analyze_root_cause(
                    request.equipment_id, "bearing_failure", sensor, ctx.equipment.anomaly_score
                )
                result["rca"] = rca.model_dump()
            entry = await _persist_logbook(
                request.equipment_id, "knowledge_query",
                diagnosis=q, recommendation=knowledge.technical_guidance[:200],
            )
            result["logbook_entry_id"] = entry.id
            return result

        if routing.workflow == WorkflowType.INVENTORY_CHECK:
            procurement = await self.inventory.forecast(request.equipment_id)
            risk_level = ctx.equipment.risk_level if ctx else RiskLevel.MEDIUM
            health = ctx.equipment.health_status if ctx else HealthStatus.WARNING
            maintenance = await self.maintenance.optimize(
                request.equipment_id, risk_level,
                (ctx.equipment.rul_days * 24 if ctx else 168), health,
            )
            result["procurement"] = procurement.model_dump()
            result["maintenance"] = maintenance.model_dump()
            entry = await _persist_logbook(
                request.equipment_id, "inventory_check",
                recommendation=str(procurement.procurement_recommendations[:2]),
            )
            result["logbook_entry_id"] = entry.id
            return result

        if routing.workflow == WorkflowType.SENSOR_DIAGNOSIS:
            pipeline = await self._run_sensor_pipeline(request)
            entry = await _persist_logbook(
                request.equipment_id, "sensor_diagnosis",
                diagnosis=f"Health: {pipeline.anomaly.health_status.value}, score={pipeline.anomaly.unified_anomaly_score:.2f}",
                recommendation=pipeline.maintenance.recommended_action.value,
                root_cause=pipeline.rca.root_cause,
            )
            result.update(pipeline.model_dump())
            result["logbook_entry_id"] = entry.id
            return result

        pipeline = await self.run_full_pipeline(request)
        entry = await _persist_logbook(
            request.equipment_id, "full_incident",
            diagnosis=f"{pipeline.failure.failure_type.value} detected",
            recommendation=pipeline.maintenance.recommended_action.value,
            root_cause=pipeline.rca.root_cause,
            metadata={"risk": pipeline.risk.risk_level.value, "rul_days": pipeline.rul.rul_days},
        )
        result.update(pipeline.model_dump())
        result["logbook_entry_id"] = entry.id
        return result

    async def run_full_pipeline(self, request: PipelineRequest) -> PipelineResponse:
        logger.info("Supervisor: Starting full pipeline for %s", request.equipment_id)

        anomaly = await self.diagnosis.detect_anomaly(
            request.equipment_id, request.sensor_data, request.sensor_sequence
        )
        failure = await self.prediction.classify_failure(
            request.equipment_id, request.sensor_data, anomaly.unified_anomaly_score
        )
        rca = await self.diagnosis.analyze_root_cause(
            request.equipment_id, failure.failure_type, request.sensor_data, anomaly.unified_anomaly_score
        )
        sequence = request.sensor_sequence or [request.sensor_data]
        rul = await self.prediction.predict_rul(request.equipment_id, sequence, request.equipment_age_days)
        risk = await self.prediction.assess_risk(
            request.equipment_id, anomaly.unified_anomaly_score,
            failure.failure_type, rca.root_cause, rul.rul_hours,
            request.equipment_age_days, request.downtime_cost_per_hour,
        )
        maintenance = await self.maintenance.optimize(
            request.equipment_id, risk.risk_level, rul.rul_hours, anomaly.health_status
        )
        procurement = await self.inventory.forecast(
            request.equipment_id,
            [{"failure_type": failure.failure_type.value, "confidence": failure.confidence}],
            {request.equipment_id: risk.risk_level},
        )
        knowledge = await self.knowledge.retrieve(
            f"{failure.failure_type.value} {rca.root_cause} {request.equipment_id}",
            equipment_id=request.equipment_id,
        )
        executive_summary = await self.report.generate_executive_summary(
            request.equipment_id, anomaly, failure, rca, rul, risk, maintenance
        )
        equipment_context.update_health(
            request.equipment_id, anomaly.health_status, anomaly.unified_anomaly_score, rul.rul_days
        )
        return PipelineResponse(
            equipment_id=request.equipment_id,
            anomaly=anomaly, failure=failure, rca=rca, rul=rul, risk=risk,
            maintenance=maintenance, procurement=procurement, knowledge=knowledge,
            executive_summary=executive_summary, timestamp=datetime.now(timezone.utc),
        )

    async def _run_sensor_pipeline(self, request: PipelineRequest) -> PipelineResponse:
        anomaly = await self.diagnosis.detect_anomaly(
            request.equipment_id, request.sensor_data, request.sensor_sequence
        )
        failure = await self.prediction.classify_failure(
            request.equipment_id, request.sensor_data, anomaly.unified_anomaly_score
        )
        rca = await self.diagnosis.analyze_root_cause(
            request.equipment_id, failure.failure_type, request.sensor_data, anomaly.unified_anomaly_score
        )
        sequence = request.sensor_sequence or [request.sensor_data]
        rul = await self.prediction.predict_rul(request.equipment_id, sequence, request.equipment_age_days)
        risk = await self.prediction.assess_risk(
            request.equipment_id, anomaly.unified_anomaly_score,
            failure.failure_type, rca.root_cause, rul.rul_hours,
            request.equipment_age_days, request.downtime_cost_per_hour,
        )
        maintenance = await self.maintenance.optimize(
            request.equipment_id, risk.risk_level, rul.rul_hours, anomaly.health_status
        )
        procurement = await self.inventory.forecast(
            request.equipment_id,
            [{"failure_type": failure.failure_type.value, "confidence": failure.confidence}],
            {request.equipment_id: risk.risk_level},
        )
        executive_summary = await self.report.generate_executive_summary(
            request.equipment_id, anomaly, failure, rca, rul, risk, maintenance
        )
        return PipelineResponse(
            equipment_id=request.equipment_id,
            anomaly=anomaly, failure=failure, rca=rca, rul=rul, risk=risk,
            maintenance=maintenance, procurement=procurement, knowledge=None,
            executive_summary=executive_summary, timestamp=datetime.now(timezone.utc),
        )


def _sensor_from_context(latest: dict[str, float], fallback: SensorReading) -> SensorReading:
    if not latest:
        return fallback
    return SensorReading(
        temperature=latest.get("temperature", fallback.temperature),
        vibration=latest.get("vibration", fallback.vibration),
        pressure=latest.get("pressure", fallback.pressure),
        current=latest.get("current", fallback.current),
        rpm=latest.get("rpm", fallback.rpm),
        flow_rate=latest.get("flow_rate", fallback.flow_rate),
    )


def _extract_query(routing: RoutingDecision, request: PipelineRequest) -> str:
    if isinstance(request.sensor_data, SensorReading):
        pass
    return f"{routing.detected_type.value} query for {request.equipment_id}"
