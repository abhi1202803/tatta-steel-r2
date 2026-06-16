"""Digital maintenance logbook API with export."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies.database import get_db
from api.schemas import LogbookCreate, LogbookEntry, LogbookUpdate
from services import db_repository as repo
from services.export_utils import to_pdf, to_xlsx

router = APIRouter()


@router.get("/logbook/export/pdf")
async def export_logbook_pdf(equipment_id: str | None = None, db: AsyncSession = Depends(get_db)):
    entries = await repo.list_logbook(db, equipment_id)
    lines = [f"{e.created_at} | {e.equipment_id} | {e.event_type} | {e.diagnosis or ''}" for e in entries]
    content = "\n".join(lines) or "No logbook entries."
    data = to_pdf("Maintenance Logbook", content)
    return Response(content=data, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=logbook.pdf"})


@router.get("/logbook/export/xlsx")
async def export_logbook_xlsx(equipment_id: str | None = None, db: AsyncSession = Depends(get_db)):
    entries = await repo.list_logbook(db, equipment_id)
    rows = [
        {
            "id": e.id, "equipment_id": e.equipment_id, "event_type": e.event_type,
            "diagnosis": e.diagnosis, "recommendation": e.recommendation,
            "root_cause": e.root_cause, "created_at": str(e.created_at),
        }
        for e in entries
    ]
    data = to_xlsx(rows, "Logbook")
    return Response(content=data, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=logbook.xlsx"})


@router.get("/logbook", response_model=list[LogbookEntry])
async def list_logbook(equipment_id: str | None = None, limit: int = 50, db: AsyncSession = Depends(get_db)):
    return await repo.list_logbook(db, equipment_id, limit)


@router.get("/logbook/{entry_id}", response_model=LogbookEntry)
async def get_logbook_entry(entry_id: str, db: AsyncSession = Depends(get_db)):
    entry = await repo.get_logbook_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Logbook entry not found")
    return entry


@router.post("/logbook", response_model=LogbookEntry)
async def create_logbook_entry(body: LogbookCreate, db: AsyncSession = Depends(get_db)):
    entry = await repo.create_logbook_entry(
        db, body.equipment_id, body.event_type,
        diagnosis=body.diagnosis, recommendation=body.recommendation,
        root_cause=body.root_cause, action_taken=body.action_taken,
        metadata=body.metadata,
    )
    await repo.create_audit_log(db, "logbook.create", "System", entry.id)
    return entry


@router.put("/logbook/{entry_id}", response_model=LogbookEntry)
async def update_logbook_entry(entry_id: str, body: LogbookUpdate, db: AsyncSession = Depends(get_db)):
    entry = await repo.update_logbook_entry(db, entry_id, body)
    if not entry:
        raise HTTPException(status_code=404, detail="Logbook entry not found")
    await repo.create_audit_log(db, "logbook.update", "System", entry_id)
    return entry


@router.delete("/logbook/{entry_id}")
async def delete_logbook_entry(entry_id: str, db: AsyncSession = Depends(get_db)):
    if not await repo.delete_logbook_entry(db, entry_id):
        raise HTTPException(status_code=404, detail="Logbook entry not found")
    await repo.create_audit_log(db, "logbook.delete", "System", entry_id)
    return {"deleted": entry_id}
