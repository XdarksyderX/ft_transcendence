import socket
import datetime
import uuid
import json

def wrap_event_data(data: dict, event_type: str, aggregate_id: str, meta: dict = None) -> dict:
    event_id = str(uuid.uuid4())
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

def extract_event_data(serialized_event: str) -> dict:
    try:
        event = json.loads(serialized_event)
        return event["data"]["attributes"]
    except (KeyError, json.JSONDecodeError) as e:
        raise ValueError(f"Invalid event format: {e}")
