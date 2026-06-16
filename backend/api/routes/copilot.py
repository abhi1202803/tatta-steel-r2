from fastapi import APIRouter, Depends

from agents.knowledge_agent.agent import KnowledgeAgent
from agents.supervisor_agent.orchestrator import SupervisorOrchestrator
from api.dependencies import get_registry
from api.schemas import CopilotRequest, CopilotResponse, PipelineRequest, SensorReading
from llm.gpt4o.client import LLMClient
from llm.prompts.copilot_prompts import DIAGNOSIS_TEMPLATE
from models.registry import ModelRegistry

router = APIRouter()


@router.post("/copilot/chat", response_model=CopilotResponse)
async def copilot_chat(request: CopilotRequest, registry: ModelRegistry = Depends(get_registry)):
    llm = LLMClient()
    knowledge_agent = KnowledgeAgent()
    pipeline_results = None
    sources = []

    knowledge = await knowledge_agent.retrieve(request.message, request.equipment_id)
    sources = knowledge.relevant_documents
    context = knowledge.technical_guidance

    if request.include_pipeline_analysis and request.equipment_id:
        orchestrator = SupervisorOrchestrator(registry)
        demo_sensor = SensorReading(
            temperature=75.0, vibration=7.5, pressure=8.0,
            current=22.0, rpm=1350.0, flow_rate=35.0,
        )
        pipeline = await orchestrator.run_full_pipeline(PipelineRequest(
            equipment_id=request.equipment_id,
            sensor_data=demo_sensor,
        ))
        pipeline_results = pipeline.model_dump()
        context = DIAGNOSIS_TEMPLATE.format(
            equipment_id=request.equipment_id,
            health_status=pipeline.anomaly.health_status.value,
            anomaly_score=pipeline.anomaly.unified_anomaly_score,
            failure_type=pipeline.failure.failure_type.value,
            failure_confidence=pipeline.failure.confidence,
            root_cause=pipeline.rca.root_cause,
            rul_days=pipeline.rul.rul_days,
            risk_level=pipeline.risk.risk_level.value,
            maintenance_action=pipeline.maintenance.recommended_action.value,
            knowledge_context=knowledge.technical_guidance,
            user_message=request.message,
        )

    response = await llm.generate(request.message, context=context)

    recommendations = []
    if pipeline_results:
        maintenance = pipeline_results.get("maintenance", {})
        recommendations = maintenance.get("autonomous_plan", [])

    return CopilotResponse(
        response=response,
        recommendations=recommendations,
        pipeline_results=pipeline_results,
        sources=sources,
    )
