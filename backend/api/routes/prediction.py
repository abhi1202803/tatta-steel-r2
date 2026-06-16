"""Unified prediction routes – aggregates ML pipeline endpoints."""

from fastapi import APIRouter

from api.routes import anomaly, failure, pipeline, rca, risk, rul

router = APIRouter()

router.include_router(pipeline.router)
router.include_router(anomaly.router)
router.include_router(failure.router)
router.include_router(rca.router)
router.include_router(rul.router)
router.include_router(risk.router)
