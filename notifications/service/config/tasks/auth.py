from celery import shared_task
from core.models import User
from core.utils.notifications import send_event
from .common import event_already_processed, mark_event_as_processed

@shared_task(name="auth.user_registered")
def handle_user_registered(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_data = event["data"]["attributes"]
    user_data = {
        "id": event_data["user_id"],
        "username": event_data.get("username", f"user_{event_data['user_id']}")
    }

    user, created = User.objects.update_or_create(
        id=user_data["id"],
        defaults={"username": user_data["username"]}
    )

    mark_event_as_processed(event_id, event["event_type"])
    return f"User {user_data['username']} {'created' if created else 'updated'} in notification service."

@shared_task(name="auth.user_deleted")
def handle_user_deleted(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    try:
        event_data = event["data"]["attributes"]
        user = User.objects.get(id=event_data["user_id"])
        event = {
            "event_type": "user_deleted",
            "user": user.username
        }
        for friend in user.friends.all():
            send_event(friend.id, event)
        user.delete()
        mark_event_as_processed(event_id, event["event_type"])
        return f"User {user.username} deleted from notifications service."
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
        return f"Username updated to {event_data['username']} in notifications service."
    except User.DoesNotExist:
        return f"User with ID {event_data['id']} does not exist."