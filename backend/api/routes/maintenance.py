from fastapi import APIRouter, Depends

from agents.maintenance_agent.agent import MaintenanceAgent
from api.dependencies import get_registry
from api.schemas import MaintenanceRequest, MaintenanceResponse
from models.registry import ModelRegistry

router = APIRouter()


@router.post("/maintenance/optimize", response_model=MaintenanceResponse)
async def optimize_maintenance(request: MaintenanceRequest, registry: ModelRegistry = Depends(get_registry)):
    agent = MaintenanceAgent(registry)
    return await agent.optimize(
        request.equipment_id, request.risk_level, request.rul_hours,
        request.health_status, request.inventory,
    )
