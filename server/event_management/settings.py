import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
from celery.schedules import crontab
import dj_database_url
import cloudinary

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY")

DEBUG = os.getenv("DEBUG", "False") == "True"

ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1,.onrender.com"
).split(",")

CSRF_TRUSTED_ORIGINS = [
    "https://evenxo.xyz",
    "https://www.evenxo.xyz",
    "https://api.evenxo.xyz",
    "https://*.onrender.com",
]

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173"
)


INSTALLED_APPS = [
    "daphne",
    "channels",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "rest_framework_simplejwt",
    "django_rest_passwordreset",
    "django_celery_beat",
    "django_filters",
    "cloudinary",
    "cloudinary_storage",
    "users",
    "Admin",
    "chat",
    "event",
    "organizer",
    "Profile",
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "event_management.urls"
WSGI_APPLICATION = "event_management.wsgi.application"
ASGI_APPLICATION = "event_management.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(DATABASE_URL)
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

REDIS_URL = os.getenv("REDIS_URL")

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [REDIS_URL],
        },
    },
}


CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL

CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"

CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

CELERY_BEAT_SCHEDULE = {
    "distribute-revenue-every-midnight": {
        "task": "users.tasks.distribute_event_revenue",
        "schedule": crontab(hour=0, minute=0),
    },
}


AUTH_USER_MODEL = "users.Profile"


REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
        "users.permissions.IsActiveUser",
        "Admin.permissions.IsAdminUser",
    ),

    "DEFAULT_AUTHENTICATION_CLASSES": (
        "users.authentication.CookieJWTAuthentication",
    ),

    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend"
    ],
}


SIMPLE_JWT = {
    "LEEWAY": 100,
    "ACCESS_TOKEN_LIFETIME": timedelta(days=3),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_COOKIE": "access_token",
    "AUTH_COOKIE_REFRESH": "refresh_token",
    "AUTH_COOKIE_SECURE": True,
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_PATH": "/",
    "AUTH_COOKIE_SAMESITE": "None",
}


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_STORAGE = (
    "whitenoise.storage.CompressedManifestStaticFilesStorage"
)


MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_FILE_STORAGE = (
    "cloudinary_storage.storage.MediaCloudinaryStorage"
)


CLOUDINARY_STORAGE = {
    "CLOUD_NAME": os.getenv("CLOUDINARY_CLOUD_NAME"),
    "API_KEY": os.getenv("CLOUDINARY_API_KEY"),
    "API_SECRET": os.getenv("CLOUDINARY_API_SECRET"),
}

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://evenxo.xyz",
    "https://www.evenxo.xyz",
]

CORS_ALLOW_CREDENTIALS = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SAMESITE = "None"

LOGGING = {
    "version": 1,

    "disable_existing_loggers": False,

    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },

        "file": {
            "class": "logging.FileHandler",
            "filename": "general.log",
            "formatter": "verbose",
        },
    },

    "formatters": {
        "verbose": {
            "format": "{asctime} ({levelname})- {name}- {message}",
            "style": "{",
        }
    },

    "loggers": {
        "": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },

        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },

        "chat.socketio_server": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },

        "users.tasks": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

STRIPE_PUBLIC_KEY = os.getenv("STRIPE_PUBLIC_KEY")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")