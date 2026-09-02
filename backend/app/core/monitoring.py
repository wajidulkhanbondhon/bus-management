import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from app.core.config import settings

def init_sentry():
    """Initializes Sentry error & performance monitoring if DSN is configured."""
    sentry_dsn = os.getenv("SENTRY_DSN", "")
    if sentry_dsn:
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[
                FastApiIntegration(),
                SqlalchemyIntegration(),
            ],
            traces_sample_rate=1.0 if settings.ENVIRONMENT == "development" else 0.2,
            profiles_sample_rate=1.0 if settings.ENVIRONMENT == "development" else 0.2,
            environment=settings.ENVIRONMENT,
            send_default_pii=False, # Protect user sensitive personal data
        )
