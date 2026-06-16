from fastapi import APIRouter, Depends

from agents.diagnosis_agent.agent import DiagnosisAgent
from api.dependencies import get_registry
from api.schemas import RCARequest, RCAResponse
from models.registry import ModelRegistry

router = APIRouter()


@router.post("/rca/analyze", response_model=RCAResponse)
async def analyze_root_cause(request: RCARequest, registry: ModelRegistry = Depends(get_registry)):
    agent = DiagnosisAgent(registry)
    return await agent.analyze_root_cause(
        request.equipment_id, request.failure_type, request.sensor_data, request.anomaly_score
    )
