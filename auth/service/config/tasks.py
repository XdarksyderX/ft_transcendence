from celery import shared_task
from django.contrib.auth import get_user_model
from core.models import IncomingEvent
from core.utils.rabbitmq_client import RabbitMQClient
from config.settings import RABBITMQ_CONFIG
import time
import uuid

User = get_user_model()

def event_already_processed(event_id):
    return IncomingEvent.objects.filter(event_id=event_id).exists()

def mark_event_as_processed(event_id, event_type):
    IncomingEvent.objects.create(
        event_id=event_id,
        event_type=event_type
    )

@shared_task(name="consistency.subscribe_now.auth")
def handle_subscribe_now(event):
    try:
        subscription_event = {
            "service": "auth",
            "subscribed_events": [

            ],
            "subscription_id": str(uuid.uuid4()),
            "timestamp": time.time()
        }

        RabbitMQClient(RABBITMQ_CONFIG).publish(
            exchange="consistency",
            routing_key="consistency.subscribe",
            message=subscription_event,
            ttl=10000
        )

        return "Sent subscription request to consistency_service"
    except Exception as e:
        return f"Error handling subscribe_now: {e}"
