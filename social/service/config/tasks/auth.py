from celery import shared_task
from django.contrib.auth import get_user_model
from .utils import event_already_processed, mark_event_as_processed

User = get_user_model()

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