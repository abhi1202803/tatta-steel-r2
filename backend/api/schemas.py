"""Pydantic schemas for API request/response models."""

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class HealthStatus(str, Enum):
    NORMAL = "normal"
    WARNING = "warning"
    ANOMALY = "anomaly"
    CRITICAL = "critical"


class FailureType(str, Enum):
    BEARING = "bearing_failure"
    MOTOR = "motor_failure"
    GEARBOX = "gearbox_failure"
    PUMP = "pump_failure"
    SENSOR = "sensor_failure"
    NONE = "none"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class MaintenanceAction(str, Enum):
    CONTINUE = "continue_operation"
    MONITOR = "monitor"
    SCHEDULE = "schedule_maintenance"
    SHUTDOWN = "shutdown"
    ORDER_SPARES = "order_spares"


class SensorReading(BaseModel):
    temperature: float = Field(..., ge=-50, le=500, description="°C")
    vibration: float = Field(..., ge=0, le=100, description="mm/s")
    pressure: float = Field(..., ge=0, le=1000, description="bar")
    current: float = Field(..., ge=0, le=500, description="A")
    rpm: float = Field(..., ge=0, le=10000, description="RPM")
    flow_rate: Optional[float] = Field(None, ge=0, description="L/min")
    timestamp: Optional[datetime] = None


class SensorSequence(BaseModel):
    equipment_id: str
    readings: list[SensorReading] = Field(..., min_length=1)


class AnomalyRequest(BaseModel):
    equipment_id: str
    sensor_data: SensorReading
    historical_sequence: Optional[list[SensorReading]] = None


class AnomalyResponse(BaseModel):
    equipment_id: str
    unified_anomaly_score: float
    health_status: HealthStatus
    isolation_forest_score: float
    autoencoder_error: float
    lstm_temporal_score: float
    is_anomaly: bool
    details: dict[str, Any] = {}


class FailurePredictionRequest(BaseModel):
    equipment_id: str
    sensor_data: SensorReading
    anomaly_score: float = 0.0
    maintenance_history: Optional[list[dict]] = None


class FailurePredictionResponse(BaseModel):
    equipment_id: str
    failure_type: FailureType
    confidence: float
    probabilities: dict[str, float]


class RCARequest(BaseModel):
    equipment_id: str
    failure_type: FailureType
    sensor_data: SensorReading
    anomaly_score: float = 0.0


class RCAResponse(BaseModel):
    equipment_id: str
    root_cause: str
    confidence: float
    cause_chain: list[str]
    affected_components: list[str]


class RULRequest(BaseModel):
    equipment_id: str
    sensor_sequence: list[SensorReading]
    maintenance_records: Optional[list[dict]] = None
    equipment_age_days: int = 365
    production_load: float = 0.8


class RULResponse(BaseModel):
    equipment_id: str
    rul_hours: float
    rul_days: float
    model_used: str
    confidence: float
    feature_importance: dict[str, Any] = {}


class RiskRequest(BaseModel):
    equipment_id: str
    anomaly_score: float
    failure_type: FailureType
    root_cause: str
    rul_hours: float
    equipment_age_days: int = 365
    downtime_cost_per_hour: float = 5000.0


class RiskResponse(BaseModel):
    equipment_id: str
    risk_level: RiskLevel
    risk_score: float
    confidence: float
    priority_rank: int
    financial_impact_estimate: float


class MaintenanceRequest(BaseModel):
    equipment_id: str
    risk_level: RiskLevel
    rul_hours: float
    health_status: HealthStatus
    inventory: dict[str, int] = {}
    production_schedule: Optional[dict] = None


class MaintenanceResponse(BaseModel):
    equipment_id: str
    recommended_action: MaintenanceAction
    maintenance_window: Optional[str]
    cost_savings_estimate: float
    autonomous_plan: list[str]
    reasoning: str


class ProcurementRequest(BaseModel):
    equipment_id: Optional[str] = None
    predicted_failures: list[dict] = []
    risk_levels: dict[str, RiskLevel] = {}
    historical_usage: Optional[dict[str, list[float]]] = None
    horizon_days: int = 30


class ProcurementResponse(BaseModel):
    forecasts: dict[str, list[float]]
    procurement_recommendations: list[dict]
    reorder_quantities: dict[str, int]
    stockout_risk: dict[str, float]


class KnowledgeQuery(BaseModel):
    query: str
    top_k: int = 5
    equipment_id: Optional[str] = None


class KnowledgeResponse(BaseModel):
    query: str
    retrieved_context: list[dict]
    relevant_documents: list[str]
    technical_guidance: str


class CopilotMessage(BaseModel):
    role: str
    content: str


class CopilotRequest(BaseModel):
    message: str
    equipment_id: Optional[str] = None
    conversation_history: list[CopilotMessage] = []
    include_pipeline_analysis: bool = True


class CopilotResponse(BaseModel):
    response: str
    recommendations: list[str]
    pipeline_results: Optional[dict] = None
    sources: list[str] = []


class PipelineRequest(BaseModel):
    equipment_id: str
    sensor_data: SensorReading
    sensor_sequence: Optional[list[SensorReading]] = None
    equipment_age_days: int = 365
    downtime_cost_per_hour: float = 5000.0


class PipelineResponse(BaseModel):
    equipment_id: str
    anomaly: AnomalyResponse
    failure: FailurePredictionResponse
    rca: RCAResponse
    rul: RULResponse
    risk: RiskResponse
    maintenance: MaintenanceResponse
    procurement: ProcurementResponse
    knowledge: Optional[KnowledgeResponse] = None
    executive_summary: str
    timestamp: datetime


class EquipmentInfo(BaseModel):
    id: str
    name: str
    type: str
    location: str
    health_status: HealthStatus
    risk_level: RiskLevel
    rul_days: float
    last_maintenance: Optional[datetime]
    anomaly_score: float
    criticality: str = "medium"
    manufacturer: str = "Siemens"
    install_date: Optional[datetime] = None


class EquipmentContext(BaseModel):
    equipment: EquipmentInfo
    criticality: str
    active_alerts: list["AlertInfo"] = []
    latest_sensors: dict[str, float] = {}
    maintenance_history: list[dict] = []
    production_load: float = 0.8
    downtime_cost_per_hour: float = 5000.0


class InputType(str, Enum):
    AUTO = "auto"
    SENSOR = "sensor"
    PDF = "pdf"
    FAULT_LOG = "fault_log"
    MAINTENANCE_HISTORY = "maintenance_history"
    NATURAL_LANGUAGE = "natural_language"
    INVENTORY = "inventory"
    FULL_INCIDENT = "full_incident"
    SOP = "sop"
    MANUAL = "manual"
    DELAY_LOG = "delay_log"
    INCIDENT = "incident"
    FAILURE_REPORT = "failure_report"


class WorkflowType(str, Enum):
    SENSOR_DIAGNOSIS = "sensor_diagnosis"
    KNOWLEDGE_QUERY = "knowledge_query"
    INVENTORY_CHECK = "inventory_check"
    FULL_INCIDENT = "full_incident"
    MAINTENANCE_PLAN = "maintenance_plan"


class IngestRequest(BaseModel):
    input_type: InputType = InputType.AUTO
    payload: Any
    equipment_id: Optional[str] = None
    metadata: dict[str, Any] = {}


class RoutingDecision(BaseModel):
    detected_type: InputType
    workflow: WorkflowType
    agents: list[str]
    confidence: float
    equipment_id: str


class IngestResponse(BaseModel):
    routing: RoutingDecision
    equipment_context: EquipmentContext
    result: dict[str, Any]
    logbook_entry_id: Optional[str] = None


class LogbookEntry(BaseModel):
    id: str
    equipment_id: str
    event_type: str
    diagnosis: Optional[str] = None
    recommendation: Optional[str] = None
    root_cause: Optional[str] = None
    action_taken: Optional[str] = None
    created_at: datetime
    metadata: dict[str, Any] = {}


class LogbookCreate(BaseModel):
    equipment_id: str
    event_type: str = "auto_recommendation"
    diagnosis: Optional[str] = None
    recommendation: Optional[str] = None
    root_cause: Optional[str] = None
    action_taken: Optional[str] = None
    metadata: dict[str, Any] = {}


class FeedbackEntry(BaseModel):
    id: str
    equipment_id: str
    recommendation_correct: bool
    actual_root_cause: Optional[str] = None
    repair_outcome: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


class FeedbackCreate(BaseModel):
    equipment_id: str
    recommendation_correct: bool
    actual_root_cause: Optional[str] = None
    repair_outcome: Optional[str] = None
    notes: Optional[str] = None


class AdminRole(BaseModel):
    id: str
    name: str
    permissions: list[str]


class AlertInfo(BaseModel):
    id: str
    equipment_id: str
    severity: RiskLevel
    message: str
    timestamp: datetime
    acknowledged: bool = False


class DashboardOverview(BaseModel):
    total_equipment: int
    healthy_count: int
    warning_count: int
    critical_count: int
    avg_rul_days: float
    active_alerts: int
    maintenance_scheduled: int
    cost_savings_mtd: float
    equipment_summary: list[EquipmentInfo]
    recent_alerts: list[AlertInfo]
    risk_distribution: dict[str, int]
    anomaly_trend: list[dict]


class EquipmentCreate(BaseModel):
    id: str
    name: str
    type: str
    location: str
    criticality: str = "medium"
    manufacturer: str = "Siemens"


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    location: Optional[str] = None
    criticality: Optional[str] = None
    manufacturer: Optional[str] = None
    health_status: Optional[HealthStatus] = None
    risk_level: Optional[RiskLevel] = None


class AlertActionRequest(BaseModel):
    user: str = "System"
    assignee: Optional[str] = None
    notes: Optional[str] = None


class KnowledgeDocument(BaseModel):
    id: str
    filename: str
    doc_type: str
    equipment_id: Optional[str] = None
    size_bytes: int = 0
    indexed: bool = False
    created_at: datetime


class AdminUser(BaseModel):
    id: str
    email: str
    name: str
    role_id: str
    enabled: bool = True
    created_at: datetime


class AdminUserCreate(BaseModel):
    email: str
    name: str
    role_id: str


class AdminUserUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    role_id: Optional[str] = None
    enabled: Optional[bool] = None


class FeedbackUpdate(BaseModel):
    recommendation_correct: Optional[bool] = None
    actual_root_cause: Optional[str] = None
    repair_outcome: Optional[str] = None
    notes: Optional[str] = None


class LogbookUpdate(BaseModel):
    event_type: Optional[str] = None
    diagnosis: Optional[str] = None
    recommendation: Optional[str] = None
    root_cause: Optional[str] = None
    action_taken: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None


class IngestRecord(BaseModel):
    id: str
    input_type: str
    equipment_id: Optional[str] = None
    payload_summary: str
    routing: dict[str, Any] = {}
    status: str = "completed"
    created_at: datetime


class ReportRecord(BaseModel):
    id: str
    equipment_id: str
    report_type: str
    content: str
    created_at: datetime
