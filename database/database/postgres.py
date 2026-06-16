"""Supabase PostgreSQL connection via SQLAlchemy async (no ORM framework)."""

import logging
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from config.settings import settings

logger = logging.getLogger(__name__)

_engine = None
_session_factory = None


def _to_async_url(url: str) -> str:
    if url.startswith("sqlite://"):
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    if url.startswith("sqlite+aiosqlite://"):
        return url
    if url.startswith("postgresql+asyncpg://"):
        normalized = url
    elif url.startswith("postgresql://"):
        normalized = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        normalized = url.replace("postgres://", "postgresql+asyncpg://", 1)
    else:
        normalized = url

    # Supabase transaction pooler (6543) breaks prepared statements – use session pooler
    if ":6543/" in normalized:
        normalized = normalized.replace(":6543/", ":5432/")
    return normalized


def _connect_args() -> dict:
    if settings.database_url.startswith("sqlite"):
        return {}
    # Supabase transaction pooler (pgbouncer) requires disabled statement cache
    return {"statement_cache_size": 0, "prepared_statement_cache_size": 0}


def get_engine():
    global _engine
    if _engine is None:
        async_url = _to_async_url(settings.database_url)
        _engine = create_async_engine(
            async_url,
            echo=settings.log_level == "DEBUG",
            pool_pre_ping=True,
            poolclass=NullPool,
            connect_args=_connect_args(),
        )
        logger.info("Supabase PostgreSQL engine initialized")
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(get_engine(), expire_on_commit=False)
    return _session_factory


@asynccontextmanager
async def get_db_session():
    session = get_session_factory()()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def check_connection() -> bool:
    try:
        from sqlalchemy import text

        async with get_engine().connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning("Supabase connection check failed: %s", e)
        return False


async def shutdown():
    global _engine, _session_factory
    if _engine:
        await _engine.dispose()
        _engine = None
        _session_factory = None
