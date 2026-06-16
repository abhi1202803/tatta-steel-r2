"""Database package – Supabase PostgreSQL via SQLAlchemy (no Prisma)."""

from database.database.models import (
    Alert,
    Base,
    Equipment,
    FailurePrediction,
    MaintenanceEvent,
    SensorReading,
    SpareInventory,
)
from database.database.postgres import check_connection, get_db_session, get_engine, shutdown

__all__ = [
    "Alert",
    "Base",
    "Equipment",
    "FailurePrediction",
    "MaintenanceEvent",
    "SensorReading",
    "SpareInventory",
    "check_connection",
    "get_db_session",
    "get_engine",
    "shutdown",
]
