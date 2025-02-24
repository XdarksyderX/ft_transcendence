import socket
import datetime
import uuid
from events.utils.rabbitmq_client import RabbitMQClient
from django.conf import settings

def wrap_event_data(data: dict, event_type: str, aggregate_id: str, meta: dict = None, event_id = str(uuid.uuid4())) -> dict:
    occurred_on = datetime.datetime.now(datetime.timezone.utc).isoformat()
    host = socket.gethostname()

    wrapped_event = {
        "data": {
            "id": event_id,
            "type": event_type,
            "occurred_on": occurred_on,
            "attributes": {
                "id": aggregate_id,
                **data
            },
            "meta": {
                **(meta or {}),
                "host": host
            }
        }
    }
    return wrapped_event

def publish_event(origin, event_type, data):
    event_id = str(uuid.uuid4())
    wrapped_data = wrap_event_data(data, event_type, event_id)
    event = {"event_id": event_id, "event_type": event_type, "data": wrapped_data}
    RabbitMQClient(settings.RABBITMQ_CONFIG).publish(origin, event_type, event, event_id)
