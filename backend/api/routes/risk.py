from fastapi import APIRouter, Depends

from agents.prediction_agent.agent import PredictionAgent
from api.dependencies import get_registry
from api.schemas import RiskRequest, RiskResponse
from models.registry import ModelRegistry

router = APIRouter()


@router.post("/risk/assess", response_model=RiskResponse)
@router.post("/risk/analyze", response_model=RiskResponse)
async def assess_risk(request: RiskRequest, registry: ModelRegistry = Depends(get_registry)):
    agent = PredictionAgent(registry)
    return await agent.assess_risk(
        request.equipment_id, request.anomaly_score, request.failure_type,
        request.root_cause, request.rul_hours, request.equipment_age_days,
        request.downtime_cost_per_hour,
    )
