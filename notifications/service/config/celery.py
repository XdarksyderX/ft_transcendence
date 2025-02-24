from celery import Celery
from kombu import Queue, Exchange
import os

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
RABBITMQ_DEFAULT_USER = os.getenv("RABBITMQ_DEFAULT_USER", "guest")
RABBITMQ_DEFAULT_PASS = os.getenv("RABBITMQ_DEFAULT_PASS", "guest")
RABBITMQ_VHOST = os.getenv("RABBITMQ_VHOST", "/")

BROKER_URL = f'pyamqp://{RABBITMQ_DEFAULT_USER}:{RABBITMQ_DEFAULT_PASS}@{RABBITMQ_HOST}:{RABBITMQ_PORT}/{RABBITMQ_VHOST}'

app = Celery("events", broker=BROKER_URL)

app.conf.task_queues = (
	Queue("events.social.avatar_changed", Exchange("social"), routing_key="social.avatar_changed"),

    Queue("events.social.friend_added", Exchange("social"), routing_key="social.friend_added"),
	Queue("events.social.friend_removed", Exchange("social"), routing_key="social.friend_removed"),
	Queue("events.social.request_declined", Exchange("social"), routing_key="social.request_declined"),
	Queue("events.social.request_cancelled", Exchange("social"), routing_key="social.request_cancelled"),
	Queue("events.social.request_sent", Exchange("social"), routing_key="social.request_sent"),

)

app.conf.task_routes = {
    "social.friend_added": {"queue": "events.social.friend_added"},
}


app.autodiscover_tasks(lambda: [n for n in os.listdir('.') if os.path.isdir(n) and not n.startswith('.')])