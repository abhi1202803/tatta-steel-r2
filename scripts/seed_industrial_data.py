"""Realistic industrial-scale seed data generators for Tata Steel plant demo."""

from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone
from typing import Any

from api.schemas import HealthStatus, RiskLevel

# Reproducible demo data
RNG = random.Random(42)

PLANT_AREAS = [
    "Blast Furnace",
    "Coke Oven Battery",
    "Sinter Plant",
    "BOF Shop",
    "Continuous Casting",
    "Hot Strip Mill",
    "Cold Rolling Mill",
    "Pickling Line",
    "Annealing Line",
    "Utilities & HVAC",
    "Water Treatment",
    "Power Distribution",
    "Material Handling",
    "Ladle Furnace",
    "Raw Material Yard",
]

EQUIPMENT_SPECS: list[tuple[str, str, list[str]]] = [
    ("Pump", "PUMP", ["Centrifugal", "Slurry", "Cooling Water", "Booster", "Chemical Dosing"]),
    ("Motor", "MOTOR", ["Conveyor Drive", "Roll Drive", "Fan Drive", "Crane Hoist", "Agitator"]),
    ("Fan", "FAN", ["Blast Furnace", "Cooling Tower", "Exhaust", "ID Fan", "Forced Draft"]),
    ("Gearbox", "GBOX", ["Pinion", "Reducer", "Planetary", "Helical", "Worm"]),
    ("Compressor", "COMP", ["Air", "Nitrogen", "Instrument Air", "Reciprocating", "Screw"]),
    ("Conveyor", "CONV", ["Belt", "Apron", "Stacker", "Reclaimer", "Vibrating"]),
    ("Crane", "CRANE", ["EOT", "Ladle", "Billet", "Overhead", "Gantry"]),
    ("Valve", "VALVE", ["Control", "Isolation", "Relief", "Butterfly", "Gate"]),
    ("Heat Exchanger", "HX", ["Shell-Tube", "Plate", "Air Cooler", "Condenser", "Preheater"]),
    ("Blower", "BLOW", ["Roots", "Centrifugal", "Axial", "Regenerative", "Process"]),
    ("Transformer", "XFMR", ["Distribution", "Furnace", "Rectifier", "Step-Down", "Isolation"]),
    ("Roll Stand", "ROLL", ["Finishing", "Roughing", "Backup", "Work Roll", "Pinch Roll"]),
]

MANUFACTURERS = [
    "Siemens", "ABB", "Grundfos", "Bonfiglioli", "Atlas Copco", "WEG", "SKF",
    "KSB", "FLSmidth", "Metso Outotec", "L&T", "BHEL", "Thermax", "Crompton",
]

CRITICALITY_LEVELS = ["low", "medium", "high", "critical"]
RISK_LEVELS = [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]
SEVERITIES = ["low", "medium", "high", "critical"]

FAILURE_TYPES = [
    "bearing_failure", "gearbox_failure", "seal_leak", "motor_overheat",
    "impeller_imbalance", "coupling_misalignment", "lubrication_failure",
    "vibration_anomaly", "electrical_fault", "corrosion",
]

ROOT_CAUSES = [
    "Bearing wear", "Insufficient lubrication", "Misalignment", "Dust accumulation",
    "Seal degradation", "Overloading", "Coolant flow restriction", "Impeller damage",
    "Electrical insulation breakdown", "Normal wear", "Contamination ingress",
]

ALERT_TEMPLATES = [
    "Critical temperature {temp}°C – immediate inspection required",
    "Vibration {vib} mm/s exceeds threshold on {name}",
    "Pressure deviation detected – verify relief valve",
    "Anomaly score {score:.2f} exceeded warning threshold",
    "RUL below {rul} days – schedule preventive maintenance",
    "Current draw spike – check motor winding insulation",
    "Flow rate dropped {pct}% from baseline",
    "Bearing temperature rising – schedule replacement within 72h",
]

MAINTENANCE_TYPES = ["preventive", "corrective", "inspection", "predictive", "emergency", "overhaul"]

REPORT_TYPES = ["executive_summary", "failure_report", "rca_report", "rul_analysis", "maintenance_plan"]

DOC_TYPES = ["manual", "sop", "checklist", "historical", "inspection_record", "warranty", "drawing"]

ROLE_IDS = ["engineer", "manager", "reliability", "plant_head", "admin"]

FIRST_NAMES = [
    "Rajesh", "Priya", "Amit", "Sneha", "Vikram", "Anita", "Suresh", "Kavita",
    "Rahul", "Deepa", "Manoj", "Pooja", "Arun", "Meera", "Sanjay", "Neha",
    "Ravi", "Lakshmi", "Gopal", "Divya", "Kiran", "Swati", "Harish", "Nisha",
]

LAST_NAMES = [
    "Kumar", "Sharma", "Patel", "Reddy", "Singh", "Iyer", "Gupta", "Nair",
    "Das", "Menon", "Verma", "Joshi", "Rao", "Pillai", "Chatterjee", "Banerjee",
]

INVENTORY_CATEGORIES = [
    ("Bearings", ["SKF-6205", "SKF-6310", "FAG-22208", "Timken-32218", "NSK-6905"]),
    ("Seals", ["Mechanical Seal MS-100", "Oil Seal TC 45x65", "Gasket Kit GK-200", "O-Ring Viton Set"]),
    ("Belts", ["V-Belt SPB-2000", "Timing Belt HTD-8M", "Flat Belt FB-1200", "Cogged Belt CX-85"]),
    ("Lubricants", ["Gear Oil ISO 320", "Hydraulic Oil HM 46", "Grease EP2 Lithium", "Synthetic Oil PAO-68"]),
    ("Couplings", ["Flexible Coupling FC-100", "Gear Coupling GC-150", "Jaw Coupling JC-80", "Grid Coupling GR-200"]),
    ("Filters", ["Filter Element HF-200", "Air Filter AF-500", "Oil Filter OF-100", "Hydraulic Filter HF-350"]),
    ("Motors", ["Spare Stator MS-75kW", "Rotor Assembly RA-55kW", "Motor Bearing Kit MBK-90"]),
    ("Valves", ["Control Valve CV-4in", "Relief Valve RV-2in", "Solenoid Valve SV-1in", "Gate Valve GV-6in"]),
    ("Electrical", ["VFD Module 75kW", "Contactor LC1-D80", "Overload Relay OL-100", "Proximity Sensor PS-18"]),
    ("Fasteners", ["Bolt Set M16 Grade 8.8", "Stud Bolt SB-M20", "Lock Nut Kit LN-M12"]),
]

# Scale targets (minimum counts)
TARGETS = {
    "equipment": 75,
    "sensor_readings": 25000,
    "alerts": 750,
    "maintenance_events": 1500,
    "failure_reports": 400,
    "incidents": 300,
    "delay_logs": 200,
    "spare_inventory": 120,
    "failure_predictions": 600,
    "feedback": 250,
    "admin_users": 55,
    "knowledge_documents": 80,
    "logbook_entries": 800,
    "ingest_records": 600,
    "audit_logs": 200,
}


def _risk_to_health(risk: RiskLevel, anomaly: float) -> HealthStatus:
    if risk == RiskLevel.CRITICAL or anomaly >= 0.85:
        return HealthStatus.CRITICAL
    if risk == RiskLevel.HIGH or anomaly >= 0.7:
        return HealthStatus.ANOMALY
    if risk == RiskLevel.MEDIUM or anomaly >= 0.5:
        return HealthStatus.WARNING
    return HealthStatus.NORMAL


def generate_equipment(count: int = 75) -> list[dict[str, Any]]:
    """Generate interconnected equipment assets for steel plant."""
    assets: list[dict[str, Any]] = []
    used_ids: set[str] = set()

    # Preserve canonical demo assets first
    canonical = [
        ("BF-3", "Blast Furnace Fan BF-3", "Fan", "Steel Plant - Blast Furnace", "critical", "Siemens", RiskLevel.CRITICAL, 0.91, 2.1),
        ("PUMP-05", "Centrifugal Pump 05", "Pump", "Steel Plant - Rolling Mill", "high", "Grundfos", RiskLevel.HIGH, 0.72, 12.5),
        ("MOTOR-12", "Conveyor Motor 12", "Motor", "Steel Plant - Conveyor Line", "medium", "ABB", RiskLevel.LOW, 0.18, 85.0),
        ("GBOX-03", "Gearbox 03", "Gearbox", "Steel Plant - Hot Strip Mill", "critical", "Bonfiglioli", RiskLevel.CRITICAL, 0.89, 3.2),
        ("COMP-07", "Air Compressor 07", "Compressor", "Steel Plant - Utilities", "medium", "Atlas Copco", RiskLevel.MEDIUM, 0.42, 45.0),
        ("FAN-02", "Cooling Fan 02", "Fan", "Steel Plant - Blast Furnace", "high", "WEG", RiskLevel.MEDIUM, 0.55, 28.0),
    ]
    for eq_id, name, eq_type, location, crit, mfr, risk, anomaly, rul in canonical:
        used_ids.add(eq_id)
        assets.append({
            "id": eq_id, "name": name, "type": eq_type, "location": location,
            "criticality": crit, "manufacturer": mfr, "risk_level": risk,
            "anomaly_score": anomaly, "rul_days": rul,
            "age_days": RNG.randint(400, 2500),
            "install_date": datetime.now(timezone.utc) - timedelta(days=RNG.randint(400, 2500)),
        })

    seq = 1
    while len(assets) < count:
        eq_type, prefix, variants = RNG.choice(EQUIPMENT_SPECS)
        area = RNG.choice(PLANT_AREAS)
        eq_id = f"{prefix}-{seq:03d}"
        seq += 1
        if eq_id in used_ids:
            continue
        used_ids.add(eq_id)
        variant = RNG.choice(variants)
        name = f"{variant} {eq_type} {eq_id.split('-')[1]}"
        location = f"Steel Plant - {area}"
        crit = RNG.choices(CRITICALITY_LEVELS, weights=[15, 40, 30, 15])[0]
        risk = RNG.choices(RISK_LEVELS, weights=[30, 35, 25, 10])[0]
        anomaly = round(RNG.uniform(0.1, 0.95) if risk in (RiskLevel.HIGH, RiskLevel.CRITICAL) else RNG.uniform(0.05, 0.6), 2)
        rul = round(RNG.uniform(2, 120) if risk == RiskLevel.CRITICAL else RNG.uniform(5, 180), 1)
        assets.append({
            "id": eq_id, "name": name, "type": eq_type, "location": location,
            "criticality": crit, "manufacturer": RNG.choice(MANUFACTURERS),
            "risk_level": risk, "anomaly_score": anomaly, "rul_days": rul,
            "age_days": RNG.randint(200, 3000),
            "install_date": datetime.now(timezone.utc) - timedelta(days=RNG.randint(200, 3000)),
        })

    return assets


def _base_sensors(eq_type: str, anomaly: float) -> dict[str, float]:
    """Type-appropriate sensor baselines scaled by health."""
    scale = 1.0 + anomaly * 0.5
    profiles = {
        "Pump": {"temperature": 55, "vibration": 4.0, "pressure": 7.0, "current": 16, "rpm": 1450, "flow_rate": 42},
        "Motor": {"temperature": 48, "vibration": 2.5, "pressure": 5.0, "current": 14, "rpm": 1500, "flow_rate": 0},
        "Fan": {"temperature": 65, "vibration": 3.5, "pressure": 5.5, "current": 18, "rpm": 1380, "flow_rate": 48},
        "Gearbox": {"temperature": 70, "vibration": 6.0, "pressure": 6.0, "current": 22, "rpm": 1200, "flow_rate": 0},
        "Compressor": {"temperature": 58, "vibration": 3.0, "pressure": 9.0, "current": 15, "rpm": 1800, "flow_rate": 55},
    }
    base = profiles.get(eq_type, {"temperature": 52, "vibration": 3.0, "pressure": 6.0, "current": 15, "rpm": 1400, "flow_rate": 35})
    return {k: round(v * scale + RNG.uniform(-v * 0.05, v * 0.05), 2) for k, v in base.items()}


def generate_sensor_readings(equipment: list[dict], total: int = 25000) -> list[dict]:
    """Time-series sensor readings over 180 days with realistic drift."""
    now = datetime.now(timezone.utc)
    per_eq = max(total // len(equipment), 200)
    readings: list[dict] = []
    start = now - timedelta(days=180)

    for eq in equipment:
        baseline = _base_sensors(eq["type"], eq["anomaly_score"])
        temp, vib = baseline["temperature"], baseline["vibration"]
        interval_hours = (180 * 24) / per_eq

        for i in range(per_eq):
            ts = start + timedelta(hours=i * interval_hours)
            # Gradual degradation trend for high-risk assets
            drift = (i / per_eq) * eq["anomaly_score"] * 0.3
            temp += RNG.uniform(-0.8, 0.8) + drift * 5
            vib += RNG.uniform(-0.15, 0.15) + drift * 2
            readings.append({
                "equipment_id": eq["id"],
                "time": ts,
                "temperature": round(max(20, temp), 2),
                "vibration": round(max(0.1, vib), 3),
                "pressure": round(baseline["pressure"] + RNG.uniform(-0.5, 0.5), 2),
                "current": round(baseline["current"] + RNG.uniform(-1, 1), 2),
                "rpm": round(baseline["rpm"] + RNG.uniform(-30, 30), 0),
                "flow_rate": round(max(0, baseline["flow_rate"] + RNG.uniform(-3, 3)), 2) if baseline["flow_rate"] else None,
            })

    RNG.shuffle(readings)
    return readings[:total]


def generate_alerts(equipment: list[dict], count: int = 750) -> list[dict]:
    now = datetime.now(timezone.utc)
    alerts = []
    for i in range(count):
        eq = RNG.choice(equipment)
        sev = RNG.choices(SEVERITIES, weights=[20, 35, 30, 15])[0]
        if eq["risk_level"] == RiskLevel.CRITICAL:
            sev = RNG.choice(["high", "critical"])
        tmpl = RNG.choice(ALERT_TEMPLATES)
        msg = tmpl.format(
            temp=round(RNG.uniform(75, 105), 1),
            vib=round(RNG.uniform(4, 12), 2),
            name=eq["name"],
            score=eq["anomaly_score"],
            rul=round(eq["rul_days"], 1),
            pct=RNG.randint(10, 40),
        )
        alerts.append({
            "id": f"ALT-{i + 1:05d}",
            "equipment_id": eq["id"],
            "severity": sev,
            "message": msg,
            "acknowledged": RNG.random() < 0.35,
            "created_at": now - timedelta(hours=RNG.randint(1, 4320)),
        })
    return alerts


def generate_maintenance_events(equipment: list[dict], count: int = 1500) -> list[dict]:
    now = datetime.now(timezone.utc)
    events = []
    for i in range(count):
        eq = RNG.choice(equipment)
        evt_type = RNG.choice(MAINTENANCE_TYPES)
        events.append({
            "equipment_id": eq["id"],
            "event_type": evt_type,
            "description": f"{evt_type.title()} – {eq['name']} at {eq['location']}",
            "performed_at": now - timedelta(days=RNG.randint(1, 730)),
            "cost": round(RNG.uniform(1500, 85000), 2),
            "downtime_hours": round(RNG.uniform(0.5, 48), 1) if evt_type in ("corrective", "emergency", "overhaul") else round(RNG.uniform(0.5, 8), 1),
        })
    return events


def generate_failure_predictions(equipment: list[dict], count: int = 600) -> list[dict]:
    now = datetime.now(timezone.utc)
    preds = []
    for i in range(count):
        eq = RNG.choice(equipment)
        ft = RNG.choice(FAILURE_TYPES)
        if eq["type"] in ("Pump", "Motor"):
            ft = RNG.choice(["bearing_failure", "motor_overheat", "coupling_misalignment"])
        elif eq["type"] == "Gearbox":
            ft = "gearbox_failure"
        preds.append({
            "equipment_id": eq["id"],
            "failure_type": ft,
            "confidence": round(RNG.uniform(0.55, 0.98), 3),
            "anomaly_score": round(RNG.uniform(0.2, 0.95), 2),
            "risk_level": eq["risk_level"].value if hasattr(eq["risk_level"], "value") else eq["risk_level"],
            "rul_hours": round(RNG.uniform(24, 4320), 1),
            "root_cause": RNG.choice(ROOT_CAUSES),
            "predicted_at": now - timedelta(hours=RNG.randint(1, 8760)),
        })
    return preds


def generate_reports(equipment: list[dict], count: int = 400) -> list[dict]:
    now = datetime.now(timezone.utc)
    reports = []
    for i in range(count):
        eq = RNG.choice(equipment)
        rtype = RNG.choice(REPORT_TYPES)
        if i < count * 0.4:
            rtype = "failure_report"
        content = (
            f"{rtype.replace('_', ' ').title()} – {eq['name']} ({eq['id']})\n"
            f"Location: {eq['location']}\n"
            f"Risk Level: {eq['risk_level'].value if hasattr(eq['risk_level'], 'value') else eq['risk_level']}\n"
            f"Anomaly Score: {eq['anomaly_score']}, RUL: {eq['rul_days']} days\n"
            f"Root Cause: {RNG.choice(ROOT_CAUSES)}\n"
            f"Recommendation: Schedule {RNG.choice(MAINTENANCE_TYPES)} maintenance within "
            f"{RNG.randint(1, 14)} days. Estimated downtime cost: ₹{RNG.randint(50, 500)}K/hr."
        )
        reports.append({
            "id": f"RPT-{i + 1:05d}",
            "equipment_id": eq["id"],
            "report_type": rtype,
            "content": content,
            "created_at": now - timedelta(days=RNG.randint(1, 365)),
        })
    return reports


def generate_ingest_records(
    equipment: list[dict],
    incidents: int = 300,
    delay_logs: int = 200,
    extra: int = 100,
) -> list[dict]:
    now = datetime.now(timezone.utc)
    records: list[dict] = []
    idx = 1

    incident_summaries = [
        "Unplanned shutdown due to high vibration alarm",
        "Hydraulic leak detected during night shift",
        "Motor tripped on overload – production line stopped 45 min",
        "Gearbox oil temperature exceeded 90°C limit",
        "Bearing failure caused emergency stop on rolling mill",
        "Fire alarm triggered near compressor station – false alarm confirmed",
        "Ladle crane malfunction during casting sequence",
        "Conveyor belt tear – material spill contained",
    ]
    for _ in range(incidents):
        eq = RNG.choice(equipment)
        records.append({
            "id": f"ING-{idx:05d}",
            "input_type": "incident",
            "equipment_id": eq["id"],
            "payload_summary": RNG.choice(incident_summaries) + f" [{eq['id']}]",
            "routing": {"workflow": "full_incident", "detected_type": "incident"},
            "status": RNG.choice(["completed", "completed", "completed", "processing"]),
            "created_at": now - timedelta(hours=RNG.randint(1, 8760)),
        })
        idx += 1

    delay_summaries = [
        "Production delay 2.5h – waiting for spare bearing delivery",
        "Shift handover delay – incomplete work permit",
        "Scheduled maintenance overrun by 4 hours",
        "Quality hold – recalibration of roll stand required",
        "Power dip caused 90 min restart sequence",
        "Contractor access delay – hot work permit pending",
    ]
    for _ in range(delay_logs):
        eq = RNG.choice(equipment)
        records.append({
            "id": f"ING-{idx:05d}",
            "input_type": "delay_log",
            "equipment_id": eq["id"],
            "payload_summary": RNG.choice(delay_summaries) + f" – {eq['name']}",
            "routing": {"workflow": "full_incident", "detected_type": "delay_log"},
            "status": "completed",
            "created_at": now - timedelta(hours=RNG.randint(1, 8760)),
        })
        idx += 1

    other_types = ["sensor", "fault_log", "natural_language", "sop", "failure_report", "inventory"]
    for _ in range(extra):
        eq = RNG.choice(equipment)
        itype = RNG.choice(other_types)
        records.append({
            "id": f"ING-{idx:05d}",
            "input_type": itype,
            "equipment_id": eq["id"],
            "payload_summary": f"{itype.replace('_', ' ').title()} input for {eq['id']}",
            "routing": {"workflow": RNG.choice(["sensor_diagnosis", "knowledge_query", "full_incident"])},
            "status": "completed",
            "created_at": now - timedelta(hours=RNG.randint(1, 8760)),
        })
        idx += 1

    return records


def generate_logbook(equipment: list[dict], count: int = 800) -> list[dict]:
    now = datetime.now(timezone.utc)
    event_types = ["diagnosis", "maintenance", "auto_recommendation", "sensor_diagnosis", "incident", "knowledge_query"]
    entries = []
    for i in range(count):
        eq = RNG.choice(equipment)
        evt = RNG.choice(event_types)
        rc = RNG.choice(ROOT_CAUSES)
        entries.append({
            "id": f"LOG-{i + 1:05d}",
            "equipment_id": eq["id"],
            "event_type": evt,
            "diagnosis": f"{evt.replace('_', ' ').title()} event on {eq['name']}",
            "recommendation": f"Schedule {RNG.choice(MAINTENANCE_TYPES)} action within {RNG.randint(1, 72)}h",
            "root_cause": rc,
            "action_taken": RNG.choice([None, None, f"Technician dispatched – {rc} verified", "Work order raised"]),
            "extra_metadata": {"severity": RNG.choice(SEVERITIES), "shift": RNG.choice(["A", "B", "C"])},
            "created_at": now - timedelta(hours=RNG.randint(1, 8760)),
        })
    return entries


def generate_feedback(equipment: list[dict], count: int = 250) -> list[dict]:
    now = datetime.now(timezone.utc)
    outcomes = ["successful", "partial", "failed", "deferred"]
    entries = []
    for i in range(count):
        eq = RNG.choice(equipment)
        entries.append({
            "id": f"FB-{i + 1:05d}",
            "equipment_id": eq["id"],
            "recommendation_correct": RNG.random() < 0.78,
            "actual_root_cause": RNG.choice(ROOT_CAUSES),
            "repair_outcome": RNG.choice(outcomes),
            "notes": f"Field feedback for {eq['id']}: {RNG.choice(['Resolved in single shift', 'Required follow-up inspection', 'Spare parts delayed', 'Root cause confirmed by vibration analysis'])}",
            "created_at": now - timedelta(days=RNG.randint(1, 365)),
        })
    return entries


def generate_inventory(count: int = 120) -> list[dict]:
    items = []
    for i in range(count):
        cat, parts = RNG.choice(INVENTORY_CATEGORIES)
        part = RNG.choice(parts)
        suffix = RNG.randint(1, 99)
        items.append({
            "part_name": f"{part} #{suffix}",
            "category": cat,
            "quantity": RNG.randint(0, 80),
            "reorder_level": RNG.randint(3, 15),
            "unit_cost": round(RNG.uniform(25, 4500), 2),
        })
    return items


def generate_knowledge_docs(equipment: list[dict], count: int = 80) -> list[dict]:
    now = datetime.now(timezone.utc)
    docs = []
    for i in range(count):
        eq = RNG.choice(equipment) if RNG.random() < 0.7 else None
        dtype = RNG.choice(DOC_TYPES)
        eq_part = eq["id"] if eq else "Plant-Wide"
        names = {
            "manual": f"{eq_part}_Operation_Manual_v{RNG.randint(1,5)}.pdf",
            "sop": f"{eq_part}_{RNG.choice(['Startup', 'Shutdown', 'Emergency', 'Lubrication'])}_SOP.docx",
            "checklist": f"{eq_part}_Inspection_Checklist_{RNG.randint(2023, 2025)}.pdf",
            "historical": f"{eq_part}_Maintenance_History_{RNG.randint(2018, 2024)}.xlsx",
            "inspection_record": f"{eq_part}_NDT_Report_{RNG.randint(1,12):02d}.pdf",
            "warranty": f"{eq_part}_Warranty_Certificate.pdf",
            "drawing": f"{eq_part}_P&ID_Drawing_DWG-{RNG.randint(100,999)}.pdf",
        }
        docs.append({
            "id": f"DOC-{i + 1:05d}",
            "filename": names[dtype],
            "doc_type": dtype,
            "equipment_id": eq["id"] if eq else None,
            "size_bytes": RNG.randint(120000, 8500000),
            "indexed": RNG.random() < 0.92,
            "created_at": now - timedelta(days=RNG.randint(1, 1095)),
        })
    return docs


def generate_admin_users(count: int = 55) -> list[dict]:
    now = datetime.now(timezone.utc)
    users = []
    for i in range(count):
        fn = RNG.choice(FIRST_NAMES)
        ln = RNG.choice(LAST_NAMES)
        role = RNG.choice(ROLE_IDS)
        users.append({
            "id": f"USR-{i + 1:04d}",
            "email": f"{fn.lower()}.{ln.lower()}{i}@tatasteel.com",
            "name": f"{fn} {ln}",
            "role_id": role,
            "enabled": RNG.random() < 0.92,
            "created_at": now - timedelta(days=RNG.randint(30, 1200)),
        })
    return users


def generate_audit_logs(equipment: list[dict], alerts: list[dict], count: int = 200) -> list[dict]:
    now = datetime.now(timezone.utc)
    actions = [
        "alert.acknowledge", "alert.assign", "alert.escalate", "ingest", "equipment.update",
        "logbook.create", "feedback.create", "report.generate", "knowledge.upload", "settings.update",
    ]
    logs = []
    for i in range(count):
        action = RNG.choice(actions)
        resource = RNG.choice(equipment)["id"]
        if action.startswith("alert") and alerts:
            resource = RNG.choice(alerts)["id"]
        logs.append({
            "id": f"AUD-{i + 1:05d}",
            "action": action,
            "user": f"{RNG.choice(FIRST_NAMES)} {RNG.choice(LAST_NAMES)}",
            "resource": resource,
            "created_at": now - timedelta(hours=RNG.randint(1, 8760)),
        })
    return logs


def generate_alert_history(alerts: list[dict], count: int = 150) -> list[dict]:
    now = datetime.now(timezone.utc)
    actions = ["acknowledge", "assign", "escalate", "work-order", "resolve"]
    history = []
    sample = alerts[: min(len(alerts), count * 2)]
    for i in range(count):
        alert = RNG.choice(sample)
        action = RNG.choice(actions)
        history.append({
            "id": f"AH-{i + 1:05d}",
            "alert_id": alert["id"],
            "action": action,
            "user": f"{RNG.choice(FIRST_NAMES)} {RNG.choice(LAST_NAMES)}",
            "assignee": f"{RNG.choice(FIRST_NAMES)} {RNG.choice(LAST_NAMES)}" if action == "assign" else None,
            "notes": RNG.choice([None, "Shift handover note", "Escalated to reliability team", "Work order auto-created"]),
            "work_order_id": f"WO-{RNG.randint(10000, 99999)}" if action == "work-order" else None,
            "created_at": now - timedelta(hours=RNG.randint(1, 4320)),
        })
    return history
