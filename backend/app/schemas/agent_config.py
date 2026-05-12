from pydantic import BaseModel, ConfigDict, Field


class AgentConfigBase(BaseModel):
    """
    Shared fields for Agent Configuration.
    Used to keep Create, Update, and Read schemas in sync.
    """
    model_name: str = Field(..., min_length=1, max_length=128, description="The Ollama model name (e.g., llama3)")
    system_prompt: str = Field(..., min_length=1, description="The instructions given to the agent")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature for the LLM")


class AgentConfigCreate(AgentConfigBase):
    """
    Schema for creating a new agent (POST).
    Requires the workspace_id to link the agent to a project.
    """
    workspace_id: int


class AgentConfigUpdate(BaseModel):
    """
    Schema for partial updates (PATCH).
    All fields are optional so you can update just the prompt or just the temperature.
    """
    model_name: str | None = Field(None, min_length=1, max_length=128)
    system_prompt: str | None = Field(None, min_length=1)
    temperature: float | None = Field(None, ge=0.0, le=2.0)


class AgentConfigRead(AgentConfigBase):
    """
    Schema for reading agent data (GET).
    Includes the database-generated ID and workspace link.
    """
    id: int
    workspace_id: int

    # This allows Pydantic to convert SQLAlchemy objects to JSON automatically
    model_config = ConfigDict(from_attributes=True)