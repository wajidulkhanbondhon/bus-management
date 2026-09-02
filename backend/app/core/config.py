import os
import secrets
from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load the backend's own .env (not a parent directory's .env).
_BACKEND_ENV = Path(__file__).resolve().parents[2] / ".env"

# Legacy placeholder values that are no longer acceptable in any environment.
_INSECURE_SECRETS = {
    "atoms_super_secret_jwt_key_saas_bus_management_2026",
    "atoms_secure_jwt_secret_admission_transport_office_2026",
    "atoms_session_hmac_secret_2026_change_in_prod",
    "atoms-cleanup-token",
    "Tj-bZc32uPz1oZ218Hn7B7a8bT_mI8FjA6_z_Qn4rQo=",
    "atoms-dev-secret-change-in-production",
}

def _generate_secret(prefix: str) -> str:
    """Generate a random dev secret so local dev works out of the box."""
    return f"{prefix}_{secrets.token_urlsafe(32)}"


class Settings(BaseSettings):
    PROJECT_NAME: str = "ATOMS Bus Management SaaS"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/bus_management?sslmode=disable"

    # Redis Cache & Anti-Hoarding
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security — stable secret key that reads from environment (SECRET_KEY or JWT_SECRET)
    SECRET_KEY: str = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET") or "dev_jwt_secret_atoms_super_secure_key_2026_dev_mode_fixed"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    FERNET_SECRET_KEY: str = os.getenv("FERNET_SECRET_KEY") or "dev_fernet_secret_atoms_2026_dev_mode_fixed_key"

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

    @model_validator(mode="after")
    def validate_secret_key(self) -> "Settings":
        if self.ENVIRONMENT == "production":
            if not self.SECRET_KEY or self.SECRET_KEY in _INSECURE_SECRETS:
                raise ValueError(
                    "CRITICAL: A secure SECRET_KEY must be provided via environment "
                    "variables in production!"
                )
            if not self.FERNET_SECRET_KEY or self.FERNET_SECRET_KEY in _INSECURE_SECRETS:
                raise ValueError(
                    "CRITICAL: A secure FERNET_SECRET_KEY must be provided via environment "
                    "variables in production!"
                )
        return self

    # Multi-tenant settings
    DEFAULT_TENANT_ID: str = "central-transit"
    CRON_SECRET: str = _generate_secret("dev_cron_secret")

    # AI Integration
    GEMINI_API_KEY: str = "YOUR_GEMINI_API_KEY_HERE"
    GROQ_API_KEY: str = "YOUR_GROQ_API_KEY_HERE"

    model_config = SettingsConfigDict(
        env_file=str(_BACKEND_ENV),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
