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

app = Celery('pong', broker=BROKER_URL)

app.conf.broker_connection_retry_on_startup = True
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.task_protocol = 1

app.conf.task_queues = (
    Queue('pong.user_registered', Exchange('auth'), routing_key='auth.user_registered'),
    Queue('pong.user_deleted', Exchange('auth'), routing_key='auth.user_deleted'),
    Queue('pong.username_changed', Exchange('auth'), routing_key='auth.username_changed'),
	Queue('pong.friend_added', Exchange('social'), routing_key='social.friend_added'),
	Queue('pong.friend_removed', Exchange('social'), routing_key='social.friend_removed'),
	Queue('consistency.subscribe_now.pong', Exchange('consistency'), routing_key='consistency.subscribe_now.pong')
	
)

app.conf.task_routes = {
    'auth.user_registered': {'queue': 'pong.user_registered'},
    'auth.user_deleted': {'queue': 'pong.user_deleted'},
    'auth.username_changed': {'queue': 'pong.username_changed'},
	'auth.user_deleted': {'queue': 'pong.friend_added'},
	'social.friend_removed': {'queue': 'pong.friend_removed'},
	'consistency.subscribe_now.pong': {'queue': 'consistency.subscribe_now.pong'}
}


app.autodiscover_tasks(lambda: [n for n in os.listdir('.') if os.path.isdir(n) and not n.startswith('.')])
