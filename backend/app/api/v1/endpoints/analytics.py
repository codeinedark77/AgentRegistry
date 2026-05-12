"""
Analytics endpoints — aggregate reporting via multi-table JOINs.

GET /api/v1/analytics/model-report  → Avg execution time + success rate per model.
"""

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.schemas.execution_log import ModelAnalyticsReport
from app.services.analytics_service import get_model_analytics_report

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/model-report",
    response_model=list[ModelAnalyticsReport],
    summary="Average execution time and task success rate per model",
)
async def model_analytics_report(
    db: DbSession,
    current_user: CurrentUser,
    workspace_id: int | None = Query(
        None,
        description="Scope the report to a single workspace. Omit for global view.",
    ),
) -> list[ModelAnalyticsReport]:
    """
    Execute a 3-table JOIN across ``agent_configs``, ``task_queue``, and
    ``execution_logs`` to return aggregate performance metrics per model.

    Response fields per model:
    - ``total_tasks``            — All tasks dispatched.
    - ``completed_tasks``        — Tasks that finished successfully.
    - ``failed_tasks``           — Tasks that errored.
    - ``avg_execution_time_ms``  — Mean wall-clock time in milliseconds.
    - ``min_execution_time_ms``  — Fastest observed response.
    - ``max_execution_time_ms``  — Slowest observed response.

    Results are ordered by ``avg_execution_time_ms`` ascending (fastest
    model first).
    """
    return await get_model_analytics_report(db, workspace_id)