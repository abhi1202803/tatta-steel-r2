"""Feedback learning API with full CRUD."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies.database import get_db
from api.schemas import FeedbackCreate, FeedbackEntry, FeedbackUpdate
from services import db_repository as repo

router = APIRouter()


@router.get("/feedback", response_model=list[FeedbackEntry])
async def list_feedback(equipment_id: str | None = None, db: AsyncSession = Depends(get_db)):
    return await repo.list_feedback(db, equipment_id)


@router.get("/feedback/{equipment_id}", response_model=list[FeedbackEntry])
async def list_feedback_by_equipment(equipment_id: str, db: AsyncSession = Depends(get_db)):
    return await repo.list_feedback(db, equipment_id)


@router.post("/feedback", response_model=FeedbackEntry)
async def submit_feedback(body: FeedbackCreate, db: AsyncSession = Depends(get_db)):
    entry = await repo.create_feedback(db, body)
    await repo.create_audit_log(db, "feedback.create", "System", entry.id)
    return entry


@router.put("/feedback/{feedback_id}", response_model=FeedbackEntry)
async def update_feedback(feedback_id: str, body: FeedbackUpdate, db: AsyncSession = Depends(get_db)):
    entry = await repo.update_feedback(db, feedback_id, body)
    if not entry:
        raise HTTPException(status_code=404, detail="Feedback not found")
    await repo.create_audit_log(db, "feedback.update", "System", feedback_id)
    return entry


@router.delete("/feedback/{feedback_id}")
async def delete_feedback(feedback_id: str, db: AsyncSession = Depends(get_db)):
    if not await repo.delete_feedback(db, feedback_id):
        raise HTTPException(status_code=404, detail="Feedback not found")
    await repo.create_audit_log(db, "feedback.delete", "System", feedback_id)
    return {"deleted": feedback_id}
