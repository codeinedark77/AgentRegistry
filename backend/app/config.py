from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AgentRegistry"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # PostgreSQL
    DATABASE_URL: str  # e.g. postgresql+asyncpg://user:pass@localhost:5432/agentregistry

    # JWT
    SECRET_KEY: str       # openssl rand -hex 32
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache()
def get_settings() -> Settings:
    return Settings()