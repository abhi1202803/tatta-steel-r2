"""FastAPI database dependencies."""

from collections.abc import AsyncGenerator

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from database.database.postgres import get_session_factory
from models.registry import ModelRegistry


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    session = get_session_factory()()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


def get_registry(request: Request) -> ModelRegistry:
    return request.app.state.model_registry
