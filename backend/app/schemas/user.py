from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from app.models.user import UserRole


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=64, pattern=r"^[a-zA-Z0-9_]+$")
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.STANDARD


class UserLogin(BaseModel):
    username: str
    password: str


class UserRead(BaseModel):
    id: int
    username: str
    role: UserRole
    created_at: datetime

    model_config = {"from_attributes": True}  # Replaces orm_mode in Pydantic v2