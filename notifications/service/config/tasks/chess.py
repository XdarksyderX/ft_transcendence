from celery import shared_task
from core.models import User
from core.utils.notifications import send_event
from .common import event_already_processed, mark_event_as_processed

@shared_task(name="chess.invitation_decline")
def handle_chess_invitation_decline(event):
	event_id = event["event_id"]
	if event_already_processed(event_id):
		return f"Event {event_id} already processed."
	event_data = event["data"]["attributes"]
	sender_id = event_data["denied_by"]
	receiver_id = event_data["invited_by"]
	sender = User.objects.get(id=sender_id)
	receiver = User.objects.get(id=receiver_id)
	event = {
		"event_type": "chess_match_decline",
		"user": sender.username,
		"other": receiver.username
	}
	send_event(receiver_id, event)
	send_event(sender_id, event)
	mark_event_as_processed(event["event_id"], event["event_type"])
	return f"Notified both users that {sender.username} declined {receiver.username}'s match invitation"

@shared_task(name="chess.invitation_cancelled")
def handle_chess_invitation_cancelled(event):
	event_id = event["event_id"]
	if event_already_processed(event_id):
		return f"Event {event_id} already processed."
	event_data = event["data"]["attributes"]
	sender_id = event_data["cancelled_by"]
	receiver_id = event_data["invited_user"]
	invitation_token = event_data["invitation_token"]
	sender = User.objects.get(id=sender_id)
	receiver = User.objects.get(id=receiver_id)
	event = {
		"event_type": "chess_match_cancelled",
		"invitation_token": invitation_token,
		"user": sender.username,
		"other": receiver.username
	}
	send_event(receiver_id, event)
	send_event(sender_id, event)
	mark_event_as_processed(event["event_id"], event["event_type"])
	return f"Notified both users that {sender.username} cancelled {receiver.username}'s match invitation"

@shared_task(name="chess.match_accepted")
def handle_chess_match_accepted(event):
	event_id = event["event_id"]
	if event_already_processed(event_id):
		return f"Event {event_id} already processed."
	event_data = event["data"]["attributes"]
	sender_id = event_data["accepted_by"]
	receiver_id = event_data["invited_by"]
	invitation_token = event_data["invitation_token"]
	game_token = event_data["game_token"]
	sender = User.objects.get(id=sender_id)
	receiver = User.objects.get(id=receiver_id)
	event = {
		"event_type": "chess_match_accepted",
		"invitation_token": invitation_token,
		"game_token": game_token,
		"user": sender.username,
		"other": receiver.username
	}
	send_event(receiver_id, event)
	send_event(sender_id, event)
	mark_event_as_processed(event["event_id"], event["event_type"])
	return f"Notified both users that {sender.username} accepted {receiver.username}'s match invitation"
