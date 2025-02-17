from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from core.models import IncomingEvent, Message
from core.utils import rabbitmq_client
import time
import json
import uuid

User = get_user_model()

def event_already_processed(event_id):
    return IncomingEvent.objects.filter(event_id=event_id).exists()

def mark_event_as_processed(event_id, event_type):
    IncomingEvent.objects.create(
        event_id=event_id,
        event_type=event_type
    )

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

        rabbitmq_client.publish(
            exchange="consistency",
            routing_key="consistency.subscribe",
            message=subscription_event,
            ttl=10000
        )

        return "Sent subscription request to consistency_service"
    except Exception as e:
        return f"Error handling subscribe_now: {e}"

@shared_task(name="auth.user_registered")
def handle_user_registered(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_data = event["data"]["data"]["attributes"]
    user, created = User.objects.get_or_create(id=event_data["user_id"], defaults={"username": event_data["username"]})

    mark_event_as_processed(event_id, event["event_type"])
    return f"User {event_data['username']} {'created' if created else 'already exists'} in social service."

@shared_task(name="auth.user_deleted")
def handle_user_deleted(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    try:
        event_data = event["data"]["data"]["attributes"]
        user = User.objects.get(id=event_data["user_id"])
        user.delete()
        mark_event_as_processed(event_id, event["event_type"])
        return f"User {user.username} deleted from social service."
    except User.DoesNotExist:
        return f"User with ID {event_data['id']} does not exist."

@shared_task(name="auth.username_changed")
def handle_username_changed(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    try:
        event_data = event["data"]["data"]["attributes"]
        user = User.objects.get(id=event_data["user_id"])
        user.username = event_data["username"]
        user.save()
        mark_event_as_processed(event_id, event["event_type"])
        return f"Username updated to {event_data['username']} in social service."
    except User.DoesNotExist:
        return f"User with ID {event_data['id']} does not exist."


@shared_task(name="pong.match_invitation")
def handle_match_invitation(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_data = event["data"]["data"]["attributes"]
    sender_id = event_data["sender_id"]
    receiver_id = event_data["receiver_id"]
    match_id = event_data["match_id"]
    msg = Message.objects.create(sender_id=sender_id, receiver_id=receiver_id, content=json.dumps({"type": "match","match_id": match_id}, is_special=True))
    msg.save()

    channel_layer = get_channel_layer()
    room_group_name = f"user_{receiver_id}"
    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            "type": "new_match_invitation",
            "status": "success",
            "message": "New match invitation received",
            "data": {
                "match_id": match_id,
                "sender_id": sender_id,
                "receiver_id": receiver_id
            }
        }
    )

    return f"Match invitation message from {User.objects.get(id=sender_id)} to {User.objects.get(id=receiver_id)} sent correctly."

@shared_task(name="pong.tournament_invitation")
def handle_tournament_invitation(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_data = event["data"]["data"]["attributes"]
    sender_id = event_data["sender_id"]
    receiver_id = event_data["receiver_id"]
    tournament_id = event_data["tournament_id"]
    msg = Message.objects.create(sender_id=sender_id, receiver_id=receiver_id, content=json.dumps({"type": "tournament","tournament_id": tournament_id}, is_special=True))
    msg.save()

    channel_layer = get_channel_layer()
    room_group_name = f"user_{receiver_id}"
    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            "type": "new_tournament_invitation",
            "status": "success",
            "message": "New match invitation received",
            "data": {
                "tournament_id": tournament_id,
                "sender_id": sender_id,
                "receiver_id": receiver_id
            }
        }
    )

    return f"Tournament invitation message from {User.objects.get(id=sender_id)} to {User.objects.get(id=receiver_id)} sent correctly."