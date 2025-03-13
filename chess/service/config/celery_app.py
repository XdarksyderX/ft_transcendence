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

app = Celery('chess', broker=BROKER_URL)

app.conf.broker_connection_retry_on_startup = True
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.task_protocol = 1

app.conf.task_queues = (
	Queue('chess.user_disconnected', Exchange('events'), routing_key='events.user_disconnected'),
    Queue('chess.user_registered', Exchange('auth'), routing_key='auth.user_registered'),
    Queue('chess.user_deleted', Exchange('auth'), routing_key='auth.user_deleted'),
    Queue('chess.username_changed', Exchange('auth'), routing_key='auth.username_changed'),
    Queue('chess.friend_added', Exchange('social'), routing_key='social.friend_added'),
    Queue('chess.friend_removed', Exchange('social'), routing_key='social.friend_removed'),
    Queue('consistency.subscribe_now.chess', Exchange('consistency'), routing_key='consistency.subscribe_now.chess')
)

app.conf.task_routes = {
    'auth.user_registered': {'queue': 'chess.user_registered'},
    'auth.user_deleted': {'queue': 'chess.user_deleted'},
    'auth.username_changed': {'queue': 'chess.username_changed'},
	'events.user_disconnected': {'queue': 'chess.user_disconnected'},
    'social.friend_added': {'queue': 'chess.friend_added'},
    'social.friend_removed': {'queue': 'chess.friend_removed'},
    'consistency.subscribe_now.chess': {'queue': 'consistency.subscribe_now.chess'}
}

app.autodiscover_tasks(lambda: [n for n in os.listdir('.') if os.path.isdir(n) and not n.startswith('.')])