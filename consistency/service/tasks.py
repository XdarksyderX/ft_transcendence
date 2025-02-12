from service.utils.rabbitmq_client import RabbitMQClient
from celery import shared_task
import time
import requests
import os

rabbitmq_client = RabbitMQClient()
SUBSCRIPTIONS = {}

SERVICES = {
    "auth": 5050,
    "social": 5051,
    "pong": 5052,
    "chess": 5053
}

CONSISTENCY_TOKEN = os.getenv("CONSISTENCY_TOKEN")

@shared_task(name="subscribe_now")
def send_subscription_requests():
    for service_name in SERVICES.keys():
        if service_name not in SUBSCRIPTIONS:
            routing_key = f"consistency.subscribe_now.{service_name}"
            rabbitmq_client.publish(
                exchange="consistency",
                routing_key=routing_key,
                message={"message": f"Subscribe now, {service_name}"},
                ttl=10000
            )
            print(f"Sent subscription request to {service_name}")

@shared_task(name="consistency.subscribe")
def handle_subscription(event):
    try:
        service_name = event["service"]
        events = set(event["subscribed_events"])
        SUBSCRIPTIONS[service_name] = events
        print(f"Service {service_name} subscribed to: {events}")
        ack_event = {
            "service": service_name,
            "status": "subscribed",
            "timestamp": time.time()
        }
        rabbitmq_client.publish(
            exchange="consistency",
            routing_key=f"{service_name}.subscription_ack",
            message=ack_event,
            ttl=10000
        )
        return f"Subscription ACK sent to {service_name}"
    except Exception as e:
        return f"Error handling subscription: {e}"

@shared_task(name="check_consistency")
def check_consistency():
    for service_name, subscribed_events in SUBSCRIPTIONS.items():

        outgoing_events = fetch_outgoing_events("auth")
        incoming_events = fetch_incoming_events(service_name)

        if outgoing_events is None or incoming_events is None:
            print(f"Marking {service_name} as inactive")
            del SUBSCRIPTIONS[service_name]
            continue

        filtered_events = [e for e in outgoing_events if e["event_type"] in subscribed_events]
        missing_events = [e for e in filtered_events if e["event_id"] not in incoming_events]

        for event in missing_events:
            print(f"Resending event {event['event_id']} to {service_name}")
            rabbitmq_client.publish(
                exchange=service_name,
                routing_key=event["event_type"],
                message=event,
                ttl=10000
            )

    return "Consistency check completed"

def fetch_outgoing_events(service_name):
    port = SERVICES.get(service_name, 8000)
    try:
        response = requests.get(f"http://{service_name}:{port}/events/outgoing/", timeout=5, headers={"Authorization": f"Bearer {CONSISTENCY_TOKEN}"})
        return response.json().get("events", [])
    except requests.RequestException as e:
        print(f"Error fetching outgoing events from {service_name}: {e}")
        return None

def fetch_incoming_events(service_name):
    port = SERVICES.get(service_name, 8000)
    try:
        response = requests.get(f"http://{service_name}:{port}/events/incoming/", timeout=5, headers={"Authorization": f"Bearer {CONSISTENCY_TOKEN}"})
        return {e["event_id"] for e in response.json().get("events", [])}
    except requests.RequestException as e:
        print(f"Error fetching incoming events from {service_name}: {e}")
        return None
