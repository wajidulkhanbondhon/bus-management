import logging
import sys
import structlog
from typing import Any, Dict

# List of sensitive keys to scrub from logs
SENSITIVE_KEYS = {
    "password", "password_hash", "pin", "pin_hash", "token", "access_token",
    "secret", "secret_key", "authorization", "cookie"
}


def scrub_sensitive_data(_, __, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively redacts sensitive keys from log event dictionaries."""
    for key, val in list(event_dict.items()):
        if any(sensitive in key.lower() for sensitive in SENSITIVE_KEYS):
            event_dict[key] = "******"
        elif isinstance(val, dict):
            event_dict[key] = scrub_sensitive_data(_, __, val)
    return event_dict


def setup_logging():
    """Configures structlog for JSON security logging."""
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso", utc=True),
            scrub_sensitive_data,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


# Get security logger instance
setup_logging()
logger = structlog.get_logger("security")
