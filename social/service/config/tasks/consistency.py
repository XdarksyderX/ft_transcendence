from celery import shared_task
from core.utils.rabbitmq_client import RabbitMQClient
from config.settings import RABBITMQ_CONFIG
import time
import uuid

@shared_task(name="consistency.subscribe_now.social")
def handle_subscribe_now():
    try:
        subscription_event = {
            "service": "social",
            "subscribed_events": [
                "auth.user_registered",
                "auth.user_deleted",
                "auth.username_changed"
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
