"""
Agent configuration endpoints — full CRUD.
"""
from app.schemas.task_queue import TaskCreate, TaskRead
from fastapi import APIRouter, Query, status
from pydantic import BaseModel, Field

from app.api.deps import CurrentUser, DbSession
from app.schemas.agent_config import AgentConfigCreate, AgentConfigRead, AgentConfigUpdate
from app.schemas.execution_log import ExecutionLogRead
from app.services import agent_service
from app.models.task_queue import TaskQueue
from app.services.task_service import run_agent_task

router = APIRouter(prefix="/agents", tags=["Agents"])

# Define the missing schema right here so Pyright is happy
class TaskCreate(BaseModel):
    prompt_text: str = Field(..., min_length=1)
    agent_id: int | None = None  # Added so the frontend payload doesn't cause a 422 error

@router.post(
    "/",
    response_model=AgentConfigRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new agent configuration",
)
async def create_agent(
    payload: AgentConfigCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> AgentConfigRead:
    agent = await agent_service.create_agent(db, payload, current_user.id)
    return AgentConfigRead.model_validate(agent)

@router.get(
    "/",
    response_model=list[AgentConfigRead],
    summary="List agent configs for a workspace",
)
async def list_agents(
    workspace_id: int,
    db: DbSession,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[AgentConfigRead]:
    agents = await agent_service.list_agents(
        db, workspace_id, current_user.id, skip, limit
    )
    return [AgentConfigRead.model_validate(a) for a in agents]

@router.get(
    "/{agent_id}",
    response_model=AgentConfigRead,
    summary="Retrieve a single agent configuration",
)
async def get_agent(
    agent_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> AgentConfigRead:
    agent = await agent_service.get_agent_by_id(db, agent_id, current_user.id)
    return AgentConfigRead.model_validate(agent)

@router.patch(
    "/{agent_id}",
    response_model=AgentConfigRead,
    summary="Partially update an agent configuration",
)
async def update_agent(
    agent_id: int,
    payload: AgentConfigUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> AgentConfigRead:
    agent = await agent_service.update_agent(db, agent_id, payload, current_user.id)
    return AgentConfigRead.model_validate(agent)

@router.delete(
    "/{agent_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an agent and all dependent tasks/logs",
)
async def delete_agent(
    agent_id: int,
    db: DbSession,
    current_user: CurrentUser,
) -> None:
    await agent_service.delete_agent(db, agent_id, current_user.id)

@router.post(
    "/{agent_id}/run",
    response_model=ExecutionLogRead,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a prompt and run it via the ReAct God Mode loop",
)
async def run_agent(
    agent_id: int,
    payload: TaskCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> ExecutionLogRead:
    # We bypass the old logic and fire up the autonomous ReAct engine!
    execution_log = await run_agent_task(
        db=db, 
        agent_id=agent_id, 
        prompt_text=payload.prompt_text
    )
    
    # Return the validated Pydantic model back to the Next.js frontend
    return ExecutionLogRead.model_validate(execution_log)