"""TimescaleDB extension helpers – optional; Supabase uses standard PostgreSQL indexes."""

from database.database.postgres import get_engine

__all__ = ["get_engine"]
