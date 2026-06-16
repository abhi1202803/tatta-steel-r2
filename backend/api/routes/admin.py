"""Admin panel API – users, roles, permissions, audit logs, settings."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies.database import get_db
from api.schemas import AdminRole, AdminUser, AdminUserCreate, AdminUserUpdate
from services import db_repository as repo

router = APIRouter()

ROLES = [
    AdminRole(id="engineer", name="Maintenance Engineer", permissions=["alerts", "copilot", "equipment", "feedback"]),
    AdminRole(id="manager", name="Maintenance Manager", permissions=["alerts", "reports", "planner", "inventory", "approvals"]),
    AdminRole(id="reliability", name="Reliability Engineer", permissions=["predictive", "rca", "reports", "knowledge"]),
    AdminRole(id="plant_head", name="Plant Head", permissions=["dashboard", "reports", "alerts", "approvals"]),
    AdminRole(id="admin", name="Administrator", permissions=["*"]),
]

PERMISSIONS = [
    "dashboard", "alerts", "reports", "copilot", "equipment", "predictive", "rca",
    "planner", "inventory", "knowledge", "feedback", "approvals", "admin", "ingest", "export",
]


@router.get("/admin/dashboard")
async def admin_dashboard(db: AsyncSession = Depends(get_db)):
    total, active = await repo.count_admin_users(db)
    settings = await repo.get_admin_settings(db)
    return {
        "users": total,
        "active_users": active,
        "roles": len(ROLES),
        "audit_events_24h": await repo.count_audit_logs_24h(db),
        "settings": settings,
    }


@router.get("/admin/roles", response_model=list[AdminRole])
async def list_roles():
    return ROLES


@router.post("/admin/roles", response_model=AdminRole)
async def create_role(role: AdminRole, db: AsyncSession = Depends(get_db)):
    ROLES.append(role)
    await repo.create_audit_log(db, "role.create", "Admin", role.id)
    return role


@router.put("/admin/roles/{role_id}", response_model=AdminRole)
async def update_role(role_id: str, role: AdminRole, db: AsyncSession = Depends(get_db)):
    for i, r in enumerate(ROLES):
        if r.id == role_id:
            ROLES[i] = role
            await repo.create_audit_log(db, "role.update", "Admin", role_id)
            return role
    raise HTTPException(status_code=404, detail="Role not found")


@router.delete("/admin/roles/{role_id}")
async def delete_role(role_id: str, db: AsyncSession = Depends(get_db)):
    if role_id == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin role")
    for i, r in enumerate(ROLES):
        if r.id == role_id:
            ROLES.pop(i)
            await repo.create_audit_log(db, "role.delete", "Admin", role_id)
            return {"deleted": role_id}
    raise HTTPException(status_code=404, detail="Role not found")


@router.get("/admin/permissions")
async def list_permissions():
    return {"permissions": PERMISSIONS, "roles": ROLES}


@router.put("/admin/permissions")
async def update_permissions(body: dict, db: AsyncSession = Depends(get_db)):
    await repo.create_audit_log(db, "permissions.update", "Admin", "global")
    return {"permissions": body.get("permissions", PERMISSIONS), "updated": True}


@router.get("/admin/users", response_model=list[AdminUser])
async def list_users(db: AsyncSession = Depends(get_db)):
    return await repo.list_admin_users(db)


@router.post("/admin/users", response_model=AdminUser)
async def create_user(body: AdminUserCreate, db: AsyncSession = Depends(get_db)):
    user = await repo.create_admin_user(db, body.email, body.name, body.role_id)
    await repo.create_audit_log(db, "user.create", "Admin", user.id)
    return user


@router.put("/admin/users/{user_id}", response_model=AdminUser)
async def update_user(user_id: str, body: AdminUserUpdate, db: AsyncSession = Depends(get_db)):
    user = await repo.update_admin_user(
        db, user_id,
        email=body.email, name=body.name, role_id=body.role_id, enabled=body.enabled,
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await repo.create_audit_log(db, "user.update", "Admin", user_id)
    return user


@router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db)):
    if not await repo.delete_admin_user(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")
    await repo.create_audit_log(db, "user.delete", "Admin", user_id)
    return {"deleted": user_id}


@router.put("/admin/users/{user_id}/disable")
async def disable_user(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await repo.update_admin_user(db, user_id, enabled=False)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await repo.create_audit_log(db, "user.disable", "Admin", user_id)
    return user


@router.put("/admin/users/{user_id}/enable")
async def enable_user(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await repo.update_admin_user(db, user_id, enabled=True)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await repo.create_audit_log(db, "user.enable", "Admin", user_id)
    return user


@router.get("/admin/audit-logs")
async def list_audit_logs(limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await repo.list_audit_logs(db, limit)


@router.get("/admin/activity")
async def list_activity(limit: int = 50, db: AsyncSession = Depends(get_db)):
    return await repo.list_audit_logs(db, limit)


@router.get("/admin/settings")
async def get_settings(db: AsyncSession = Depends(get_db)):
    return await repo.get_admin_settings(db)


@router.put("/admin/settings")
async def update_settings(body: dict, db: AsyncSession = Depends(get_db)):
    settings = await repo.upsert_admin_settings(db, body)
    await repo.create_audit_log(db, "settings.update", "Admin", "global")
    return settings
