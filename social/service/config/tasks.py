from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from core.models import IncomingEvent, Message
from core.utils.rabbitmq_client import RabbitMQClient
from config.settings import RABBITMQ_CONFIG
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

        RabbitMQClient(RABBITMQ_CONFIG).publish(
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

    event_data = event["data"]["attributes"]
    user, created = User.objects.get_or_create(id=event_data["user_id"], defaults={"username": event_data["username"]})

    mark_event_as_processed(event_id, event["event_type"])
    return f"User {event_data['username']} {'created' if created else 'already exists'} in social service."

@shared_task(name="auth.user_deleted")
def handle_user_deleted(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    try:
        event_data = event["data"]["attributes"]
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
        event_data = event["data"]["attributes"]
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

    try:
        event_data = event["data"]["attributes"]
        sender = User.objects.get(id=event_data["sender_id"])
        receiver = User.objects.get(id=event_data["receiver_id"])
        invitation_token = event_data["invitation_token"]

        msg = Message.objects.create(
            sender=sender,
            receiver=receiver,
            content=json.dumps({"type": "pong-match", "invitation_token": invitation_token}),
            is_special=True
        )
        msg.save()

        data = {
            "type": "message",
            "status": "success",
            "message": "New match invitation received",
            "data": {
                "message": json.dumps({
                    "type": "pong-match",
                    "invitation_token": invitation_token
                }),
                "is_read": False,
                "is_special": True,
                "receiver": receiver.username,
                "sender": sender.username,
                "sent_at": msg.sent_at.strftime("%Y-%m-%d %H:%M:%S.%f%z")
            }
        }

        channel_layer = get_channel_layer()
        for user in [sender, receiver]:
            user_group_name = f"user_{user.username}"
            async_to_sync(channel_layer.group_send)(
                user_group_name,
                {
                    "type": "pong_new_match_invitation",
                    "event": data
                }
            )

        return f"Match invitation message from {sender.username} to {receiver.username} sent correctly."
    
    except User.DoesNotExist:
        return f"Error: User with provided ID not found."
    except Exception as e:
        return f"Error processing match invitation: {str(e)}"

@shared_task(name="pong.tournament_invitation")
def handle_tournament_invitation(event):
    event_id = event["event_id"]

    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    try:
        event_data = event["data"]["attributes"]
        sender = User.objects.get(id=event_data["sender_id"])
        receiver = User.objects.get(id=event_data["receiver_id"])
        tournament_id = event_data["tournament_id"]

        msg = Message.objects.create(
            sender=sender,
            receiver=receiver,
            content=json.dumps({"type": "tournament", "tournament_id": tournament_id}),
            is_special=True
        )
        msg.save()

        data = {
            "type": "message",
            "status": "success",
            "message": "New tournament invitation received",
            "data": {
                "message": json.dumps({
                    "type": "tournament",
                    "tournament_id": tournament_id
                }),
                "is_read": False,
                "is_special": True,
                "receiver": receiver.username,
                "sender": sender.username,
                "sent_at": msg.sent_at.strftime("%Y-%m-%d %H:%M:%S.%f%z")
            }
        }

        channel_layer = get_channel_layer()
        for user in [sender, receiver]:
            user_group_name = f"user_{user.username}"
            async_to_sync(channel_layer.group_send)(
                user_group_name,
                {
                    "type": "pong_new_tournament_invitation",
                    "event": data
                }
            )

        return f"Tournament invitation message from {sender.username} to {receiver.username} sent correctly."
    
    except User.DoesNotExist:
        return f"Error: User with provided ID not found."
    except Exception as e:
        return f"Error processing tournament invitation: {str(e)}"
    
@shared_task(name="events.user_connected")
def handle_user_connected(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_data = event["data"]["attributes"]
    user = User.objects.get(id=event_data["user_id"])
    user.is_active = True
    user.save()

    mark_event_as_processed(event_id, event["event_type"])
    return f"User {user.username} connected to social service."

@shared_task(name="events.user_disconnected")
def handle_user_disconnected(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_data = event["data"]["attributes"]
    user = User.objects.get(id=event_data["user_id"])
    user.is_active = False
    user.save()

    mark_event_as_processed(event_id, event["event_type"])
    return f"User {user.username} disconnected from social service."
