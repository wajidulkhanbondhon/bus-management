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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes (Short-lived session)
    FERNET_SECRET_KEY: str = "Tj-bZc32uPz1oZ218Hn7B7a8bT_mI8FjA6_z_Qn4rQo="

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.strip().startswith("[") and v.strip().endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        env = info.data.get("ENVIRONMENT", "development")
        if env == "production" and v == "atoms_super_secret_jwt_key_saas_bus_management_2026":
            raise ValueError("CRITICAL: Default placeholder SECRET_KEY cannot be used in production!")
        return v

    # Multi-tenant settings
    DEFAULT_TENANT_ID: str = "central-transit"
    CRON_SECRET: str = "atoms-cleanup-token"
    
    # AI Integration
    GEMINI_API_KEY: str = "YOUR_GEMINI_API_KEY_HERE"
    GROQ_API_KEY: str = "YOUR_GROQ_API_KEY_HERE"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
