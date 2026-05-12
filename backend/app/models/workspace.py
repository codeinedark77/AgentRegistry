from typing import TYPE_CHECKING
from sqlalchemy import String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.agent_config import AgentConfig


class Workspace(Base):
    __tablename__: str = "workspaces"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_workspace_user_name"),
    )

    owner: Mapped["User"] = relationship("User", back_populates="workspaces")
    
    # THE FIX: Named "agents" so the handshake works
    agents: Mapped[list["AgentConfig"]] = relationship(
        "AgentConfig", back_populates="workspace", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Workspace id={self.id} name={self.name!r} user_id={self.user_id}>"