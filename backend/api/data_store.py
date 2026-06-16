"""In-memory data store for demo equipment, alerts, logbook, and feedback."""

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from api.schemas import AlertInfo, EquipmentInfo, HealthStatus, LogbookEntry, RiskLevel

EQUIPMENT_REGISTRY = [
    EquipmentInfo(
        id="BF-3", name="Blast Furnace Fan BF-3", type="Fan",
        location="Steel Plant - Blast Furnace", health_status=HealthStatus.CRITICAL,
        risk_level=RiskLevel.CRITICAL, rul_days=2.1, anomaly_score=0.91,
        criticality="critical", manufacturer="Siemens",
        last_maintenance=datetime.now(timezone.utc) - timedelta(days=95),
    ),
    EquipmentInfo(
        id="PUMP-05", name="Centrifugal Pump 05", type="Pump",
        location="Steel Plant - Rolling Mill", health_status=HealthStatus.WARNING,
        risk_level=RiskLevel.HIGH, rul_days=12.5, anomaly_score=0.72,
        criticality="high", manufacturer="Grundfos",
        last_maintenance=datetime.now(timezone.utc) - timedelta(days=45),
    ),
    EquipmentInfo(
        id="MOTOR-12", name="Conveyor Motor 12", type="Motor",
        location="Steel Plant - Conveyor Line", health_status=HealthStatus.NORMAL,
        risk_level=RiskLevel.LOW, rul_days=85.0, anomaly_score=0.18,
        criticality="medium", manufacturer="ABB",
        last_maintenance=datetime.now(timezone.utc) - timedelta(days=30),
    ),
    EquipmentInfo(
        id="GBOX-03", name="Gearbox 03", type="Gearbox",
        location="Steel Plant - Hot Strip Mill", health_status=HealthStatus.ANOMALY,
        risk_level=RiskLevel.CRITICAL, rul_days=3.2, anomaly_score=0.89,
        criticality="critical", manufacturer="Bonfiglioli",
        last_maintenance=datetime.now(timezone.utc) - timedelta(days=90),
    ),
    EquipmentInfo(
        id="COMP-07", name="Air Compressor 07", type="Compressor",
        location="Steel Plant - Utilities", health_status=HealthStatus.NORMAL,
        risk_level=RiskLevel.MEDIUM, rul_days=45.0, anomaly_score=0.42,
        criticality="medium", manufacturer="Atlas Copco",
        last_maintenance=datetime.now(timezone.utc) - timedelta(days=60),
    ),
    EquipmentInfo(
        id="FAN-02", name="Cooling Fan 02", type="Fan",
        location="Steel Plant - Blast Furnace", health_status=HealthStatus.WARNING,
        risk_level=RiskLevel.MEDIUM, rul_days=28.0, anomaly_score=0.55,
        criticality="high", manufacturer="WEG",
        last_maintenance=datetime.now(timezone.utc) - timedelta(days=20),
    ),
]

SENSOR_HISTORY: dict[str, dict[str, float]] = {
    "BF-3": {"temperature": 98.0, "vibration": 0.87, "pressure": 8.2, "current": 28.0, "rpm": 1420, "flow_rate": 32},
    "PUMP-05": {"temperature": 72.0, "vibration": 6.8, "pressure": 7.5, "current": 18.0, "rpm": 1450, "flow_rate": 40},
    "MOTOR-12": {"temperature": 45.0, "vibration": 2.1, "pressure": 5.0, "current": 12.0, "rpm": 1500, "flow_rate": 50},
    "GBOX-03": {"temperature": 82.0, "vibration": 8.5, "pressure": 6.0, "current": 24.0, "rpm": 1200, "flow_rate": 30},
    "COMP-07": {"temperature": 55.0, "vibration": 3.2, "pressure": 9.0, "current": 15.0, "rpm": 1800, "flow_rate": 55},
    "FAN-02": {"temperature": 68.0, "vibration": 4.5, "pressure": 5.5, "current": 14.0, "rpm": 1380, "flow_rate": 45},
}

ALERTS = [
    AlertInfo(
        id="ALT-001", equipment_id="BF-3", severity=RiskLevel.CRITICAL,
        message="Critical temperature 98°C – immediate shutdown recommended",
        timestamp=datetime.now(timezone.utc) - timedelta(minutes=20),
    ),
    AlertInfo(
        id="ALT-002", equipment_id="GBOX-03", severity=RiskLevel.CRITICAL,
        message="Critical vibration levels detected - immediate inspection required",
        timestamp=datetime.now(timezone.utc) - timedelta(hours=1),
    ),
    AlertInfo(
        id="ALT-003", equipment_id="PUMP-05", severity=RiskLevel.HIGH,
        message="Bearing temperature rising - schedule maintenance within 72h",
        timestamp=datetime.now(timezone.utc) - timedelta(hours=3),
    ),
    AlertInfo(
        id="ALT-004", equipment_id="FAN-02", severity=RiskLevel.MEDIUM,
        message="Anomaly score exceeded warning threshold",
        timestamp=datetime.now(timezone.utc) - timedelta(hours=6),
    ),
]

LOGBOOK_ENTRIES: list[LogbookEntry] = [
    LogbookEntry(
        id="LOG-001", equipment_id="GBOX-03", event_type="diagnosis",
        diagnosis="High vibration with elevated temperature",
        recommendation="Schedule gearbox inspection within 24h",
        root_cause="Bearing Wear", created_at=datetime.now(timezone.utc) - timedelta(days=2),
    ),
    LogbookEntry(
        id="LOG-002", equipment_id="PUMP-05", event_type="maintenance",
        diagnosis="Bearing temperature trend increasing",
        recommendation="Replace bearing SKF-6205, verify lubrication",
        root_cause="Insufficient Lubrication", created_at=datetime.now(timezone.utc) - timedelta(days=5),
    ),
]

FEEDBACK_ENTRIES: list[dict] = []

INGEST_HISTORY: list[dict] = []

KNOWLEDGE_DOCUMENTS: list[dict] = [
    {
        "id": "DOC-001",
        "filename": "BF-3_Fan_Manual.pdf",
        "doc_type": "manual",
        "equipment_id": "BF-3",
        "size_bytes": 2450000,
        "indexed": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=30),
    },
    {
        "id": "DOC-002",
        "filename": "Gearbox_Inspection_SOP.docx",
        "doc_type": "sop",
        "equipment_id": "GBOX-03",
        "size_bytes": 890000,
        "indexed": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=15),
    },
]

REPORTS_STORE: list[dict] = []

ALERT_HISTORY: list[dict] = []

ADMIN_USERS: list[dict] = [
    {
        "id": "USR-001", "email": "engineer@tatasteel.com", "name": "Rajesh Kumar",
        "role_id": "engineer", "enabled": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=180),
    },
    {
        "id": "USR-002", "email": "manager@tatasteel.com", "name": "Priya Sharma",
        "role_id": "manager", "enabled": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=120),
    },
    {
        "id": "USR-003", "email": "admin@tatasteel.com", "name": "System Admin",
        "role_id": "admin", "enabled": True,
        "created_at": datetime.now(timezone.utc) - timedelta(days=365),
    },
]

AUDIT_LOGS: list[dict] = [
    {
        "id": "AUD-001", "action": "alert.acknowledge", "user": "Rajesh Kumar",
        "resource": "ALT-001", "timestamp": datetime.now(timezone.utc) - timedelta(hours=2),
    },
    {
        "id": "AUD-002", "action": "ingest.sensor", "user": "System",
        "resource": "BF-3", "timestamp": datetime.now(timezone.utc) - timedelta(hours=5),
    },
]

ACTIVITY_LOG: list[dict] = []

ADMIN_SETTINGS: dict = {
    "plant_name": "Tata Steel Plant A",
    "timezone": "Asia/Kolkata",
    "alert_escalation_minutes": 30,
    "auto_pipeline_on_ingest": True,
    "embedding_model": "BGE-large",
    "qdrant_collection": "maintenance_knowledge",
    "supabase_bucket": "maintenance-docs",
}


def add_audit_log(action: str, user: str, resource: str) -> dict:
    entry = {
        "id": f"AUD-{uuid4().hex[:8].upper()}",
        "action": action,
        "user": user,
        "resource": resource,
        "timestamp": datetime.now(timezone.utc),
    }
    AUDIT_LOGS.insert(0, entry)
    ACTIVITY_LOG.insert(0, entry)
    return entry


def add_ingest_record(
    input_type: str,
    equipment_id: str | None,
    payload_summary: str,
    routing: dict | None = None,
    status: str = "completed",
) -> dict:
    record = {
        "id": f"ING-{uuid4().hex[:8].upper()}",
        "input_type": input_type,
        "equipment_id": equipment_id,
        "payload_summary": payload_summary[:500],
        "routing": routing or {},
        "status": status,
        "created_at": datetime.now(timezone.utc),
    }
    INGEST_HISTORY.insert(0, record)
    return record


def add_report(equipment_id: str, report_type: str, content: str) -> dict:
    report = {
        "id": f"RPT-{uuid4().hex[:8].upper()}",
        "equipment_id": equipment_id,
        "report_type": report_type,
        "content": content,
        "created_at": datetime.now(timezone.utc),
    }
    REPORTS_STORE.insert(0, report)
    return report


def add_logbook_entry(
    equipment_id: str,
    event_type: str,
    diagnosis: str | None = None,
    recommendation: str | None = None,
    root_cause: str | None = None,
    action_taken: str | None = None,
    metadata: dict | None = None,
) -> LogbookEntry:
    entry = LogbookEntry(
        id=f"LOG-{uuid4().hex[:8].upper()}",
        equipment_id=equipment_id,
        event_type=event_type,
        diagnosis=diagnosis,
        recommendation=recommendation,
        root_cause=root_cause,
        action_taken=action_taken,
        created_at=datetime.now(timezone.utc),
        metadata=metadata or {},
    )
    LOGBOOK_ENTRIES.insert(0, entry)
    return entry
