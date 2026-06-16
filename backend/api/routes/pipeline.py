from fastapi import APIRouter, Depends

from agents.supervisor_agent.orchestrator import SupervisorOrchestrator
from api.dependencies import get_registry
from api.schemas import PipelineRequest, PipelineResponse
from models.registry import ModelRegistry

router = APIRouter()


@router.post("/pipeline/analyze", response_model=PipelineResponse)
async def run_pipeline(request: PipelineRequest, registry: ModelRegistry = Depends(get_registry)):
    orchestrator = SupervisorOrchestrator(registry)
    return await orchestrator.run_full_pipeline(request)
