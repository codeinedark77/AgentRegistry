from datetime import datetime
from pydantic import BaseModel, Field
from app.models.task_queue import TaskStatus

class TaskBase(BaseModel):
    prompt_text: str = Field(..., min_length=1)

class TaskCreate(TaskBase):
    """Schema for creating a new task."""
    pass

class TaskRead(TaskBase):
    """Schema for reading task data."""
    id: int
    agent_id: int
    status: TaskStatus
    created_at: datetime

    model_config = {"from_attributes": True}