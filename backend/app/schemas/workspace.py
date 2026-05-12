from pydantic import BaseModel, Field


class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    description: str | None = Field(None, max_length=500)


class WorkspaceUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=128)
    description: str | None = Field(None, max_length=500)


class WorkspaceRead(BaseModel):
    id: int
    user_id: int
    name: str
    description: str | None

    model_config = {"from_attributes": True}