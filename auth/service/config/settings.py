import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

with open(os.path.join(BASE_DIR, 'config/keys/private.pem'), 'r') as f:
    PRIVATE_KEY = f.read()

with open(os.path.join(BASE_DIR, 'config/keys/public.pem'), 'r') as f:
    PUBLIC_KEY = f.read()

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
FRONTEND_URL = os.getenv('FRONTEND_URL')
CONSISTENCY_TOKEN = os.getenv('CONSISTENCY_TOKEN')
DEBUG = os.getenv("DEBUG", "True") == "True"
ALLOWED_HOSTS = ['0.0.0.0', 'localhost', '127.0.0.1']

# JWT Configuration
SIMPLE_JWT = {
    "ALGORITHM": "RS256",
    "SIGNING_KEY": PRIVATE_KEY,
    "VERIFYING_KEY": PUBLIC_KEY,
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# RabbitMQ Config
RABBITMQ_CONFIG = {
    "AMQP_ENABLED": True,
    "RABBITMQ_HOST": os.getenv("RABBITMQ_HOST", "rabbitmq"),
    "RABBITMQ_PORT": int(os.getenv("RABBITMQ_PORT", 5672)),
    "RABBITMQ_DEFAULT_USER": os.getenv("RABBITMQ_DEFAULT_USER", "admin"),
    "RABBITMQ_DEFAULT_PASS": os.getenv("RABBITMQ_DEFAULT_PASS", "admin"),
    "RABBITMQ_VHOST": os.getenv("RABBITMQ_VHOST", "/")
}

# Email Config
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# 42 OAuth Config
SOCIAL_AUTH_42_KEY = os.getenv('SOCIAL_AUTH_42_KEY')
SOCIAL_AUTH_42_SECRET = os.getenv('SOCIAL_AUTH_42_SECRET')
SOCIAL_AUTH_42_REDIRECT_URI = os.getenv('SOCIAL_AUTH_42_REDIRECT_URI')

# Authentication User Model
AUTH_USER_MODEL = 'core.User'

# Installed Apps
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'core',
    'access',
    'activate',
    'change',
]

# Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'core.exceptions.global_handler.GlobalExceptionMiddleware'
]

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


# REST Framework Config
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'core.utils.CookieJWTAuthentication.CookieJWTAuthentication',
    ),
    'EXCEPTION_HANDLER': 'core.exceptions.global_handler.global_exception_handler',
}

# URL Configuration
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'


# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('AUTHDB_NAME'),
        'USER': os.getenv('AUTHDB_USER'),
        'PASSWORD': os.getenv('AUTHDB_PASSWORD'),
        'HOST': os.getenv('AUTHDB_HOST', 'localhost'),
        'PORT': os.getenv('AUTHDB_PORT', '5432'),
    }
}

# Password Validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = False
USE_TZ = True

# Static Files
STATIC_URL = 'static/'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
