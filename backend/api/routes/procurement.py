from fastapi import APIRouter, Depends

from agents.inventory_agent.agent import InventoryAgent
from api.dependencies import get_registry
from api.schemas import ProcurementRequest, ProcurementResponse
from models.registry import ModelRegistry

router = APIRouter()


@router.post("/procurement/forecast", response_model=ProcurementResponse)
async def forecast_procurement(request: ProcurementRequest, registry: ModelRegistry = Depends(get_registry)):
    agent = InventoryAgent(registry)
    return await agent.forecast(
        request.equipment_id, request.predicted_failures,
        request.risk_levels, request.horizon_days,
    )
