from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Float, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.workspace import Workspace
    from app.models.task_queue import TaskQueue

class AgentConfig(Base):
    __tablename__: str = "agent_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    workspace_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    model_name: Mapped[str] = mapped_column(String(128), nullable=False)
    system_prompt: Mapped[str] = mapped_column(String, nullable=False)
    temperature: Mapped[float] = mapped_column(Float, nullable=False, default=0.7)

    __table_args__ = (
        CheckConstraint('temperature >= 0.0 AND temperature <= 2.0', name='check_temperature_range'),
    )

    # THE FIX: Points perfectly to "agents"
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="agents")
    
    tasks: Mapped[list["TaskQueue"]] = relationship(
        "TaskQueue", back_populates="agent", cascade="all, delete-orphan"
    )