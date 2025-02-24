from celery import Celery
from kombu import Queue, Exchange
import os

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
RABBITMQ_DEFAULT_USER = os.getenv("RABBITMQ_DEFAULT_USER", "guest")
RABBITMQ_DEFAULT_PASS = os.getenv("RABBITMQ_DEFAULT_PASS", "guest")
RABBITMQ_VHOST = os.getenv("RABBITMQ_VHOST", "/")

BROKER_URL = f'pyamqp://{RABBITMQ_DEFAULT_USER}:{RABBITMQ_DEFAULT_PASS}@{RABBITMQ_HOST}:{RABBITMQ_PORT}/{RABBITMQ_VHOST}'

app = Celery("notifications", broker=BROKER_URL)

app.conf.task_queues = (
	Queue("notifications.social.avatar_changed", Exchange("social"), routing_key="social.avatar_changed"),

    Queue("notifications.social.friend_added", Exchange("social"), routing_key="social.friend_added"),
	Queue("notifications.social.friend_removed", Exchange("social"), routing_key="social.friend_removed"),
	Queue("notifications.social.request_declined", Exchange("social"), routing_key="social.request_declined"),
	Queue("notifications.social.request_cancelled", Exchange("social"), routing_key="social.request_cancelled"),
	Queue("notifications.social.request_sent", Exchange("social"), routing_key="social.request_sent"),
	Queue('notifications.auth.user_registered', Exchange('auth'), routing_key='auth.user_registered'),
    Queue('notifications.auth.user_deleted', Exchange('auth'), routing_key='auth.user_deleted')
)

app.conf.task_routes = {
    "social.friend_added": {"queue": "notifications.social.friend_added"},
	"social.friend_removed": {"queue": "notifications.social.friend_removed"},
	"social.request_declined": {"queue": "notifications.social.request_declined"},
	"social.request_cancelled": {"queue": "notifications.social.request_cancelled"},
	"social.request_sent": {"queue": "notifications.social.request_sent"},
	"social.avatar_changed": {"queue": "notifications.social.avatar_changed"},
	"auth.user_registered": {"queue": "notifications.auth.user_registered"},
	"auth.user_deleted": {"queue": "notifications.auth.user_deleted"}
}

app.autodiscover_tasks(["config.tasks"])