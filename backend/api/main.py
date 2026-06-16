"""Backward-compatible re-export. Prefer `main:app` as the uvicorn entrypoint."""

from main import app

__all__ = ["app"]
