"""Backward-compatible re-export."""

from database.database.postgres import (
    check_connection,
    get_db_session,
    get_engine,
    get_session_factory,
    shutdown,
)

__all__ = [
    "check_connection",
    "get_db_session",
    "get_engine",
    "get_session_factory",
    "shutdown",
]
