from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,

    "formatters": {
        "verbose": {
            "format": (
                "{asctime} | {levelname:<8} | "
                "{name} | {message}"
            ),
            "style": "{",
        },
    },

    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": str(LOG_DIR / "general.log"),
            "maxBytes": 10 * 1024 * 1024,
            "backupCount": 5,
            "encoding": "utf-8",
            "formatter": "verbose",
        },
    },

    "root": {
        "handlers": ["console", "file"],
        "level": os.getenv("DJANGO_LOG_LEVEL", "INFO"),
    },

    "loggers": {
        "django": {
            "level": "INFO",
            "propagate": True,
        },
        "django.request": {
            "level": "WARNING",
            "propagate": True,
        },
        "django.server": {
            "level": "INFO",
            "propagate": True,
        },
        "chat.socketio_server": {
            "level": "INFO",
            "propagate": True,
        },
        "users.tasks": {
            "level": "INFO",
            "propagate": True,
        },
    },
}
