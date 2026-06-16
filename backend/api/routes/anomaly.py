from fastapi import APIRouter, Depends

from api.dependencies import get_registry
from api.schemas import AnomalyRequest, AnomalyResponse
from models.anomaly_detection.pipeline import run_anomaly_detection
from models.registry import ModelRegistry

router = APIRouter()


@router.post("/anomaly/detect", response_model=AnomalyResponse)
async def detect_anomaly(request: AnomalyRequest, registry: ModelRegistry = Depends(get_registry)):
    return await run_anomaly_detection(
        registry, request.equipment_id, request.sensor_data, request.historical_sequence
    )
