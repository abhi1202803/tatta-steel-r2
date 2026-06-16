"""Seed Supabase with industrial-scale maintenance data for production-ready demos."""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

_root = Path(__file__).resolve().parent.parent
for _path in (_root, _root / "backend"):
    entry = str(_path)
    if entry not in sys.path:
        sys.path.insert(0, entry)

from sqlalchemy import func, select

from api.data_store import ADMIN_SETTINGS
from database.database.models import (
    AdminSetting,
    AdminUser,
    Alert,
    AlertHistory,
    AuditLog,
    Base,
    Equipment,
    FailurePrediction,
    FeedbackEntry,
    IngestRecord,
    KnowledgeDocument,
    LogbookEntry,
    MaintenanceEvent,
    ReportRecord,
    SensorReading,
    SpareInventory,
)
from database.database.postgres import check_connection, get_db_session, get_engine
_scripts = _root / "scripts"
if str(_scripts) not in sys.path:
    sys.path.insert(0, str(_scripts))

from seed_industrial_data import (
    TARGETS,
    generate_admin_users,
    generate_alert_history,
    generate_alerts,
    generate_audit_logs,
    generate_equipment,
    generate_failure_predictions,
    generate_feedback,
    generate_ingest_records,
    generate_inventory,
    generate_knowledge_docs,
    generate_logbook,
    generate_maintenance_events,
    generate_reports,
    generate_sensor_readings,
)

BATCH_SIZE = 2000


async def _count(db, model) -> int:
    result = await db.execute(select(func.count()).select_from(model))
    return result.scalar() or 0


async def _bulk_insert(db, model, rows: list[dict], batch_size: int = BATCH_SIZE) -> int:
    if not rows:
        return 0
    inserted = 0
    for i in range(0, len(rows), batch_size):
        chunk = rows[i : i + batch_size]
        db.add_all([model(**row) for row in chunk])
        await db.flush()
        inserted += len(chunk)
    return inserted


async def _upsert_equipment(db, assets: list[dict]) -> int:
    count = 0
    for eq in assets:
        existing = await db.get(Equipment, eq["id"])
        if existing:
            existing.name = eq["name"]
            existing.type = eq["type"]
            existing.location = eq["location"]
            existing.criticality = eq["criticality"]
            existing.manufacturer = eq["manufacturer"]
            existing.age_days = eq["age_days"]
            existing.status = "active"
            existing.install_date = eq["install_date"]
        else:
            db.add(
                Equipment(
                    id=eq["id"],
                    name=eq["name"],
                    type=eq["type"],
                    location=eq["location"],
                    criticality=eq["criticality"],
                    manufacturer=eq["manufacturer"],
                    install_date=eq["install_date"],
                    age_days=eq["age_days"],
                    status="active",
                )
            )
            count += 1
    await db.flush()
    return count


async def _seed_admin_settings(db) -> None:
    for key, value in ADMIN_SETTINGS.items():
        if await db.get(AdminSetting, key):
            continue
        stored = json.dumps(value) if not isinstance(value, str) else value
        db.add(AdminSetting(key=key, value=stored))


async def seed(force: bool = False) -> None:
    if not await check_connection():
        raise RuntimeError("Cannot connect to Supabase – check DATABASE_URL in .env")

    # Ensure all tables exist (migrations should have run first)
    async with get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("Generating industrial-scale seed data...")
    equipment = generate_equipment(TARGETS["equipment"])
    sensor_rows = generate_sensor_readings(equipment, TARGETS["sensor_readings"])
    alert_rows = generate_alerts(equipment, TARGETS["alerts"])
    maint_rows = generate_maintenance_events(equipment, TARGETS["maintenance_events"])
    pred_rows = generate_failure_predictions(equipment, TARGETS["failure_predictions"])
    report_rows = generate_reports(equipment, TARGETS["failure_reports"])
    ingest_rows = generate_ingest_records(
        equipment,
        incidents=TARGETS["incidents"],
        delay_logs=TARGETS["delay_logs"],
        extra=TARGETS["ingest_records"] - TARGETS["incidents"] - TARGETS["delay_logs"],
    )
    logbook_rows = generate_logbook(equipment, TARGETS["logbook_entries"])
    feedback_rows = generate_feedback(equipment, TARGETS["feedback"])
    inventory_rows = generate_inventory(TARGETS["spare_inventory"])
    knowledge_rows = generate_knowledge_docs(equipment, TARGETS["knowledge_documents"])
    user_rows = generate_admin_users(TARGETS["admin_users"])
    audit_rows = generate_audit_logs(equipment, alert_rows, TARGETS["audit_logs"])
    alert_hist_rows = generate_alert_history(alert_rows, min(150, len(alert_rows)))

    async with get_db_session() as db:
        existing_eq = await _count(db, Equipment)
        if existing_eq >= TARGETS["equipment"] and not force:
            print(f"  equipment: {existing_eq} already present (target {TARGETS['equipment']})")
        else:
            added = await _upsert_equipment(db, equipment)
            print(f"  equipment: {len(equipment)} total ({added} new)")

        tables_plan = [
            (SensorReading, sensor_rows, "sensor_readings", TARGETS["sensor_readings"]),
            (Alert, alert_rows, "alerts", TARGETS["alerts"]),
            (MaintenanceEvent, maint_rows, "maintenance_events", TARGETS["maintenance_events"]),
            (FailurePrediction, pred_rows, "failure_predictions", TARGETS["failure_predictions"]),
            (ReportRecord, report_rows, "reports", TARGETS["failure_reports"]),
            (IngestRecord, ingest_rows, "ingest_history", len(ingest_rows)),
            (LogbookEntry, logbook_rows, "logbook_entries", TARGETS["logbook_entries"]),
            (FeedbackEntry, feedback_rows, "feedback_entries", TARGETS["feedback"]),
            (KnowledgeDocument, knowledge_rows, "knowledge_documents", TARGETS["knowledge_documents"]),
            (AdminUser, user_rows, "admin_users", TARGETS["admin_users"]),
            (AuditLog, audit_rows, "audit_logs", TARGETS["audit_logs"]),
            (AlertHistory, alert_hist_rows, "alert_history", len(alert_hist_rows)),
        ]

        for model, rows, label, target in tables_plan:
            current = await _count(db, model)
            if current >= target and not force:
                print(f"  {label}: {current} already present (target {target})")
                continue

            if force and current > 0 and model not in (SensorReading, MaintenanceEvent, FailurePrediction):
                # For keyed tables, skip duplicates by filtering existing IDs
                if hasattr(model, "id") and rows and "id" in rows[0]:
                    existing_ids = set(
                        (await db.execute(select(model.id).limit(50000))).scalars().all()
                    )
                    rows = [r for r in rows if r["id"] not in existing_ids]

            needed = max(0, target - current) if not force else len(rows)
            to_insert = rows[:needed] if not force else rows

            if model == SpareInventory:
                pass  # handled separately
            elif to_insert:
                n = await _bulk_insert(db, model, to_insert)
                print(f"  {label}: +{n} (now {current + n}, target {target})")

        inv_count = await _count(db, SpareInventory)
        if inv_count < TARGETS["spare_inventory"]:
            to_add = inventory_rows[: TARGETS["spare_inventory"] - inv_count]
            if to_add:
                n = await _bulk_insert(db, SpareInventory, to_add)
                print(f"  spare_inventory: +{n} (now {inv_count + n}, target {TARGETS['spare_inventory']})")
        else:
            print(f"  spare_inventory: {inv_count} already present")

        await _seed_admin_settings(db)

    print("\nSeed complete. Summary targets:")
    for key, val in TARGETS.items():
        print(f"  {key}: {val}")


async def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Supabase with industrial maintenance data")
    parser.add_argument("--force", action="store_true", help="Insert additional data even if targets met")
    parser.add_argument("--migrate", action="store_true", help="Run migrations before seeding")
    args = parser.parse_args()

    if args.migrate:
        from run_migrations import apply_migrations

        await apply_migrations()

    await seed(force=args.force)


if __name__ == "__main__":
    asyncio.run(main())
