"""Asset (equipment) registry routes backed by Supabase PostgreSQL."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies.database import get_db
from api.schemas import EquipmentContext, EquipmentCreate, EquipmentInfo, EquipmentUpdate
from services import db_repository as repo
from services.db_data import fetch_equipment_alerts, fetch_equipment_list
from database.database.models import Equipment

router = APIRouter()


@router.get("/assets", response_model=list[EquipmentInfo])
async def list_assets(db: AsyncSession = Depends(get_db)):
    return await fetch_equipment_list(db)


@router.get("/assets/{asset_id}", response_model=EquipmentInfo)
async def get_asset(asset_id: str, db: AsyncSession = Depends(get_db)):
    items = await fetch_equipment_list(db)
    for eq in items:
        if eq.id == asset_id:
            return eq
    result = await db.execute(select(Equipment).where(Equipment.id == asset_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found")
    items = await fetch_equipment_list(db)
    for item in items:
        if item.id == asset_id:
            return item
    raise HTTPException(status_code=404, detail=f"Asset {asset_id} not found")


@router.get("/equipment", response_model=list[EquipmentInfo])
async def list_equipment(db: AsyncSession = Depends(get_db)):
    """Backward-compatible alias."""
    return await list_assets(db)


@router.get("/equipment/{equipment_id}", response_model=EquipmentInfo)
async def get_equipment(equipment_id: str, db: AsyncSession = Depends(get_db)):
    """Backward-compatible alias."""
    return await get_asset(equipment_id, db)


@router.get("/equipment/{equipment_id}/context", response_model=EquipmentContext)
async def get_equipment_context(equipment_id: str, db: AsyncSession = Depends(get_db)):
    from services.equipment_context import equipment_context

    ctx = await equipment_context.get_from_db(equipment_id, db)
    if not ctx:
        raise HTTPException(status_code=404, detail=f"Equipment {equipment_id} not found")
    return ctx


@router.post("/equipment", response_model=EquipmentInfo)
async def create_equipment(body: EquipmentCreate, db: AsyncSession = Depends(get_db)):
    if await db.get(Equipment, body.id):
        raise HTTPException(status_code=409, detail="Equipment ID already exists")
    eq = await repo.create_equipment(db, body)
    await repo.create_audit_log(db, "equipment.create", "System", body.id)
    return eq


@router.put("/equipment/{equipment_id}", response_model=EquipmentInfo)
async def update_equipment(equipment_id: str, body: EquipmentUpdate, db: AsyncSession = Depends(get_db)):
    eq = await repo.update_equipment(db, equipment_id, body)
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    await repo.create_audit_log(db, "equipment.update", "System", equipment_id)
    return eq


@router.delete("/equipment/{equipment_id}")
async def delete_equipment(equipment_id: str, db: AsyncSession = Depends(get_db)):
    if not await repo.delete_equipment(db, equipment_id):
        raise HTTPException(status_code=404, detail="Equipment not found")
    await repo.create_audit_log(db, "equipment.delete", "System", equipment_id)
    return {"deleted": equipment_id}


@router.get("/equipment/{equipment_id}/history")
async def get_equipment_history(equipment_id: str, db: AsyncSession = Depends(get_db)):
    entries = await repo.list_logbook(db, equipment_id)
    return {"equipment_id": equipment_id, "history": entries}


@router.get("/equipment/{equipment_id}/predictions")
async def get_equipment_predictions(equipment_id: str, db: AsyncSession = Depends(get_db)):
    predictions = await repo.get_equipment_predictions(db, equipment_id)
    if not predictions:
        raise HTTPException(status_code=404, detail="Equipment not found")
    return predictions


@router.get("/equipment/{equipment_id}/documents")
async def get_equipment_documents(equipment_id: str, db: AsyncSession = Depends(get_db)):
    docs = await repo.list_knowledge_documents(db)
    docs = [d for d in docs if d.get("equipment_id") == equipment_id]
    return {"equipment_id": equipment_id, "documents": docs}


@router.get("/equipment/{equipment_id}/alerts")
async def get_equipment_alerts(equipment_id: str, db: AsyncSession = Depends(get_db)):
    alerts = await fetch_equipment_alerts(db, equipment_id)
    return {"equipment_id": equipment_id, "alerts": alerts}


@router.get("/equipment/{equipment_id}/maintenance")
async def get_equipment_maintenance(equipment_id: str, db: AsyncSession = Depends(get_db)):
    entries = await repo.list_logbook(db, equipment_id)
    entries = [e for e in entries if e.event_type in ("maintenance", "auto_recommendation")]
    feedback = await repo.list_feedback(db, equipment_id)
    return {"equipment_id": equipment_id, "maintenance": entries, "feedback": feedback}
