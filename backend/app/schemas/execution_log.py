from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class ExecutionLogCreate(BaseModel):
    task_id: int
    response_text: str = Field(..., min_length=1)
    execution_time_ms: int = Field(..., ge=0)


class ExecutionLogRead(BaseModel):
    id: int
    task_id: int
    response_text: str
    execution_time_ms: int
    timestamp: datetime

    model_config = {"from_attributes": True}


# ── Analytics schema (used by the JOIN endpoint) ──────────────────────────────
class ModelAnalyticsReport(BaseModel):
    # This stops Pydantic from throwing the "model_" namespace warning
    model_config = ConfigDict(protected_namespaces=())

    model_name: str
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    success_rate: float
    avg_execution_time_ms: float
    min_execution_time_ms: int
    max_execution_time_ms: int