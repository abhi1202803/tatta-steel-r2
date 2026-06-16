from fastapi import APIRouter, Depends

from agents.prediction_agent.agent import PredictionAgent
from api.dependencies import get_registry
from api.schemas import FailurePredictionRequest, FailurePredictionResponse
from models.registry import ModelRegistry

router = APIRouter()


@router.post("/failure/predict", response_model=FailurePredictionResponse)
async def predict_failure(request: FailurePredictionRequest, registry: ModelRegistry = Depends(get_registry)):
    agent = PredictionAgent(registry)
    return await agent.classify_failure(
        request.equipment_id, request.sensor_data, request.anomaly_score
    )
