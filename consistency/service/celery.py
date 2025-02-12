from celery import Celery
from kombu import Queue, Exchange
import os

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
RABBITMQ_DEFAULT_USER = os.getenv("RABBITMQ_DEFAULT_USER", "guest")
RABBITMQ_DEFAULT_PASS = os.getenv("RABBITMQ_DEFAULT_PASS", "guest")
RABBITMQ_VHOST = os.getenv("RABBITMQ_VHOST", "/")

BROKER_URL = f'pyamqp://{RABBITMQ_DEFAULT_USER}:{RABBITMQ_DEFAULT_PASS}@{RABBITMQ_HOST}:{RABBITMQ_PORT}/{RABBITMQ_VHOST}'

print(BROKER_URL)

app = Celery("consistency_service", broker=BROKER_URL)

app.conf.task_queues = (
    Queue("consistency.subscribe", Exchange("consistency"), routing_key="consistency.subscribe"),
)

app.conf.task_routes = {
    "consistency.subscribe": {"queue": "consistency.subscribe"},
}

app.conf.beat_schedule = {
    "send-subscription-requests-every-30s": {
        "task": "subscribe_now",
        "schedule": 30.0,  
    },
    "check-consistency-every-60s": {
        "task": "check_consistency",
        "schedule": 60.0,  
    },
}

app.autodiscover_tasks(['service'])
