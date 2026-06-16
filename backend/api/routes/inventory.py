"""Inventory and spare-parts forecasting routes."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agents.inventory_agent.agent import InventoryAgent
from api.dependencies import get_registry
from api.dependencies.database import get_db
from api.schemas import ProcurementRequest, ProcurementResponse
from database.database.models import SpareInventory
from models.registry import ModelRegistry

router = APIRouter()


class InventoryItem(BaseModel):
    id: int
    part_name: str | None
    category: str | None
    quantity: int
    reorder_level: int
    unit_cost: float | None


class InventoryCreate(BaseModel):
    part_name: str
    category: str
    quantity: int = 0
    reorder_level: int = 5
    unit_cost: float | None = None


@router.get("/inventory", response_model=list[InventoryItem])
async def list_inventory(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(SpareInventory))
        return [
            InventoryItem(
                id=item.id,
                part_name=item.part_name,
                category=item.category,
                quantity=item.quantity,
                reorder_level=item.reorder_level,
                unit_cost=item.unit_cost,
            )
            for item in result.scalars().all()
        ]
    except Exception:
        return []


@router.post("/inventory", response_model=InventoryItem)
async def create_inventory_item(body: InventoryCreate, db: AsyncSession = Depends(get_db)):
    item = SpareInventory(
        part_name=body.part_name,
        category=body.category,
        quantity=body.quantity,
        reorder_level=body.reorder_level,
        unit_cost=body.unit_cost,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return InventoryItem(
        id=item.id,
        part_name=item.part_name,
        category=item.category,
        quantity=item.quantity,
        reorder_level=item.reorder_level,
        unit_cost=item.unit_cost,
    )


@router.post("/inventory/forecast", response_model=ProcurementResponse)
async def forecast_inventory(
    request: ProcurementRequest,
    registry: ModelRegistry = Depends(get_registry),
):
    agent = InventoryAgent(registry)
    return await agent.forecast(
        request.equipment_id,
        request.predicted_failures,
        request.risk_levels,
        request.horizon_days,
    )


@router.post("/procurement/forecast", response_model=ProcurementResponse)
async def forecast_procurement(
    request: ProcurementRequest,
    registry: ModelRegistry = Depends(get_registry),
):
    """Backward-compatible alias."""
    return await forecast_inventory(request, registry)
