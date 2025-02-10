import os
from celery import Celery
from kombu import Exchange, Queue

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
RABBITMQ_DEFAULT_USER = os.getenv("RABBITMQ_DEFAULT_USER", "guest")
RABBITMQ_DEFAULT_PASS = os.getenv("RABBITMQ_DEFAULT_PASS", "guest")
RABBITMQ_VHOST = os.getenv("RABBITMQ_VHOST", "/")

BROKER_URL = f'pyamqp://{RABBITMQ_DEFAULT_USER}:{RABBITMQ_DEFAULT_PASS}@{RABBITMQ_HOST}:{RABBITMQ_PORT}/{RABBITMQ_VHOST}'

app = Celery('social', broker=BROKER_URL)

app.conf.broker_connection_retry_on_startup = True
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.task_protocol = 1

app.conf.task_queues = (
    Queue('social.user_registered', Exchange('auth'), routing_key='auth.user_registered'),
    Queue('social.user_deleted', Exchange('auth'), routing_key='auth.user_deleted'),
    Queue('social.username_changed', Exchange('auth'), routing_key='auth.username_changed'),
)

app.conf.task_routes = {
    'auth.user_registered': {'queue': 'social.user_registered'},
    'auth.user_deleted': {'queue': 'social.user_deleted'},
    'auth.username_changed': {'queue': 'social.username_changed'},
}


app.autodiscover_tasks(lambda: [n for n in os.listdir('.') if os.path.isdir(n) and not n.startswith('.')])
