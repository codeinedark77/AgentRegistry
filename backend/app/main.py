"""
AgentRegistry — FastAPI application factory.

This module is the single entry point.  It wires together:
- Application metadata
- CORS middleware
- Structured logging
- Custom exception handlers
- The versioned API router
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.

    - **Startup**: configure structured logging.
    - **Shutdown**: any cleanup (connection pool disposal, etc.) goes here.
    """
    configure_logging(debug=settings.DEBUG)
    yield
    # Future: await engine.dispose()


def create_app() -> FastAPI:
    """
    Construct and configure the FastAPI application instance.

    Returns:
        A fully configured :class:`FastAPI` application.
    """
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=(
            "AgentRegistry — Local Multi-Agent Orchestrator. "
            "Manage, monitor, and execute local LLMs via Ollama."
        ),
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ────────────────────────────────────────────────
    register_exception_handlers(app)

    # ── Routers ───────────────────────────────────────────────────────────
    app.include_router(api_router)

    return app


app = create_app()