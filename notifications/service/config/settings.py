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

RABBITMQ_CONFIG = {
    "AMQP_ENABLED": True,
    "RABBITMQ_HOST": os.getenv("RABBITMQ_HOST", "rabbitmq"),
    "RABBITMQ_PORT": int(os.getenv("RABBITMQ_PORT", 5672)),
    "RABBITMQ_DEFAULT_USER": os.getenv("RABBITMQ_DEFAULT_USER", "admin"),
    "RABBITMQ_DEFAULT_PASS": os.getenv("RABBITMQ_DEFAULT_PASS", "admin"),
    "RABBITMQ_VHOST": os.getenv("RABBITMQ_VHOST", "/")
}

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
APPEND_SLASH = True

DEBUG = True

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.sessions',
    'django.contrib.contenttypes',
    'rest_framework',
    'core',
    'channels',
    'notifications',
    'events'
]

AUTH_USER_MODEL = 'core.User'

MIDDLEWARE = [
    'core.exceptions.GlobalExceptionMiddleware'
]

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("redis", 6379)],
        },
    },
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'core.utils.CookieJWTAuthentication.CookieJWTAuthentication',
    ),
    'EXCEPTION_HANDLER': 'core.exceptions.global_handler.global_exception_handler',
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('NOTIFICATIONSDB_NAME'),
        'USER': os.getenv('NOTIFICATIONSDB_USER'),
        'PASSWORD': os.getenv('NOTIFICATIONSDB_PASSWORD'),
        'HOST': os.getenv('NOTIFICATIONSDB_HOST', 'localhost'),
        'PORT': os.getenv('NOTIFICATIONSDB_PORT', '5432'),
    }
}

ROOT_URLCONF = 'config.urls'

WSGI_APPLICATION = 'config.wsgi.application'



# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
