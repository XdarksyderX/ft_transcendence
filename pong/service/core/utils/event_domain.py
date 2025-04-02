import socket
import datetime
import uuid
from core.utils.rabbitmq_client import RabbitMQClient
from django.conf import settings


def wrap_event_data(data: dict, event_type: str, aggregate_id: str, meta: dict = None, event_id: str = None) -> dict:
    """
    Wraps the event data in a standardized format.
    
    Args:
        data: The actual event payload
        event_type: Type of the event
        aggregate_id: ID of the entity this event relates to
        meta: Additional metadata for the event
        event_id: Unique identifier for the event (generated if None)
    
    Returns:
        A properly formatted event dictionary
    """
    if event_id is None:
        event_id = str(uuid.uuid4())
        
    occurred_on = datetime.datetime.now(datetime.timezone.utc).isoformat()
    host = socket.gethostname()

    wrapped_event = {
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
    
    return wrapped_event


def publish_event(origin: str, event_type: str, data: dict, retry_count: int = 3, ttl: int = None) -> str:
    """
    Publishes an event to RabbitMQ with retry capabilities.
    
    Args:
        origin: The exchange to publish to (service name/origin)
        event_type: The routing key for the event
        data: The event payload
        retry_count: Maximum number of retries if publishing fails
        ttl: Time-to-live for the message in milliseconds
    
    Returns:
        The event ID of the published event
    """
    # Generate a unique ID for the event
    event_id = str(uuid.uuid4())
    
    # Wrap the event data in the standard format
    wrapped_data = wrap_event_data(data, event_type, event_id, event_id=event_id)
    
    # Create the full event object
    event = {
        "event_id": event_id, 
        "event_type": event_type, 
        "data": wrapped_data
    }
    
    # Initialize the RabbitMQ client with configuration from settings
    client = RabbitMQClient(settings.RABBITMQ_CONFIG)
    
    # Ensure we have retry infrastructure set up for this event type
    client.setup_retry_infrastructure(
        exchange=origin,
        routing_key=event_type,
        max_retries=retry_count,
        retry_delay=30000  # 30 seconds between retries, adjust as needed
    )
    
    # Publish the event with the enhanced client
    success = client.publish(
        exchange=origin,
        routing_key=event_type,
        message=event,
        event_id=event_id,
        ttl=ttl,
        max_retries=retry_count
    )
    
    if not success:
        # Log the failure if the event couldn't be published after all retries
        # You might want to handle this differently based on your application needs
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to publish event {event_id} of type {event_type} after {retry_count} attempts")
    
    # Return the event ID for reference
    return event_id
