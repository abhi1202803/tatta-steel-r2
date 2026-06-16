"""Report generation, storage, and export API."""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from agents.report_agent.agent import ReportAgent
from agents.supervisor_agent.orchestrator import SupervisorOrchestrator
from api.dependencies import get_registry
from api.dependencies.database import get_db
from api.schemas import PipelineRequest, SensorReading
from models.registry import ModelRegistry
from services import db_repository as repo
from services.export_utils import to_csv, to_docx, to_json, to_pdf, to_xlsx

router = APIRouter()


class ReportRequest(BaseModel):
    equipment_id: str
    report_type: str = "executive_summary"


class ReportResponse(BaseModel):
    equipment_id: str
    report_type: str
    content: str
    id: str | None = None


async def _get_report_content(db: AsyncSession, report_id: str | None = None) -> tuple[str, str]:
    if report_id:
        report = await repo.get_report(db, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report["report_type"], report["content"]
    reports = await repo.list_reports(db)
    if reports:
        r = reports[0]
        return r["report_type"], r["content"]
    return "Report", "No reports generated yet."


@router.get("/reports/export/pdf")
async def export_report_pdf(report_id: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    title, content = await _get_report_content(db, report_id)
    data = to_pdf(title, content)
    return Response(content=data, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={title}.pdf"})


@router.get("/reports/export/docx")
async def export_report_docx(report_id: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    title, content = await _get_report_content(db, report_id)
    data = to_docx(title, content)
    return Response(content=data, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", headers={"Content-Disposition": f"attachment; filename={title}.docx"})


@router.get("/reports/export/xlsx")
async def export_report_xlsx(db: AsyncSession = Depends(get_db)):
    rows = await repo.list_reports(db)
    data = to_xlsx(rows, "Reports")
    return Response(content=data, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=reports.xlsx"})


@router.get("/reports/export/csv")
async def export_report_csv(db: AsyncSession = Depends(get_db)):
    rows = await repo.list_reports(db)
    data = to_csv(rows)
    return Response(content=data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=reports.csv"})


@router.get("/reports/export/json")
async def export_report_json(report_id: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    if report_id:
        report = await repo.get_report(db, report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        data = to_json(report)
        return Response(content=data, media_type="application/json", headers={"Content-Disposition": f"attachment; filename={report_id}.json"})
    reports = await repo.list_reports(db)
    data = to_json(reports)
    return Response(content=data, media_type="application/json", headers={"Content-Disposition": "attachment; filename=reports.json"})


@router.post("/reports/generate", response_model=ReportResponse)
async def generate_report(request: ReportRequest, registry: ModelRegistry = Depends(get_registry), db: AsyncSession = Depends(get_db)):
    orchestrator = SupervisorOrchestrator(registry)
    demo_sensor = SensorReading(
        temperature=75.0, vibration=7.5, pressure=8.0,
        current=22.0, rpm=1350.0, flow_rate=35.0,
    )
    pipeline = await orchestrator.run_full_pipeline(
        PipelineRequest(equipment_id=request.equipment_id, sensor_data=demo_sensor)
    )

    agent = ReportAgent()
    content = await agent.generate_executive_summary(
        request.equipment_id,
        pipeline.anomaly,
        pipeline.failure,
        pipeline.rca,
        pipeline.rul,
        pipeline.risk,
        pipeline.maintenance,
    )
    stored = await repo.create_report(db, request.equipment_id, request.report_type, content)
    return ReportResponse(
        id=stored["id"],
        equipment_id=request.equipment_id,
        report_type=request.report_type,
        content=content,
    )


@router.get("/reports")
async def list_reports(equipment_id: str | None = None, report_type: str | None = None, db: AsyncSession = Depends(get_db)):
    return await repo.list_reports(db, equipment_id, report_type)


@router.get("/reports/{report_id}")
async def get_report(report_id: str, db: AsyncSession = Depends(get_db)):
    report = await repo.get_report(db, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.delete("/reports/{report_id}")
async def delete_report(report_id: str, db: AsyncSession = Depends(get_db)):
    if not await repo.delete_report(db, report_id):
        raise HTTPException(status_code=404, detail="Report not found")
    return {"deleted": report_id}
