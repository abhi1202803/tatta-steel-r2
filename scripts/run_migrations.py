"""Apply PostgreSQL migrations to Supabase (idempotent, non-destructive)."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

_root = Path(__file__).resolve().parent.parent
for _path in (_root, _root / "backend"):
    entry = str(_path)
    if entry not in sys.path:
        sys.path.insert(0, entry)

from sqlalchemy import text

from database.database.postgres import check_connection, get_engine

MIGRATIONS_DIR = _root / "database" / "migrations"


def _strip_sql_comments(sql: str) -> str:
    lines = []
    for line in sql.splitlines():
        if line.strip().startswith("--"):
            continue
        lines.append(line)
    return "\n".join(lines)


def _split_statements(sql: str) -> list[str]:
    cleaned = _strip_sql_comments(sql)
    return [s.strip() for s in cleaned.split(";") if s.strip()]


async def apply_migrations() -> None:
    if not await check_connection():
        raise RuntimeError("Cannot connect to Supabase – set DATABASE_URL in .env")

    sql_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not sql_files:
        raise RuntimeError(f"No migration files found in {MIGRATIONS_DIR}")

    engine = get_engine()

    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                    filename VARCHAR(255) PRIMARY KEY,
                    applied_at TIMESTAMPTZ DEFAULT NOW()
                )
                """
            )
        )

        result = await conn.execute(text("SELECT filename FROM schema_migrations"))
        applied = {row[0] for row in result.fetchall()}

        eq_check = await conn.execute(
            text("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment')")
        )
        if eq_check.scalar() and "001_init.sql" not in applied:
            await conn.execute(
                text("INSERT INTO schema_migrations (filename) VALUES ('001_init.sql') ON CONFLICT DO NOTHING")
            )
            applied.add("001_init.sql")
            print("  skip  001_init.sql (equipment table already exists)")

    for sql_file in sql_files:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT filename FROM schema_migrations"))
            applied = {row[0] for row in result.fetchall()}

            if sql_file.name in applied:
                print(f"  skip  {sql_file.name} (already applied)")
                continue

            print(f"  apply {sql_file.name} ...")
            sql = sql_file.read_text(encoding="utf-8")
            statements = _split_statements(sql)
            for statement in statements:
                await conn.execute(text(statement))
            await conn.execute(
                text("INSERT INTO schema_migrations (filename) VALUES (:name)"),
                {"name": sql_file.name},
            )
            print(f"  done  {sql_file.name}")

    # Verify critical columns exist
    async with engine.connect() as conn:
        col_check = await conn.execute(
            text(
                """
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'equipment' AND column_name IN ('criticality', 'manufacturer')
                """
            )
        )
        cols = {row[0] for row in col_check.fetchall()}
        missing = {"criticality", "manufacturer"} - cols
        if missing:
            raise RuntimeError(f"Schema sync failed – equipment missing columns: {missing}")
        print(f"  verified equipment columns: {sorted(cols)}")

    print("Migrations complete.")


if __name__ == "__main__":
    asyncio.run(apply_migrations())
