from celery import shared_task
from django.contrib.auth import get_user_model

User = get_user_model()

@shared_task(name="auth.user_registered")
def handle_user_registered(event):
    print(event)
    event_data = event["data"]["attributes"]
    user, created = User.objects.get_or_create(id=event_data["id"], defaults={"username": event_data["username"]})
    return f"User {event_data['username']} {'created' if created else 'already exists'} in social service."

@shared_task(name="auth.user_deleted")
def handle_user_deleted(event):
    try:
        event_data = event["data"]["attributes"]
        user = User.objects.get(id=event_data["id"])
        user.delete()
        return f"User {user.username} deleted from social service."
    except User.DoesNotExist:
        return f"User with ID {event_data['id']} does not exist."

@shared_task(name="auth.username_changed")
def handle_username_changed(event):
    try:
        event_data = event["data"]["attributes"]
        user = User.objects.get(id=event_data["id"])
        user.username = event_data["username"]
        user.save()
        return f"Username updated to {event_data['username']} in social service."
    except User.DoesNotExist:
        return f"User with ID {event_data['id']} does not exist."
