from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from api.data_store import ALERTS, EQUIPMENT_REGISTRY
from api.dependencies.database import get_db
from api.schemas import DashboardOverview, HealthStatus, RiskLevel
from services.db_data import fetch_dashboard, fetch_failure_trend

router = APIRouter()


def _fallback_overview() -> DashboardOverview:
    equipment = EQUIPMENT_REGISTRY
    healthy = sum(1 for e in equipment if e.health_status == HealthStatus.NORMAL)
    warning = sum(1 for e in equipment if e.health_status == HealthStatus.WARNING)
    critical = sum(1 for e in equipment if e.health_status in (HealthStatus.ANOMALY, HealthStatus.CRITICAL))

    risk_dist = {}
    for level in RiskLevel:
        risk_dist[level.value] = sum(1 for e in equipment if e.risk_level == level)

    anomaly_trend = [
        {"timestamp": f"2025-06-0{i}", "score": round(0.3 + i * 0.08, 2)}
        for i in range(1, 8)
    ]

    return DashboardOverview(
        total_equipment=len(equipment),
        healthy_count=healthy,
        warning_count=warning,
        critical_count=critical,
        avg_rul_days=round(sum(e.rul_days for e in equipment) / len(equipment), 1),
        active_alerts=len(ALERTS),
        maintenance_scheduled=2,
        cost_savings_mtd=125000.0,
        equipment_summary=equipment,
        recent_alerts=ALERTS,
        risk_distribution=risk_dist,
        anomaly_trend=anomaly_trend,
    )


async def _get_overview(db: AsyncSession) -> DashboardOverview:
    try:
        overview = await fetch_dashboard(db)
        if overview:
            return overview
    except Exception:
        pass
    return _fallback_overview()


@router.get("/dashboard/overview", response_model=DashboardOverview)
async def get_dashboard_overview(db: AsyncSession = Depends(get_db)):
    return await _get_overview(db)


@router.get("/dashboard/health")
async def get_dashboard_health(db: AsyncSession = Depends(get_db)):
    overview = await _get_overview(db)
    health_pct = round((overview.healthy_count / overview.total_equipment) * 100, 1) if overview.total_equipment else 0
    return {
        "plant_health_pct": health_pct,
        "healthy": overview.healthy_count,
        "warning": overview.warning_count,
        "critical": overview.critical_count,
        "total": overview.total_equipment,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/dashboard/risk-distribution")
async def get_risk_distribution(db: AsyncSession = Depends(get_db)):
    overview = await _get_overview(db)
    return {"distribution": overview.risk_distribution}


@router.get("/dashboard/anomaly-trend")
async def get_anomaly_trend(db: AsyncSession = Depends(get_db)):
    overview = await _get_overview(db)
    return {"trend": overview.anomaly_trend}


@router.get("/dashboard/rul-trend")
async def get_rul_trend(db: AsyncSession = Depends(get_db)):
    equipment = (await _get_overview(db)).equipment_summary
    return {
        "trend": [
            {"equipment_id": e.id, "name": e.name, "rul_days": e.rul_days, "risk_level": e.risk_level.value}
            for e in equipment
        ]
    }


@router.get("/dashboard/failure-trend")
async def get_failure_trend(db: AsyncSession = Depends(get_db)):
    return {"trend": await fetch_failure_trend(db)}


@router.get("/dashboard/critical-assets")
async def get_critical_assets(db: AsyncSession = Depends(get_db)):
    equipment = (await _get_overview(db)).equipment_summary
    critical = [e for e in equipment if e.risk_level in (RiskLevel.CRITICAL, RiskLevel.HIGH)]
    critical.sort(key=lambda e: e.rul_days)
    return {"assets": critical}
