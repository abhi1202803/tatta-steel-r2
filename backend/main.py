"""Industrial Agentic AI Maintenance Copilot – FastAPI Application."""

import sys
from pathlib import Path

_root = Path(__file__).resolve().parent.parent
for _path in (_root, _root / "backend"):
    _entry = str(_path)
    if _entry not in sys.path:
        sys.path.insert(0, _entry)

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import make_asgi_app

from api.middleware.logging import RequestLoggingMiddleware
from api.routes import (
    admin,
    alerts,
    assets,
    chat,
    dashboard,
    export,
    feedback,
    ingest,
    inventory,
    knowledge,
    logbook,
    maintenance,
    prediction,
    reports,
)
from config.logging_config import setup_logging
from config.settings import settings
from database.database.postgres import check_connection, shutdown as shutdown_db
from models.registry import ModelRegistry


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    registry = ModelRegistry()
    await registry.initialize()
    app.state.model_registry = registry
    app.state.supabase_connected = await check_connection()
    yield
    await registry.shutdown()
    await shutdown_db()


app = FastAPI(
    title="Industrial Agentic AI Maintenance Copilot",
    description="Enterprise predictive maintenance platform with 9-layer ML pipeline and multi-agent orchestration",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

PREFIX = "/api/v1"
app.include_router(prediction.router, prefix=PREFIX, tags=["Predictions"])
app.include_router(maintenance.router, prefix=PREFIX, tags=["Maintenance"])
app.include_router(reports.router, prefix=PREFIX, tags=["Reports"])
app.include_router(alerts.router, prefix=PREFIX, tags=["Alerts"])
app.include_router(inventory.router, prefix=PREFIX, tags=["Inventory"])
app.include_router(assets.router, prefix=PREFIX, tags=["Assets"])
app.include_router(knowledge.router, prefix=PREFIX, tags=["Knowledge RAG"])
app.include_router(chat.router, prefix=PREFIX, tags=["Copilot Chat"])
app.include_router(dashboard.router, prefix=PREFIX, tags=["Dashboard"])
app.include_router(ingest.router, prefix=PREFIX, tags=["Ingest"])
app.include_router(logbook.router, prefix=PREFIX, tags=["Logbook"])
app.include_router(feedback.router, prefix=PREFIX, tags=["Feedback"])
app.include_router(admin.router, prefix=PREFIX, tags=["Admin"])
app.include_router(export.router, prefix=PREFIX, tags=["Export"])


@app.get("/health")
async def health_check(request: Request):
    return {
        "status": "healthy",
        "service": "maintenance-copilot-api",
        "version": "1.0.0",
        "supabase": "connected" if getattr(request.app.state, "supabase_connected", False) else "not_configured",
    }
