import enum
from typing import TYPE_CHECKING
from sqlalchemy import Integer, Text, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.agent_config import AgentConfig
    from app.models.execution_log import ExecutionLog

# Define the Enum right here so it stops trying to import itself
class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskQueue(Base):
    __tablename__: str = "task_queue"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    agent_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("agent_configs.id", ondelete="CASCADE"), nullable=False
    )
    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TaskStatus] = mapped_column(
        SQLEnum(TaskStatus), default=TaskStatus.PENDING, nullable=False
    )
    created_at = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    agent = relationship("AgentConfig", back_populates="tasks")
    execution_log = relationship(
        "ExecutionLog", back_populates="task", uselist=False, cascade="all, delete-orphan"
    )