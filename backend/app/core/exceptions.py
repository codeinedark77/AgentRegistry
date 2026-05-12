"""
Application-wide custom exceptions and FastAPI exception handlers.

Register handlers in ``main.py`` via ``app.add_exception_handler()``.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


# ---------------------------------------------------------------------------
# Domain exception hierarchy
# ---------------------------------------------------------------------------

class AgentRegistryError(Exception):
    """Base class for all domain exceptions."""


class NotFoundError(AgentRegistryError):
    """Raised when a requested resource does not exist in the database."""

    def __init__(self, resource: str, resource_id: int | str) -> None:
        self.resource = resource
        self.resource_id = resource_id
        super().__init__(f"{resource} with id={resource_id!r} not found.")


class PermissionDeniedError(AgentRegistryError):
    """Raised when an authenticated user lacks the required role/ownership."""


class DuplicateResourceError(AgentRegistryError):
    """Raised on unique-constraint violations (e.g. duplicate workspace name)."""

    def __init__(self, resource: str, field: str, value: str) -> None:
        self.resource = resource
        self.field = field
        self.value = value
        super().__init__(f"{resource} with {field}={value!r} already exists.")


class OllamaConnectionError(AgentRegistryError):
    """Raised when the local Ollama API is unreachable or returns an error."""


class InvalidCredentialsError(AgentRegistryError):
    """Raised during authentication when credentials are invalid."""


# ---------------------------------------------------------------------------
# FastAPI exception handlers
# ---------------------------------------------------------------------------

def _error_envelope(status_code: int, error: str, detail: str) -> JSONResponse:
    """Return a consistent JSON error envelope."""
    return JSONResponse(
        status_code=status_code,
        content={"error": error, "detail": detail},
    )


async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return _error_envelope(
        status.HTTP_404_NOT_FOUND,
        "NOT_FOUND",
        str(exc),
    )


async def permission_denied_handler(
    request: Request, exc: PermissionDeniedError
) -> JSONResponse:
    return _error_envelope(
        status.HTTP_403_FORBIDDEN,
        "PERMISSION_DENIED",
        str(exc),
    )


async def duplicate_resource_handler(
    request: Request, exc: DuplicateResourceError
) -> JSONResponse:
    return _error_envelope(
        status.HTTP_409_CONFLICT,
        "DUPLICATE_RESOURCE",
        str(exc),
    )


async def ollama_connection_handler(
    request: Request, exc: OllamaConnectionError
) -> JSONResponse:
    return _error_envelope(
        status.HTTP_503_SERVICE_UNAVAILABLE,
        "OLLAMA_UNAVAILABLE",
        str(exc),
    )


async def invalid_credentials_handler(
    request: Request, exc: InvalidCredentialsError
) -> JSONResponse:
    return _error_envelope(
        status.HTTP_401_UNAUTHORIZED,
        "INVALID_CREDENTIALS",
        str(exc),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """
    Register all custom domain exception handlers on the FastAPI app.

    Call this once in the application factory (``main.py``).
    """
    app.add_exception_handler(NotFoundError, not_found_handler)              # type: ignore[arg-type]
    app.add_exception_handler(PermissionDeniedError, permission_denied_handler)  # type: ignore[arg-type]
    app.add_exception_handler(DuplicateResourceError, duplicate_resource_handler)  # type: ignore[arg-type]
    app.add_exception_handler(OllamaConnectionError, ollama_connection_handler)  # type: ignore[arg-type]
    app.add_exception_handler(InvalidCredentialsError, invalid_credentials_handler)  # type: ignore[arg-type]