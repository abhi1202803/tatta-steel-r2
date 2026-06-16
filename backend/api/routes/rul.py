from fastapi import APIRouter, Depends

from agents.prediction_agent.agent import PredictionAgent
from api.dependencies import get_registry
from api.schemas import RULRequest, RULResponse
from models.registry import ModelRegistry

router = APIRouter()


@router.post("/rul/predict", response_model=RULResponse)
async def predict_rul(request: RULRequest, registry: ModelRegistry = Depends(get_registry)):
    agent = PredictionAgent(registry)
    return await agent.predict_rul(
        request.equipment_id, request.sensor_sequence, request.equipment_age_days
    )
