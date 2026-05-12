"""
v1 API aggregation router.

All endpoint routers are registered here with a common ``/api/v1`` prefix.
``main.py`` includes only this single router.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import agents, analytics, auth, workspaces

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(workspaces.router)
api_router.include_router(agents.router)
api_router.include_router(analytics.router)