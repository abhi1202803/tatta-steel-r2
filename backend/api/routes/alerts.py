"""Alert routes with action workflows."""

from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies.database import get_db
from api.schemas import AlertActionRequest, AlertInfo, RiskLevel
from services import db_repository as repo
from services.db_data import fetch_alerts

router = APIRouter()


@router.get("/alerts", response_model=list[AlertInfo])
async def list_alerts(db: AsyncSession = Depends(get_db)):
    return await fetch_alerts(db)


@router.get("/alerts/critical", response_model=list[AlertInfo])
async def list_critical_alerts(db: AsyncSession = Depends(get_db)):
    alerts = await fetch_alerts(db)
    return [a for a in alerts if a.severity == RiskLevel.CRITICAL]


@router.get("/alerts/high", response_model=list[AlertInfo])
async def list_high_alerts(db: AsyncSession = Depends(get_db)):
    alerts = await fetch_alerts(db)
    return [a for a in alerts if a.severity == RiskLevel.HIGH]


@router.get("/alerts/history")
async def alert_history(limit: int = 50, db: AsyncSession = Depends(get_db)):
    return await repo.list_alert_history(db, limit)


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, body: AlertActionRequest = AlertActionRequest(), db: AsyncSession = Depends(get_db)):
    if not await repo.acknowledge_alert_db(db, alert_id):
        raise HTTPException(status_code=404, detail="Alert not found")
    await repo.create_audit_log(db, "alert.acknowledge", body.user, alert_id)
    return await repo.record_alert_action(db, alert_id, "acknowledge", body.user, notes=body.notes)


@router.post("/alerts/{alert_id}/assign")
async def assign_alert(alert_id: str, body: AlertActionRequest, db: AsyncSession = Depends(get_db)):
    if not body.assignee:
        raise HTTPException(status_code=400, detail="assignee required")
    if not await repo.get_alert_by_id(db, alert_id):
        raise HTTPException(status_code=404, detail="Alert not found")
    await repo.create_audit_log(db, "alert.assign", body.user, alert_id)
    return await repo.record_alert_action(db, alert_id, "assign", body.user, assignee=body.assignee, notes=body.notes)


@router.post("/alerts/{alert_id}/escalate")
async def escalate_alert(alert_id: str, body: AlertActionRequest = AlertActionRequest(), db: AsyncSession = Depends(get_db)):
    if not await repo.get_alert_by_id(db, alert_id):
        raise HTTPException(status_code=404, detail="Alert not found")
    await repo.create_audit_log(db, "alert.escalate", body.user, alert_id)
    return await repo.record_alert_action(db, alert_id, "escalate", body.user, notes=body.notes)


@router.post("/alerts/{alert_id}/work-order")
async def create_work_order(alert_id: str, body: AlertActionRequest = AlertActionRequest(), db: AsyncSession = Depends(get_db)):
    if not await repo.get_alert_by_id(db, alert_id):
        raise HTTPException(status_code=404, detail="Alert not found")
    wo_id = f"WO-{uuid4().hex[:8].upper()}"
    await repo.create_audit_log(db, "alert.work-order", body.user, alert_id)
    return await repo.record_alert_action(db, alert_id, "work-order", body.user, notes=body.notes, work_order_id=wo_id)


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, body: AlertActionRequest = AlertActionRequest(), db: AsyncSession = Depends(get_db)):
    if not await repo.get_alert_by_id(db, alert_id):
        raise HTTPException(status_code=404, detail="Alert not found")
    await repo.create_audit_log(db, "alert.resolve", body.user, alert_id)
    return await repo.record_alert_action(db, alert_id, "resolve", body.user, notes=body.notes)
