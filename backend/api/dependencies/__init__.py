"""FastAPI dependencies."""

from api.dependencies.database import get_db, get_registry

__all__ = ["get_db", "get_registry"]
