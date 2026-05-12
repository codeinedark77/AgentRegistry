"""
Workspace endpoints — CRUD for workspace management.

POST   /api/v1/workspaces/       → Create a workspace.
GET    /api/v1/workspaces/       → List the current user's workspaces.
GET    /api/v1/workspaces/{id}   → Retrieve one workspace.
PATCH  /api/v1/workspaces/{id}   → Rename / re-describe.
DELETE /api/v1/workspaces/{id}   → Cascade-delete workspace + all children.
"""

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.workspace import WorkspaceCreate, WorkspaceRead, WorkspaceUpdate
from app.services import workspace_service

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post("/", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    payload: WorkspaceCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> WorkspaceRead:
    """Create a workspace owned by the currently authenticated user."""
    ws = await workspace_service.create_workspace(db, payload, current_user.id)
    return WorkspaceRead.model_validate(ws)


@router.get("/", response_model=list[WorkspaceRead])
async def list_workspaces(
    db: DbSession,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[WorkspaceRead]:
    """Return all workspaces owned by the authenticated user."""
    workspaces = await workspace_service.list_workspaces(
        db, current_user.id, skip, limit
    )
    return [WorkspaceRead.model_validate(w) for w in workspaces]


@router.get("/{workspace_id}", response_model=WorkspaceRead)
async def get_workspace(
    workspace_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> WorkspaceRead:
    ws = await workspace_service.get_workspace_by_id(db, workspace_id, current_user.id)
    return WorkspaceRead.model_validate(ws)


@router.patch("/{workspace_id}", response_model=WorkspaceRead)
async def update_workspace(
    workspace_id: int,
    payload: WorkspaceUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> WorkspaceRead:
    ws = await workspace_service.update_workspace(db, workspace_id, payload, current_user.id)
    return WorkspaceRead.model_validate(ws)


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> None:
    """
    Permanently delete a workspace and **all** of its agents, tasks, and logs.

    This is a hard-delete with no recovery path.
    """
    await workspace_service.delete_workspace(db, workspace_id, current_user.id)