from datetime import datetime, timezone
from sqlalchemy import Integer, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class ExecutionLog(Base):
    __tablename__ = "execution_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("task_queue.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,   # One-to-one: each task has exactly one log entry
        index=True,
    )
    response_text: Mapped[str] = mapped_column(Text, nullable=False)
    execution_time_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    task: Mapped["TaskQueue"] = relationship(
        "TaskQueue", back_populates="execution_log"
    )

    def __repr__(self) -> str:
        return f"<ExecutionLog id={self.id} task_id={self.task_id} exec_time={self.execution_time_ms}ms>"