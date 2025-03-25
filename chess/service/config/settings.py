from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

with open(os.path.join(BASE_DIR, 'config/keys/public.pem'), 'r') as f:
    PUBLIC_KEY = f.read()

SIMPLE_JWT = {
    "ALGORITHM": "RS256",
    "VERIFYING_KEY": PUBLIC_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
CONSISTENCY_TOKEN = os.getenv('CONSISTENCY_TOKEN')
FRONTEND_URL = os.getenv('FRONTEND_URL')
APPEND_SLASH = True
DEBUG = True

RABBITMQ_CONFIG = {
    "AMQP_ENABLED": True,
    "RABBITMQ_HOST": os.getenv("RABBITMQ_HOST", "rabbitmq"),
    "RABBITMQ_PORT": int(os.getenv("RABBITMQ_PORT", 5672)),
    "RABBITMQ_DEFAULT_USER": os.getenv("RABBITMQ_DEFAULT_USER", "admin"),
    "RABBITMQ_DEFAULT_PASS": os.getenv("RABBITMQ_DEFAULT_PASS", "admin"),
    "RABBITMQ_VHOST": os.getenv("RABBITMQ_VHOST", "/")
}

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_EXPOSE_HEADERS = ['Content-Type', 'X-CSRFToken']
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

INSTALLED_APPS = [
    'django.contrib.auth',
    'daphne',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'rest_framework',
    'channels',
    'core',
    'game',
    'matches',
    'corsheaders',
]

AUTH_USER_MODEL = 'core.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'core.utils.CookieJWTAuthentication.CookieJWTAuthentication',
    ),
    'EXCEPTION_HANDLER': 'core.exceptions.global_handler.global_exception_handler',
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'core.exceptions.global_handler.GlobalExceptionMiddleware'
]

ROOT_URLCONF = 'config.urls'

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("redis", 6379)],
        },
    },
}

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('CHESSDB_NAME'),
        'USER': os.getenv('CHESSDB_USER'),
        'PASSWORD': os.getenv('CHESSDB_PASSWORD'),
        'HOST': os.getenv('CHESSDB_HOST', 'localhost'),
        'PORT': os.getenv('CHESSDB_PORT', '5432'),
    }
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'



