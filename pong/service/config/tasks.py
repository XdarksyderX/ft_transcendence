from celery import shared_task
from django.contrib.auth import get_user_model
from core.models import IncomingEvent
from core.utils import rabbitmq_client
from core.models import TournamentQueue
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

@shared_task(name="consistency.subscribe_now.pong")
def handle_subscribe_now():
    try:
        subscription_event = {
            "service": "pong",
            "subscribed_events": [
                "auth.user_registered",
                "auth.user_deleted",
                "auth.username_changed",
                "social.friend_removed",
                "social.friend_added",
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

    event_data = event["data"]["attributes"]
    user, created = User.objects.get_or_create(id=event_data["user_id"], defaults={"username": event_data["username"]})
    user.save()

    mark_event_as_processed(event_id, event["event_type"])
    return f"User {event_data['username']} {'created' if created else 'already exists'} in pong service."

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
        return f"User {user.username} deleted from pong service."
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
        return f"Username updated to {event_data['username']} in pong service."
    except User.DoesNotExist:
        return f"User with ID {event_data['id']} does not exist."

@shared_task(name="social.friend_added")
def handle_friend_added(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_data = event["data"]["attributes"]

    try:
        user = User.objects.get(id=event_data["user_id"])
    except User.DoesNotExist:
        return f"Error: User with ID {event_data['user_id']} does not exist."

    try:
        friend = User.objects.get(id=event_data["friend_id"])
    except User.DoesNotExist:
        return f"Error: Friend with ID {event_data['friend_id']} does not exist."

    user.friends.add(friend)
    friend.friends.add(user)
    user.save()
    friend.save()
    mark_event_as_processed(event_id, event["event_type"])
    return f"Friend {friend.username} added to user {user.username}'s friend list. Friendship is a two-way street."

@shared_task(name="social.friend_removed")
def handle_friend_removed(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_data = event["data"]["attributes"]

    try:
        user = User.objects.get(id=event_data["user_id"])
    except User.DoesNotExist:
        return f"Error: User with ID {event_data['user_id']} does not exist."

    try:
        friend = User.objects.get(id=event_data["friend_id"])
    except User.DoesNotExist:
        return f"Error: Friend with ID {event_data['friend_id']} does not exist."

    try:
        user.friends.remove(friend)
        friend.friends.remove(user)
    except Exception as e:
        return f"Error while removing friends: {e}"

    user.save()
    friend.save()
    mark_event_as_processed(event_id, event["event_type"])
    return f"Friend {friend.username} removed from user {user.username}'s friend list. Friendship is a two-way street."

@shared_task(name="events.user_disconnected")
def handle_user_disconnected(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_data = event["data"]["attributes"]

    try:
        user = User.objects.get(id=event_data["user_id"])
    except User.DoesNotExist:
        return f"Error: User with ID {event_data['user_id']} does not exist."

    TournamentQueue.objects.filter(player=user).delete()
    mark_event_as_processed(event_id, event["event_type"])
    return f"User {user.username} disconnected."