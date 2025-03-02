from ..utils.rabbitmq_client import RabbitMQClient
from celery import shared_task
import time
import logging
import requests
import os
import json

rabbitmq_client = RabbitMQClient()
SUBSCRIPTIONS = {}

logger = logging.getLogger(__name__)

SERVICES = {
    "auth": 5050,
    "social": 5051,
    "pong": 5052,
    "chess": 5053
}

CONSISTENCY_TOKEN = os.getenv("CONSISTENCY_TOKEN")

@shared_task(name="subscribe_now")
def send_subscription_requests():
    logger.info(f"SUBSCRIBE NOW!!! Current subscriptions: {SUBSCRIPTIONS}")
    
    for service_name in list(SERVICES.keys()):
        if service_name not in SUBSCRIPTIONS:
            logger.info(f"Sending subscription request to {service_name}")
            
            routing_key = f"{service_name}.subscribe_request"
            
            rabbitmq_client.publish(
                exchange=service_name,
                routing_key=routing_key,
                message={
                    "message": f"Subscribe now, {service_name}",
                    "timestamp": time.time(),
                    "request_id": str(time.time())
                },
                ttl=10000
            )
            logger.info(f"Sent subscription request to {service_name}")


@shared_task(name="consistency.subscribe")
def handle_subscription(event):
    try:
        service_name = event.get("service")
        if not service_name:
            return f"Error handling subscription: missing service name"
            
        events = set(event.get("subscribed_events", []))
        
        SUBSCRIPTIONS[service_name] = events
        logger.info(f"Service {service_name} subscribed to: {events}")
        
        ack_event = {
            "service": service_name,
            "status": "subscribed",
            "timestamp": time.time(),
            "subscribed_events": list(events)
        }
        
        rabbitmq_client.publish(
            exchange=service_name,
            routing_key=f"{service_name}.subscription_ack",
            message=ack_event,
            ttl=10000
        )
        
        return f"Subscription ACK sent to {service_name}"
    except Exception as e:
        logger.error(f"Error handling subscription: {str(e)}")
        return f"Error handling subscription: {str(e)}"


@shared_task(name="check_consistency")
def check_consistency():
    subscriptions_copy = dict(SUBSCRIPTIONS)
    
    for service_name, subscribed_events in subscriptions_copy.items():
        try:
            outgoing_events = fetch_outgoing_events("auth")
            incoming_events = fetch_incoming_events(service_name)
            
            if outgoing_events is None or incoming_events is None:
                logger.warning(f"Marking {service_name} as inactive")
                if service_name in SUBSCRIPTIONS:
                    del SUBSCRIPTIONS[service_name]
                continue
            
            filtered_events = [e for e in outgoing_events if e["event_type"] in subscribed_events]
            missing_events = [e for e in filtered_events if e["event_id"] not in incoming_events]
            
            for event in missing_events:
                logger.info(f"Resending event {event['event_id']} to {service_name}")
                
                rabbitmq_client.publish(
                    exchange=service_name,
                    routing_key=event["event_type"],
                    message=event,
                    ttl=10000
                )
                
        except Exception as e:
            logger.error(f"Error checking consistency for {service_name}: {str(e)}")
    
    return "Consistency check completed"


def fetch_outgoing_events(service_name):
    port = SERVICES.get(service_name, 8000)
    try:
        response = requests.get(
            f"http://{service_name}:{port}/events/outgoing/", 
            timeout=5, 
            headers={"Authorization": f"Bearer {CONSISTENCY_TOKEN}"}
        )
        
        if response.status_code != 200:
            logger.error(f"Error fetching outgoing events from {service_name}: Status {response.status_code}")
            return None
            
        if not response.text:
            logger.error(f"Empty response from {service_name} for outgoing events")
            return None
            
        return response.json().get("events", [])
        
    except requests.RequestException as e:
        logger.error(f"Error fetching outgoing events from {service_name}: {str(e)}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON from {service_name} for outgoing events: {str(e)}")
        return None


def fetch_incoming_events(service_name):
    port = SERVICES.get(service_name, 8000)
    try:
        response = requests.get(
            f"http://{service_name}:{port}/events/incoming/", 
            timeout=5, 
            headers={"Authorization": f"Bearer {CONSISTENCY_TOKEN}"}
        )
        
        if response.status_code != 200:
            logger.error(f"Error fetching incoming events from {service_name}: Status {response.status_code}")
            return None
            
        if not response.text:
            logger.error(f"Empty response from {service_name} for incoming events")
            return None
            
        return {e["event_id"] for e in response.json().get("events", [])}
        
    except requests.RequestException as e:
        logger.error(f"Error fetching incoming events from {service_name}: {str(e)}")
        return None
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON from {service_name} for incoming events: {str(e)}")
        return None