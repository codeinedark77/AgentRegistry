"""
AnalyticsService — complex multi-table JOIN queries for reporting.

This module owns every query that spans more than one table.
The analytics endpoint delegates entirely to these functions.
"""

import logging
from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent_config import AgentConfig
from app.models.execution_log import ExecutionLog
from app.models.task_queue import TaskQueue, TaskStatus
from app.schemas.execution_log import ModelAnalyticsReport

logger = logging.getLogger(__name__)


async def get_model_analytics_report(
    db: AsyncSession,
    workspace_id: int | None = None,
) -> list[ModelAnalyticsReport]:
    """
    Execute a 3-table JOIN to compute per-model performance statistics.
    """
    # Build the core 3-table join
    stmt = (
        select(
            AgentConfig.model_name,
            func.count(TaskQueue.id).label("total_tasks"),
            func.count(
                case((TaskQueue.status == TaskStatus.COMPLETED, TaskQueue.id))
            ).label("completed_tasks"),
            func.count(
                case((TaskQueue.status == TaskStatus.FAILED, TaskQueue.id))
            ).label("failed_tasks"),
            func.avg(ExecutionLog.execution_time_ms).label("avg_execution_time_ms"),
            func.min(ExecutionLog.execution_time_ms).label("min_execution_time_ms"),
            func.max(ExecutionLog.execution_time_ms).label("max_execution_time_ms"),
        )
        .join(TaskQueue, TaskQueue.agent_id == AgentConfig.id)
        .join(ExecutionLog, ExecutionLog.task_id == TaskQueue.id)
        .group_by(AgentConfig.model_name)
        .order_by(func.avg(ExecutionLog.execution_time_ms).asc())
    )

    # Optional workspace filter (scopes the report to one user's workspace)
    if workspace_id is not None:
        stmt = stmt.where(AgentConfig.workspace_id == workspace_id)

    result = await db.execute(stmt)
    rows = result.all()

    logger.info(
        "Analytics report generated",
        extra={"row_count": len(rows), "workspace_filter": workspace_id},
    )

    report = []
    for row in rows:
        # 1. Handle Nulls and set defaults
        total = row.total_tasks or 0
        completed = row.completed_tasks or 0
        
        # 2. Calculate Success Rate (The "God Mode" Metric)
        success_rate = (completed / total * 100) if total > 0 else 0.0

        report.append(
            ModelAnalyticsReport(
                model_name=row.model_name,
                total_tasks=total,
                completed_tasks=completed,
                failed_tasks=row.failed_tasks or 0,
                # 3. Round to 2 decimal places for clean UI
                success_rate=round(success_rate, 2),
                avg_execution_time_ms=round(float(row.avg_execution_time_ms or 0), 2),
                min_execution_time_ms=int(row.min_execution_time_ms or 0),
                max_execution_time_ms=int(row.max_execution_time_ms or 0),
            )
        )
    
    return report