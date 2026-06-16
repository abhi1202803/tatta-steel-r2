"""Authentication middleware stub – extend with Supabase JWT validation."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Public API for hackathon demo; add Supabase JWT verification here for production.
        return await call_next(request)
