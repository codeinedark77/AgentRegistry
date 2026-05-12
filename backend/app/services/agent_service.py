"""
AgentService — database CRUD for AgentConfig records + Ollama integration.

This service is the *only* layer allowed to issue SQL against agent-related
tables and to call the Ollama HTTP API.  Routers must not import SQLAlchemy
directly; they delegate all persistence to this module.
"""

import logging
import time
from typing import Any

import httpx
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    DuplicateResourceError,
    NotFoundError,
    OllamaConnectionError,
    PermissionDeniedError,
)
from app.models.agent_config import AgentConfig
from app.models.execution_log import ExecutionLog
from app.models.task_queue import TaskQueue, TaskStatus
from app.models.workspace import Workspace
from app.schemas.agent_config import AgentConfigCreate, AgentConfigUpdate

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_GENERATE_ENDPOINT = f"{OLLAMA_BASE_URL}/api/generate"
OLLAMA_TIMEOUT_SECONDS = 120.0   # LLMs can be slow; give generous headroom


# ---------------------------------------------------------------------------
# Ownership guard (reused across CRUD operations)
# ---------------------------------------------------------------------------

async def _assert_workspace_ownership(
    db: AsyncSession,
    workspace_id: int,
    user_id: int,
) -> Workspace:
    """
    Load *workspace_id* from the database and assert it belongs to *user_id*.

    Args:
        db:           Active async DB session.
        workspace_id: Workspace primary key.
        user_id:      Authenticated user's primary key.

    Returns:
        The :class:`Workspace` ORM instance.

    Raises:
        :class:`NotFoundError`:       If the workspace does not exist.
        :class:`PermissionDeniedError`: If the workspace belongs to another user.
    """
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


# ---------------------------------------------------------------------------
# CRUD operations
# ---------------------------------------------------------------------------

async def create_agent(
    db: AsyncSession,
    payload: AgentConfigCreate,
    user_id: int,
) -> AgentConfig:
    """
    Persist a new :class:`AgentConfig` after validating workspace ownership.

    Args:
        db:      Active async DB session.
        payload: Validated :class:`AgentConfigCreate` schema.
        user_id: Authenticated user's primary key (for ownership check).

    Returns:
        The newly created :class:`AgentConfig` ORM instance.
    """
    await _assert_workspace_ownership(db, payload.workspace_id, user_id)

    agent = AgentConfig(
        workspace_id=payload.workspace_id,
        model_name=payload.model_name,
        system_prompt=payload.system_prompt,
        temperature=payload.temperature,
    )
    db.add(agent)
    await db.flush()   # Populate agent.id without committing
    await db.refresh(agent)

    logger.info(
        "Agent config created",
        extra={
            "agent_id": agent.id,
            "model": agent.model_name,
            "workspace_id": agent.workspace_id,
        },
    )
    return agent


async def list_agents(
    db: AsyncSession,
    workspace_id: int,
    user_id: int,
    skip: int = 0,
    limit: int = 20,
) -> list[AgentConfig]:
    """
    Return a paginated list of agents belonging to *workspace_id*.

    Args:
        db:           Active async DB session.
        workspace_id: Filter agents by this workspace.
        user_id:      Used to verify workspace ownership.
        skip:         Number of rows to skip (offset).
        limit:        Maximum rows to return (capped at 100).

    Returns:
        A list of :class:`AgentConfig` ORM instances.
    """
    await _assert_workspace_ownership(db, workspace_id, user_id)
    limit = min(limit, 100)   # Hard cap to prevent abuse

    result = await db.execute(
        select(AgentConfig)
        .where(AgentConfig.workspace_id == workspace_id)
        .order_by(AgentConfig.id)
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_agent_by_id(
    db: AsyncSession,
    agent_id: int,
    user_id: int,
) -> AgentConfig:
    """
    Load a single :class:`AgentConfig` by primary key, asserting ownership.

    Args:
        db:       Active async DB session.
        agent_id: Agent primary key.
        user_id:  Authenticated user's primary key.

    Returns:
        The :class:`AgentConfig` ORM instance.

    Raises:
        :class:`NotFoundError`:       If no agent with *agent_id* exists.
        :class:`PermissionDeniedError`: If the parent workspace belongs to another user.
    """
    result = await db.execute(
        select(AgentConfig).where(AgentConfig.id == agent_id)
    )
    agent = result.scalar_one_or_none()

    if agent is None:
        raise NotFoundError("AgentConfig", agent_id)

    # Verify ownership via parent workspace
    await _assert_workspace_ownership(db, agent.workspace_id, user_id)
    return agent


async def update_agent(
    db: AsyncSession,
    agent_id: int,
    payload: AgentConfigUpdate,
    user_id: int,
) -> AgentConfig:
    """
    Partially update an existing :class:`AgentConfig` (PATCH semantics).

    Only fields explicitly supplied in *payload* are written; ``None``
    values are treated as "no change".

    Args:
        db:       Active async DB session.
        agent_id: Agent primary key.
        payload:  Partial update schema.
        user_id:  Authenticated user's primary key (for ownership check).

    Returns:
        The updated :class:`AgentConfig` ORM instance.
    """
    agent = await get_agent_by_id(db, agent_id, user_id)

    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        return agent   # Nothing to update; return as-is

    await db.execute(
        update(AgentConfig)
        .where(AgentConfig.id == agent_id)
        .values(**update_data)
    )
    await db.flush()
    await db.refresh(agent)

    logger.info(
        "Agent config updated",
        extra={"agent_id": agent_id, "updated_fields": list(update_data.keys())},
    )
    return agent


async def delete_agent(
    db: AsyncSession,
    agent_id: int,
    user_id: int,
) -> None:
    """
    Delete an :class:`AgentConfig` and all cascade-dependent tasks/logs.

    Args:
        db:       Active async DB session.
        agent_id: Agent primary key.
        user_id:  Authenticated user's primary key (for ownership check).
    """
    agent = await get_agent_by_id(db, agent_id, user_id)
    await db.delete(agent)
    await db.flush()

    logger.info("Agent config deleted", extra={"agent_id": agent_id})


# ---------------------------------------------------------------------------
# Ollama integration
# ---------------------------------------------------------------------------

async def execute_task_via_ollama(
    db: AsyncSession,
    task_id: int,
    agent_id: int,
    user_id: int,
) -> ExecutionLog:
    """
    Run an existing :class:`TaskQueue` row against the local Ollama API.

    Workflow:
    1. Load the task and mark it ``RUNNING``.
    2. Build the Ollama request payload, prefixing the agent's system prompt.
    3. POST to ``/api/generate`` and measure wall-clock execution time.
    4. On success, write an :class:`ExecutionLog` and mark the task
       ``COMPLETED``.
    5. On any failure, mark the task ``FAILED`` before re-raising.

    Args:
        db:       Active async DB session.
        task_id:  :class:`TaskQueue` primary key.
        agent_id: :class:`AgentConfig` primary key.
        user_id:  Authenticated user's primary key.

    Returns:
        The persisted :class:`ExecutionLog` ORM instance.

    Raises:
        :class:`NotFoundError`:        If task or agent does not exist.
        :class:`OllamaConnectionError`: If Ollama is unreachable or returns an error.
    """
    # ── 1. Load task ──────────────────────────────────────────────────────
    task_result = await db.execute(
        select(TaskQueue).where(TaskQueue.id == task_id)
    )
    task = task_result.scalar_one_or_none()
    if task is None:
        raise NotFoundError("TaskQueue", task_id)

    agent = await get_agent_by_id(db, agent_id, user_id)

    # ── 2. Mark task as running ───────────────────────────────────────────
    task.status = TaskStatus.RUNNING
    await db.flush()

    # ── 3. Build Ollama request payload ──────────────────────────────────
    full_prompt = (
        f"[SYSTEM]\n{agent.system_prompt}\n\n"
        f"[USER]\n{task.prompt_text}"
    )
    ollama_payload: dict[str, Any] = {
        "model": agent.model_name,
        "prompt": full_prompt,
        "stream": False,
        "options": {
            "temperature": agent.temperature,
        },
    }

    logger.info(
        "Dispatching task to Ollama",
        extra={
            "task_id": task_id,
            "agent_id": agent_id,
            "model": agent.model_name,
        },
    )

    # ── 4. Call Ollama ────────────────────────────────────────────────────
    start_ns = time.perf_counter_ns()
    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT_SECONDS) as client:
            response = await client.post(
                OLLAMA_GENERATE_ENDPOINT,
                json=ollama_payload,
            )
            response.raise_for_status()
            ollama_data = response.json()

    except httpx.ConnectError as exc:
        task.status = TaskStatus.FAILED
        await db.flush()
        raise OllamaConnectionError(
            "Ollama is not running. Start it with `ollama serve`."
        ) from exc

    except httpx.HTTPStatusError as exc:
        task.status = TaskStatus.FAILED
        await db.flush()
        raise OllamaConnectionError(
            f"Ollama returned HTTP {exc.response.status_code}: {exc.response.text}"
        ) from exc

    except httpx.TimeoutException as exc:
        task.status = TaskStatus.FAILED
        await db.flush()
        raise OllamaConnectionError(
            f"Ollama request timed out after {OLLAMA_TIMEOUT_SECONDS}s."
        ) from exc

    elapsed_ms = (time.perf_counter_ns() - start_ns) // 1_000_000
    response_text: str = ollama_data.get("response", "")

    # ── 5. Persist execution log and mark completed ───────────────────────
    log = ExecutionLog(
        task_id=task_id,
        response_text=response_text,
        execution_time_ms=elapsed_ms,
    )
    db.add(log)
    task.status = TaskStatus.COMPLETED
    await db.flush()
    await db.refresh(log)

    logger.info(
        "Task completed successfully",
        extra={
            "task_id": task_id,
            "execution_time_ms": elapsed_ms,
            "model": agent.model_name,
        },
    )
    return log