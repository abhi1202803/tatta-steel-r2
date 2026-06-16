from fastapi import APIRouter, HTTPException

from api.data_store import EQUIPMENT_REGISTRY
from api.schemas import EquipmentInfo

router = APIRouter()


@router.get("/equipment", response_model=list[EquipmentInfo])
async def list_equipment():
    return EQUIPMENT_REGISTRY


@router.get("/equipment/{equipment_id}", response_model=EquipmentInfo)
async def get_equipment(equipment_id: str):
    for eq in EQUIPMENT_REGISTRY:
        if eq.id == equipment_id:
            return eq
    raise HTTPException(status_code=404, detail=f"Equipment {equipment_id} not found")
