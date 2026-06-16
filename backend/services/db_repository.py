"""PostgreSQL repository – persistence layer replacing in-memory data_store operations."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import delete, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import (
    AdminUser,
    EquipmentCreate,
    EquipmentInfo,
    EquipmentUpdate,
    FeedbackCreate,
    FeedbackEntry,
    FeedbackUpdate,
    LogbookCreate,
    LogbookEntry as LogbookEntrySchema,
    LogbookUpdate,
)
from database.database.models import (
    AdminSetting,
    AdminUser as AdminUserModel,
    Alert,
    AlertHistory,
    AuditLog,
    Equipment,
    FailurePrediction,
    FeedbackEntry as FeedbackEntryModel,
    IngestRecord,
    KnowledgeDocument,
    LogbookEntry,
    ReportRecord,
)
from services.db_data import _parse_risk, _risk_to_health, _to_alert_info, _to_equipment_info, _latest_predictions


def _new_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:8].upper()}"


# ── Equipment ──────────────────────────────────────────────────────────────

async def create_equipment(db: AsyncSession, body: EquipmentCreate) -> EquipmentInfo:
    row = Equipment(
        id=body.id, name=body.name, type=body.type, location=body.location,
        criticality=body.criticality, manufacturer=body.manufacturer,
        status="active", age_days=0,
    )
    db.add(row)
    await db.flush()
    return _to_equipment_info(row, None)


async def update_equipment(db: AsyncSession, equipment_id: str, body: EquipmentUpdate) -> EquipmentInfo | None:
    row = await db.get(Equipment, equipment_id)
    if not row:
        return None
    if body.name is not None:
        row.name = body.name
    if body.type is not None:
        row.type = body.type
    if body.location is not None:
        row.location = body.location
    if body.criticality is not None:
        row.criticality = body.criticality
    if body.manufacturer is not None:
        row.manufacturer = body.manufacturer
    preds = await _latest_predictions(db)
    return _to_equipment_info(row, preds.get(equipment_id))


async def delete_equipment(db: AsyncSession, equipment_id: str) -> bool:
    row = await db.get(Equipment, equipment_id)
    if not row:
        return False
    await db.delete(row)
    return True


async def get_equipment_predictions(db: AsyncSession, equipment_id: str) -> dict | None:
    preds = await _latest_predictions(db)
    pred = preds.get(equipment_id)
    row = await db.get(Equipment, equipment_id)
    if not row:
        return None
    info = _to_equipment_info(row, pred)
    return {
        "equipment_id": equipment_id,
        "rul_days": info.rul_days,
        "anomaly_score": info.anomaly_score,
        "risk_level": info.risk_level.value,
        "health_status": info.health_status.value,
    }


# ── Logbook ────────────────────────────────────────────────────────────────

def _logbook_to_schema(row: LogbookEntry) -> LogbookEntrySchema:
    return LogbookEntrySchema(
        id=row.id,
        equipment_id=row.equipment_id,
        event_type=row.event_type,
        diagnosis=row.diagnosis,
        recommendation=row.recommendation,
        root_cause=row.root_cause,
        action_taken=row.action_taken,
        created_at=row.created_at,
        metadata=row.extra_metadata or {},
    )


async def list_logbook(db: AsyncSession, equipment_id: str | None = None, limit: int = 50) -> list[LogbookEntrySchema]:
    q = select(LogbookEntry).order_by(desc(LogbookEntry.created_at)).limit(limit)
    if equipment_id:
        q = q.where(LogbookEntry.equipment_id == equipment_id)
    result = await db.execute(q)
    return [_logbook_to_schema(r) for r in result.scalars().all()]


async def get_logbook_entry(db: AsyncSession, entry_id: str) -> LogbookEntrySchema | None:
    row = await db.get(LogbookEntry, entry_id)
    return _logbook_to_schema(row) if row else None


async def create_logbook_entry(
    db: AsyncSession,
    equipment_id: str,
    event_type: str,
    diagnosis: str | None = None,
    recommendation: str | None = None,
    root_cause: str | None = None,
    action_taken: str | None = None,
    metadata: dict | None = None,
) -> LogbookEntrySchema:
    row = LogbookEntry(
        id=_new_id("LOG"),
        equipment_id=equipment_id,
        event_type=event_type,
        diagnosis=diagnosis,
        recommendation=recommendation,
        root_cause=root_cause,
        action_taken=action_taken,
        extra_metadata=metadata or {},
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    await db.flush()
    return _logbook_to_schema(row)


async def update_logbook_entry(db: AsyncSession, entry_id: str, body: LogbookUpdate) -> LogbookEntrySchema | None:
    row = await db.get(LogbookEntry, entry_id)
    if not row:
        return None
    if body.event_type is not None:
        row.event_type = body.event_type
    if body.diagnosis is not None:
        row.diagnosis = body.diagnosis
    if body.recommendation is not None:
        row.recommendation = body.recommendation
    if body.root_cause is not None:
        row.root_cause = body.root_cause
    if body.action_taken is not None:
        row.action_taken = body.action_taken
    if body.metadata is not None:
        row.extra_metadata = body.metadata
    return _logbook_to_schema(row)


async def delete_logbook_entry(db: AsyncSession, entry_id: str) -> bool:
    row = await db.get(LogbookEntry, entry_id)
    if not row:
        return False
    await db.delete(row)
    return True


# ── Feedback ───────────────────────────────────────────────────────────────

def _feedback_to_schema(row: FeedbackEntryModel) -> FeedbackEntry:
    return FeedbackEntry(
        id=row.id,
        equipment_id=row.equipment_id,
        recommendation_correct=row.recommendation_correct,
        actual_root_cause=row.actual_root_cause,
        repair_outcome=row.repair_outcome,
        notes=row.notes,
        created_at=row.created_at,
    )


async def list_feedback(db: AsyncSession, equipment_id: str | None = None) -> list[FeedbackEntry]:
    q = select(FeedbackEntryModel).order_by(desc(FeedbackEntryModel.created_at))
    if equipment_id:
        q = q.where(FeedbackEntryModel.equipment_id == equipment_id)
    result = await db.execute(q)
    return [_feedback_to_schema(r) for r in result.scalars().all()]


async def create_feedback(db: AsyncSession, body: FeedbackCreate) -> FeedbackEntry:
    row = FeedbackEntryModel(
        id=_new_id("FB"),
        equipment_id=body.equipment_id,
        recommendation_correct=body.recommendation_correct,
        actual_root_cause=body.actual_root_cause,
        repair_outcome=body.repair_outcome,
        notes=body.notes,
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    await db.flush()
    return _feedback_to_schema(row)


async def update_feedback(db: AsyncSession, feedback_id: str, body: FeedbackUpdate) -> FeedbackEntry | None:
    row = await db.get(FeedbackEntryModel, feedback_id)
    if not row:
        return None
    if body.recommendation_correct is not None:
        row.recommendation_correct = body.recommendation_correct
    if body.actual_root_cause is not None:
        row.actual_root_cause = body.actual_root_cause
    if body.repair_outcome is not None:
        row.repair_outcome = body.repair_outcome
    if body.notes is not None:
        row.notes = body.notes
    return _feedback_to_schema(row)


async def delete_feedback(db: AsyncSession, feedback_id: str) -> bool:
    row = await db.get(FeedbackEntryModel, feedback_id)
    if not row:
        return False
    await db.delete(row)
    return True


# ── Ingest ─────────────────────────────────────────────────────────────────

async def list_ingest_history(db: AsyncSession, limit: int = 50) -> list[dict]:
    result = await db.execute(select(IngestRecord).order_by(desc(IngestRecord.created_at)).limit(limit))
    return [
        {
            "id": r.id, "input_type": r.input_type, "equipment_id": r.equipment_id,
            "payload_summary": r.payload_summary, "routing": r.routing or {},
            "status": r.status, "created_at": r.created_at,
        }
        for r in result.scalars().all()
    ]


async def get_ingest_record(db: AsyncSession, ingest_id: str) -> dict | None:
    row = await db.get(IngestRecord, ingest_id)
    if not row:
        return None
    return {
        "id": row.id, "input_type": row.input_type, "equipment_id": row.equipment_id,
        "payload_summary": row.payload_summary, "routing": row.routing or {},
        "status": row.status, "created_at": row.created_at,
    }


async def create_ingest_record(
    db: AsyncSession,
    input_type: str,
    equipment_id: str | None,
    payload_summary: str,
    routing: dict | None = None,
    status: str = "completed",
) -> dict:
    row = IngestRecord(
        id=_new_id("ING"),
        input_type=input_type,
        equipment_id=equipment_id,
        payload_summary=payload_summary[:500],
        routing=routing or {},
        status=status,
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    await db.flush()
    return await get_ingest_record(db, row.id)  # type: ignore[return-value]


async def delete_ingest_record(db: AsyncSession, ingest_id: str) -> bool:
    row = await db.get(IngestRecord, ingest_id)
    if not row:
        return False
    await db.delete(row)
    return True


# ── Knowledge ──────────────────────────────────────────────────────────────

async def list_knowledge_documents(db: AsyncSession, doc_type: str | None = None) -> list[dict]:
    q = select(KnowledgeDocument).order_by(desc(KnowledgeDocument.created_at))
    if doc_type:
        q = q.where(KnowledgeDocument.doc_type == doc_type)
    result = await db.execute(q)
    return [
        {
            "id": r.id, "filename": r.filename, "doc_type": r.doc_type,
            "equipment_id": r.equipment_id, "size_bytes": r.size_bytes,
            "indexed": r.indexed, "created_at": r.created_at,
        }
        for r in result.scalars().all()
    ]


async def get_knowledge_document(db: AsyncSession, doc_id: str) -> dict | None:
    row = await db.get(KnowledgeDocument, doc_id)
    if not row:
        return None
    return {
        "id": row.id, "filename": row.filename, "doc_type": row.doc_type,
        "equipment_id": row.equipment_id, "size_bytes": row.size_bytes,
        "indexed": row.indexed, "created_at": row.created_at,
    }


async def create_knowledge_document(
    db: AsyncSession, filename: str, doc_type: str, equipment_id: str | None, size_bytes: int,
) -> dict:
    row = KnowledgeDocument(
        id=_new_id("DOC"),
        filename=filename,
        doc_type=doc_type,
        equipment_id=equipment_id,
        size_bytes=size_bytes,
        indexed=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    await db.flush()
    return await get_knowledge_document(db, row.id)  # type: ignore[return-value]


async def delete_knowledge_document(db: AsyncSession, doc_id: str) -> bool:
    row = await db.get(KnowledgeDocument, doc_id)
    if not row:
        return False
    await db.delete(row)
    return True


async def reindex_knowledge_documents(db: AsyncSession) -> int:
    result = await db.execute(select(KnowledgeDocument))
    rows = result.scalars().all()
    for row in rows:
        row.indexed = True
    return len(rows)


# ── Reports ────────────────────────────────────────────────────────────────

async def list_reports(
    db: AsyncSession, equipment_id: str | None = None, report_type: str | None = None,
) -> list[dict]:
    q = select(ReportRecord).order_by(desc(ReportRecord.created_at))
    if equipment_id:
        q = q.where(ReportRecord.equipment_id == equipment_id)
    if report_type:
        q = q.where(ReportRecord.report_type == report_type)
    result = await db.execute(q)
    return [
        {
            "id": r.id, "equipment_id": r.equipment_id, "report_type": r.report_type,
            "content": r.content, "created_at": r.created_at,
        }
        for r in result.scalars().all()
    ]


async def get_report(db: AsyncSession, report_id: str) -> dict | None:
    row = await db.get(ReportRecord, report_id)
    if not row:
        return None
    return {
        "id": row.id, "equipment_id": row.equipment_id, "report_type": row.report_type,
        "content": row.content, "created_at": row.created_at,
    }


async def create_report(db: AsyncSession, equipment_id: str, report_type: str, content: str) -> dict:
    row = ReportRecord(
        id=_new_id("RPT"),
        equipment_id=equipment_id,
        report_type=report_type,
        content=content,
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    await db.flush()
    return await get_report(db, row.id)  # type: ignore[return-value]


async def delete_report(db: AsyncSession, report_id: str) -> bool:
    row = await db.get(ReportRecord, report_id)
    if not row:
        return False
    await db.delete(row)
    return True


# ── Alerts ─────────────────────────────────────────────────────────────────

async def get_alert_by_id(db: AsyncSession, alert_id: str):
    row = await db.get(Alert, alert_id)
    return _to_alert_info(row) if row else None


async def acknowledge_alert_db(db: AsyncSession, alert_id: str) -> bool:
    row = await db.get(Alert, alert_id)
    if not row:
        return False
    row.acknowledged = True
    return True


async def record_alert_action(
    db: AsyncSession,
    alert_id: str,
    action: str,
    user: str,
    assignee: str | None = None,
    notes: str | None = None,
    work_order_id: str | None = None,
) -> dict:
    row = AlertHistory(
        id=_new_id("AH"),
        alert_id=alert_id,
        action=action,
        user=user,
        assignee=assignee,
        notes=notes,
        work_order_id=work_order_id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    await db.flush()
    return {
        "id": row.id, "alert_id": alert_id, "action": action, "user": user,
        "assignee": assignee, "notes": notes, "work_order_id": work_order_id,
        "timestamp": row.created_at,
    }


async def list_alert_history(db: AsyncSession, limit: int = 50) -> list[dict]:
    result = await db.execute(select(AlertHistory).order_by(desc(AlertHistory.created_at)).limit(limit))
    return [
        {
            "id": r.id, "alert_id": r.alert_id, "action": r.action, "user": r.user,
            "assignee": r.assignee, "notes": r.notes, "work_order_id": r.work_order_id,
            "timestamp": r.created_at,
        }
        for r in result.scalars().all()
    ]


# ── Admin ──────────────────────────────────────────────────────────────────

async def list_admin_users(db: AsyncSession) -> list[AdminUser]:
    result = await db.execute(select(AdminUserModel).order_by(AdminUserModel.created_at))
    return [
        AdminUser(
            id=r.id, email=r.email, name=r.name, role_id=r.role_id,
            enabled=r.enabled, created_at=r.created_at,
        )
        for r in result.scalars().all()
    ]


async def create_admin_user(db: AsyncSession, email: str, name: str, role_id: str) -> AdminUser:
    row = AdminUserModel(
        id=_new_id("USR"),
        email=email,
        name=name,
        role_id=role_id,
        enabled=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    await db.flush()
    return AdminUser(
        id=row.id, email=row.email, name=row.name, role_id=row.role_id,
        enabled=row.enabled, created_at=row.created_at,
    )


async def update_admin_user(db: AsyncSession, user_id: str, **kwargs) -> AdminUser | None:
    row = await db.get(AdminUserModel, user_id)
    if not row:
        return None
    for k, v in kwargs.items():
        if v is not None and hasattr(row, k):
            setattr(row, k, v)
    return AdminUser(
        id=row.id, email=row.email, name=row.name, role_id=row.role_id,
        enabled=row.enabled, created_at=row.created_at,
    )


async def delete_admin_user(db: AsyncSession, user_id: str) -> bool:
    row = await db.get(AdminUserModel, user_id)
    if not row:
        return False
    await db.delete(row)
    return True


async def list_audit_logs(db: AsyncSession, limit: int = 100) -> list[dict]:
    result = await db.execute(select(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit))
    return [
        {"id": r.id, "action": r.action, "user": r.user, "resource": r.resource, "timestamp": r.created_at}
        for r in result.scalars().all()
    ]


async def create_audit_log(db: AsyncSession, action: str, user: str, resource: str) -> dict:
    row = AuditLog(
        id=_new_id("AUD"),
        action=action,
        user=user,
        resource=resource,
        created_at=datetime.now(timezone.utc),
    )
    db.add(row)
    await db.flush()
    return {"id": row.id, "action": action, "user": user, "resource": resource, "timestamp": row.created_at}


async def get_admin_settings(db: AsyncSession) -> dict:
    result = await db.execute(select(AdminSetting))
    rows = result.scalars().all()
    if not rows:
        return {}
    settings = {}
    for row in rows:
        try:
            settings[row.key] = json.loads(row.value)
        except (json.JSONDecodeError, TypeError):
            settings[row.key] = row.value
    return settings


async def upsert_admin_settings(db: AsyncSession, settings: dict) -> dict:
    for key, value in settings.items():
        stored = json.dumps(value) if not isinstance(value, str) else value
        row = await db.get(AdminSetting, key)
        if row:
            row.value = stored
        else:
            db.add(AdminSetting(key=key, value=stored))
    await db.flush()
    return await get_admin_settings(db)


async def count_admin_users(db: AsyncSession) -> tuple[int, int]:
    result = await db.execute(select(AdminUserModel))
    users = result.scalars().all()
    return len(users), sum(1 for u in users if u.enabled)


async def count_audit_logs_24h(db: AsyncSession) -> int:
    since = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.count()).select_from(AuditLog).where(AuditLog.created_at >= since)
    )
    return result.scalar() or 0
