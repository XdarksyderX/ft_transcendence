from celery import shared_task
from django.contrib.auth import get_user_model
from .utils import event_already_processed, mark_event_as_processed
from django.db import transaction

User = get_user_model()

@shared_task(name="events.user_connected")
def handle_user_connected(event):
	event_id = event["event_id"]
	if event_already_processed(event_id):
		return f"Event {event_id} already processed."

	event_data = event["data"]["attributes"]
	with transaction.atomic():
		user = User.objects.get(id=event_data["user_id"])
		user.is_online = True
		user.save()
	mark_event_as_processed(event_id, event["event_type"])
	return f"User {user.username} connected to social service."

@shared_task(name="events.user_disconnected")
def handle_user_disconnected(event):
	event_id = event["event_id"]
	if event_already_processed(event_id):
		return f"Event {event_id} already processed."

	event_data = event["data"]["attributes"]
	with transaction.atomic():
		user = User.objects.get(id=event_data["user_id"])
		user.is_online = False
		user.save()
	mark_event_as_processed(event_id, event["event_type"])
	return f"User {user.username} disconnected from social service."
