"""Export center API for dashboard, maintenance, alerts, RCA, RUL, and plant health."""

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies.database import get_db
from services import db_repository as repo
from services.db_data import fetch_alerts, fetch_dashboard, fetch_equipment_list
from services.export_utils import to_pdf, to_xlsx

router = APIRouter()


async def _equipment_rows(db: AsyncSession) -> list[dict]:
    items = await fetch_equipment_list(db)
    return [
        {
            "id": e.id, "name": e.name, "type": e.type,
            "health": e.health_status.value, "risk": e.risk_level.value, "rul_days": e.rul_days,
        }
        for e in items
    ]


@router.get("/export/dashboard/pdf")
async def export_dashboard_pdf(db: AsyncSession = Depends(get_db)):
    overview = await fetch_dashboard(db)
    if overview:
        content = (
            f"Plant Health Report\nTotal Equipment: {overview.total_equipment}\n"
            f"Critical: {overview.critical_count}\nActive Alerts: {overview.active_alerts}\n"
            f"Avg RUL: {overview.avg_rul_days} days"
        )
    else:
        content = "Plant Health Report\nNo equipment data available."
    return Response(content=to_pdf("Executive Dashboard", content), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=dashboard.pdf"})


@router.get("/export/dashboard/xlsx")
async def export_dashboard_xlsx(db: AsyncSession = Depends(get_db)):
    rows = await _equipment_rows(db)
    return Response(content=to_xlsx(rows, "Dashboard"), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=dashboard.xlsx"})


@router.get("/export/maintenance/pdf")
async def export_maintenance_pdf(db: AsyncSession = Depends(get_db)):
    entries = await repo.list_logbook(db)
    lines = [
        f"{e.equipment_id} | {e.event_type} | {e.recommendation or e.diagnosis or ''}"
        for e in entries if e.event_type in ("maintenance", "auto_recommendation")
    ]
    content = "\n".join(lines) or "No maintenance records."
    return Response(content=to_pdf("Maintenance Report", content), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=maintenance.pdf"})


@router.get("/export/maintenance/xlsx")
async def export_maintenance_xlsx(db: AsyncSession = Depends(get_db)):
    entries = await repo.list_logbook(db)
    rows = [
        {"equipment_id": e.equipment_id, "event_type": e.event_type, "recommendation": e.recommendation, "root_cause": e.root_cause}
        for e in entries
    ]
    return Response(content=to_xlsx(rows, "Maintenance"), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=maintenance.xlsx"})


@router.get("/export/alerts/pdf")
async def export_alerts_pdf(db: AsyncSession = Depends(get_db)):
    alerts = await fetch_alerts(db)
    lines = [f"{a.severity.value} | {a.equipment_id} | {a.message}" for a in alerts]
    return Response(content=to_pdf("Alert Report", "\n".join(lines)), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=alerts.pdf"})


@router.get("/export/alerts/xlsx")
async def export_alerts_xlsx(db: AsyncSession = Depends(get_db)):
    alerts = await fetch_alerts(db)
    rows = [
        {"id": a.id, "equipment_id": a.equipment_id, "severity": a.severity.value, "message": a.message, "timestamp": str(a.timestamp)}
        for a in alerts
    ]
    return Response(content=to_xlsx(rows, "Alerts"), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=alerts.xlsx"})


@router.get("/export/rca/pdf")
async def export_rca_pdf(db: AsyncSession = Depends(get_db)):
    entries = await repo.list_logbook(db)
    lines = [f"{e.equipment_id} | {e.root_cause or 'Unknown'} | {e.diagnosis or ''}" for e in entries if e.event_type == "diagnosis"]
    content = "\n".join(lines) or "No RCA records."
    return Response(content=to_pdf("RCA Report", content), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=rca.pdf"})


@router.get("/export/rul/pdf")
async def export_rul_pdf(db: AsyncSession = Depends(get_db)):
    rows = await _equipment_rows(db)
    lines = [f"{r['id']} | {r['name']} | RUL: {r['rul_days']} days | Risk: {r['risk']}" for r in rows]
    return Response(content=to_pdf("RUL Report", "\n".join(lines)), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=rul.pdf"})


@router.get("/export/plant-health/pdf")
async def export_plant_health_pdf(db: AsyncSession = Depends(get_db)):
    rows = await _equipment_rows(db)
    critical = [r for r in rows if r["risk"] in ("critical", "high")]
    content = f"Plant Health Summary\nTotal Assets: {len(rows)}\nCritical/High Risk: {len(critical)}\n"
    content += "\n".join(f"- {r['id']}: {r['health']} ({r['risk']})" for r in rows[:20])
    reports = await repo.list_reports(db)
    if reports:
        content += f"\n\nLatest Report: {reports[0]['report_type']}"
    return Response(content=to_pdf("Plant Health Report", content), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=plant-health.pdf"})
