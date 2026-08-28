import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "ATOMS Bus Management SaaS"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/bus_management?sslmode=disable"

    # Redis Cache & Anti-Hoarding
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "atoms_super_secret_jwt_key_saas_bus_management_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day


    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Multi-tenant default
    DEFAULT_TENANT_ID: str = "central-transit"
    CRON_SECRET: str = "atoms-cleanup-token"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
