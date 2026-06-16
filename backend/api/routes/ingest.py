"""Unified multi-modal ingest API with specialized input routes."""

import json
from typing import Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from agents.router_agent.agent import InputRouterAgent
from agents.supervisor_agent.orchestrator import SupervisorOrchestrator
from api.dependencies import get_registry
from api.dependencies.database import get_db
from api.schemas import IngestRequest, IngestResponse, InputType, PipelineRequest, SensorReading
from models.registry import ModelRegistry
from services import db_repository as repo
from services.db_data import fetch_equipment_list
from services.equipment_context import equipment_context

router = APIRouter()

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".csv", ".xlsx", ".json"}


def _get_sensor_reading(payload, equipment_id: str) -> SensorReading:
    if isinstance(payload, dict):
        if "sensor_data" in payload:
            return SensorReading(**payload["sensor_data"])
        if "readings" in payload and payload["readings"]:
            return SensorReading(**payload["readings"][-1])
        keys = {"temperature", "vibration", "pressure", "current", "rpm"}
        if keys.intersection(payload.keys()):
            return SensorReading(
                temperature=float(payload.get("temperature", 45)),
                vibration=float(payload.get("vibration", 2.5)),
                pressure=float(payload.get("pressure", 5)),
                current=float(payload.get("current", 12)),
                rpm=float(payload.get("rpm", 1500)),
                flow_rate=payload.get("flow_rate"),
            )
    ctx = equipment_context.get(equipment_id)
    if ctx and ctx.latest_sensors:
        s = ctx.latest_sensors
        return SensorReading(
            temperature=s.get("temperature", 45), vibration=s.get("vibration", 2.5),
            pressure=s.get("pressure", 5), current=s.get("current", 12),
            rpm=s.get("rpm", 1500), flow_rate=s.get("flow_rate"),
        )
    return SensorReading(temperature=45, vibration=2.5, pressure=5, current=12, rpm=1500)


def _payload_query(request: IngestRequest) -> str:
    if isinstance(request.payload, str):
        return request.payload
    if isinstance(request.payload, dict):
        return str(request.payload.get("query") or request.payload.get("message") or request.payload.get("text") or "")
    return ""


def _payload_summary(payload: Any) -> str:
    if isinstance(payload, str):
        return payload[:500]
    if isinstance(payload, dict):
        return json.dumps(payload)[:500]
    return str(payload)[:500]


async def _resolve_ctx(equipment_id: str, db: AsyncSession):
    ctx = await equipment_context.get_from_db(equipment_id, db)
    if ctx:
        return ctx
    items = await fetch_equipment_list(db)
    if items:
        return await equipment_context.get_from_db(items[0].id, db)
    return equipment_context.get(equipment_id)


async def _run_ingest(request: IngestRequest, registry: ModelRegistry, db: AsyncSession) -> IngestResponse:
    router_agent = InputRouterAgent()
    routing = router_agent.route(request)
    ctx = await _resolve_ctx(routing.equipment_id, db)

    sensor = _get_sensor_reading(request.payload, routing.equipment_id)
    downtime = ctx.downtime_cost_per_hour if ctx else 5000.0

    orchestrator = SupervisorOrchestrator(registry)
    pipeline_req = PipelineRequest(
        equipment_id=routing.equipment_id,
        sensor_data=sensor,
        downtime_cost_per_hour=downtime,
    )
    result = await orchestrator.run_workflow(pipeline_req, routing, query=_payload_query(request))

    record = await repo.create_ingest_record(
        db,
        input_type=routing.detected_type.value,
        equipment_id=routing.equipment_id,
        payload_summary=_payload_summary(request.payload),
        routing=routing.model_dump(),
    )
    await repo.create_audit_log(db, "ingest", "System", record["id"])

    return IngestResponse(
        routing=routing,
        equipment_context=ctx,
        result=result,
        logbook_entry_id=result.get("logbook_entry_id"),
    )


async def _typed_ingest(
    input_type: InputType,
    payload: Any,
    equipment_id: str | None,
    registry: ModelRegistry,
    db: AsyncSession,
) -> IngestResponse:
    request = IngestRequest(input_type=input_type, payload=payload, equipment_id=equipment_id)
    return await _run_ingest(request, registry, db)


@router.post("/ingest", response_model=IngestResponse)
async def ingest(request: IngestRequest, registry: ModelRegistry = Depends(get_registry), db: AsyncSession = Depends(get_db)):
    return await _run_ingest(request, registry, db)


@router.post("/ingest/sensor", response_model=IngestResponse)
@router.post("/ingest/sensor-data", response_model=IngestResponse)
async def ingest_sensor(request: IngestRequest, registry: ModelRegistry = Depends(get_registry), db: AsyncSession = Depends(get_db)):
    request.input_type = InputType.SENSOR
    return await _run_ingest(request, registry, db)


@router.post("/ingest/query", response_model=IngestResponse)
@router.post("/ingest/manual", response_model=IngestResponse)
async def ingest_manual(request: IngestRequest, registry: ModelRegistry = Depends(get_registry), db: AsyncSession = Depends(get_db)):
    request.input_type = InputType.NATURAL_LANGUAGE
    return await _run_ingest(request, registry, db)


@router.post("/ingest/fault-log", response_model=IngestResponse)
async def ingest_fault_log(request: IngestRequest, registry: ModelRegistry = Depends(get_registry), db: AsyncSession = Depends(get_db)):
    return await _typed_ingest(InputType.FAULT_LOG, request.payload, request.equipment_id, registry, db)


@router.post("/ingest/delay-log", response_model=IngestResponse)
async def ingest_delay_log(request: IngestRequest, registry: ModelRegistry = Depends(get_registry), db: AsyncSession = Depends(get_db)):
    return await _typed_ingest(InputType.DELAY_LOG, request.payload, request.equipment_id, registry, db)


@router.post("/ingest/incident", response_model=IngestResponse)
async def ingest_incident(request: IngestRequest, registry: ModelRegistry = Depends(get_registry), db: AsyncSession = Depends(get_db)):
    return await _typed_ingest(InputType.INCIDENT, request.payload, request.equipment_id, registry, db)


@router.post("/ingest/failure-report", response_model=IngestResponse)
async def ingest_failure_report(request: IngestRequest, registry: ModelRegistry = Depends(get_registry), db: AsyncSession = Depends(get_db)):
    return await _typed_ingest(InputType.FAILURE_REPORT, request.payload, request.equipment_id, registry, db)


@router.post("/ingest/inventory", response_model=IngestResponse)
async def ingest_inventory(request: IngestRequest, registry: ModelRegistry = Depends(get_registry), db: AsyncSession = Depends(get_db)):
    return await _typed_ingest(InputType.INVENTORY, request.payload, request.equipment_id, registry, db)


@router.post("/ingest/sop", response_model=IngestResponse)
async def ingest_sop(request: IngestRequest, registry: ModelRegistry = Depends(get_registry), db: AsyncSession = Depends(get_db)):
    return await _typed_ingest(InputType.SOP, request.payload, request.equipment_id, registry, db)


@router.post("/ingest/pdf", response_model=IngestResponse)
async def ingest_pdf(
    file: UploadFile = File(...),
    equipment_id: str | None = Form(None),
    registry: ModelRegistry = Depends(get_registry),
    db: AsyncSession = Depends(get_db),
):
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if ext and ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    content = await file.read()
    payload = {
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(content),
        "content_preview": content[:2000].decode("utf-8", errors="replace"),
    }
    input_type = InputType.SOP if "sop" in (file.filename or "").lower() else InputType.PDF
    return await _typed_ingest(input_type, payload, equipment_id, registry, db)


@router.get("/ingest/history")
async def ingest_history(limit: int = 50, db: AsyncSession = Depends(get_db)):
    return await repo.list_ingest_history(db, limit)


@router.get("/ingest/{ingest_id}")
async def get_ingest_record(ingest_id: str, db: AsyncSession = Depends(get_db)):
    record = await repo.get_ingest_record(db, ingest_id)
    if not record:
        raise HTTPException(status_code=404, detail="Ingest record not found")
    return record


@router.delete("/ingest/{ingest_id}")
async def delete_ingest_record(ingest_id: str, db: AsyncSession = Depends(get_db)):
    if not await repo.delete_ingest_record(db, ingest_id):
        raise HTTPException(status_code=404, detail="Ingest record not found")
    await repo.create_audit_log(db, "ingest.delete", "System", ingest_id)
    return {"deleted": ingest_id}
