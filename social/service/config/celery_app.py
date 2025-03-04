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
	Queue('social.pong.match_invitation', Exchange('pong'), routing_key='pong.match_invitation'),
	Queue('social.pong.tournament_invitation', Exchange('pong'), routing_key='pong.tournament_invitation'),
	Queue('consistency.subscribe_now.social', Exchange('consistency'), routing_key='consistency.subscribe_now.social')
	Queue('chess.match_invitation', Exchange('chess'), routing_key='chess.match_invitation'),
	Queue('events.user_connected', Exchange('events'), routing_key='events.user_connected'),
	Queue('events.user_disconnected', Exchange('events'), routing_key='events.user_disconnected')
)

app.conf.task_routes = {
    'auth.user_registered': {'queue': 'social.user_registered'},
    'auth.user_deleted': {'queue': 'social.user_deleted'},
    'auth.username_changed': {'queue': 'social.username_changed'},
	'consistency.subscribe_now.social': {'queue': 'consistency.subscribe_now.social'},
	'pong.match_invitation': {'queue': 'social.pong.match_invitation'},
	'pong.tournament_invitation': {'queue': 'social.pong.tournament_invitation'},
	'chess.match_invitation': {'queue': 'chess.match_invitation'},
	'events.user_connected': {'queue': 'events.user_connected'},
	'events.user_disconnected': {'queue': 'events.user_disconnected'}

}


app.autodiscover_tasks(["config.tasks"])