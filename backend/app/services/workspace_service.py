"""
WorkspaceService — CRUD operations for Workspace records.
"""

import logging
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateResourceError, NotFoundError, PermissionDeniedError
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate

logger = logging.getLogger(__name__)


async def create_workspace(
    db: AsyncSession,
    payload: WorkspaceCreate,
    user_id: int,
) -> Workspace:
    """Create a new workspace owned by *user_id*."""
    workspace = Workspace(
        user_id=user_id,
        name=payload.name,
        description=payload.description,
    )
    db.add(workspace)
    try:
        await db.flush()
    except IntegrityError as exc:
        raise DuplicateResourceError("Workspace", "name", payload.name) from exc

    await db.refresh(workspace)
    logger.info("Workspace created", extra={"workspace_id": workspace.id, "user_id": user_id})
    return workspace


async def list_workspaces(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 20,
) -> list[Workspace]:
    """Return all workspaces owned by *user_id*, paginated."""
    result = await db.execute(
        select(Workspace)
        .where(Workspace.user_id == user_id)
        .order_by(Workspace.id)
        .offset(skip)
        .limit(min(limit, 100))
    )
    return list(result.scalars().all())


async def get_workspace_by_id(
    db: AsyncSession,
    workspace_id: int,
    user_id: int,
) -> Workspace:
    """Load a single workspace, asserting ownership."""
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id)
    )
    workspace = result.scalar_one_or_none()
    if workspace is None:
        raise NotFoundError("Workspace", workspace_id)
    if workspace.user_id != user_id:
        raise PermissionDeniedError(
            f"Workspace {workspace_id} does not belong to user {user_id}."
        )
    return workspace


async def update_workspace(
    db: AsyncSession,
    workspace_id: int,
    payload: WorkspaceUpdate,
    user_id: int,
) -> Workspace:
    """Partially update a workspace (PATCH semantics)."""
    workspace = await get_workspace_by_id(db, workspace_id, user_id)
    update_data = payload.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(workspace, field, value)
    await db.flush()
    await db.refresh(workspace)
    return workspace


async def delete_workspace(
    db: AsyncSession,
    workspace_id: int,
    user_id: int,
) -> None:
    """
    Delete a workspace and all cascade-dependent agents/tasks/logs.

    The ON DELETE CASCADE constraints on the FK columns handle
    child-row cleanup at the database level.
    """
    workspace = await get_workspace_by_id(db, workspace_id, user_id)
    await db.delete(workspace)
    await db.flush()
    logger.info("Workspace deleted", extra={"workspace_id": workspace_id, "user_id": user_id})