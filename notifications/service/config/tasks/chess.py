from celery import shared_task
from core.models import User
from core.utils.notifications import send_event
from .common import event_already_processed, mark_event_as_processed


@shared_task(name="chess.invitation_decline")
def handle_chess_invitation_decline(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    sender_id = event_attributes["denied_by"]
    receiver_id = event_attributes["invited_by"]

    sender = User.objects.get(id=sender_id)
    receiver = User.objects.get(id=receiver_id)

    payload = {
        "event_type": "chess_match_decline",
        "user": sender.username,
        "other": receiver.username
    }

    send_event(receiver_id, payload)
    send_event(sender_id, payload)
    mark_event_as_processed(event_id, payload["event_type"])

    return f"Notified both users that {sender.username} declined {receiver.username}'s match invitation"


@shared_task(name="chess.invitation_cancelled")
def handle_chess_invitation_cancelled(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    sender_id = event_attributes["cancelled_by"]
    receiver_id = event_attributes["invited_user"]
    invitation_token = event_attributes["invitation_token"]

    sender = User.objects.get(id=sender_id)
    receiver = User.objects.get(id=receiver_id)

    payload = {
        "event_type": "chess_match_cancelled",
        "invitation_token": invitation_token,
        "user": sender.username,
        "other": receiver.username
    }

    send_event(receiver_id, payload)
    send_event(sender_id, payload)
    mark_event_as_processed(event_id, payload["event_type"])

    return f"Notified both users that {sender.username} cancelled {receiver.username}'s match invitation"


@shared_task(name="chess.match_accepted")
def handle_chess_match_accepted(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    sender_id = event_attributes["accepted_by"]
    receiver_id = event_attributes["invited_by"]
    game_key = event_attributes["game_key"]

    sender = User.objects.get(id=sender_id)
    receiver = User.objects.get(id=receiver_id)

    payload = {
        "event_type": "chess_match_accepted",
        "game_key": game_key,
        "user": sender.username,
        "other": receiver.username
    }

    send_event(receiver_id, payload)
    send_event(sender_id, payload)
    mark_event_as_processed(event_id, payload["event_type"])

    return f"Notified both users that {sender.username} accepted {receiver.username}'s match invitation"

@shared_task(name="chess.match_accepted_random")
def handle_chess_match_accepted_random(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    sender_id = event_attributes["accepted_by"]
    receiver_id = event_attributes["invited_by"]
    game_key = event_attributes["game_key"]

    sender = User.objects.get(id=sender_id)
    receiver = User.objects.get(id=receiver_id)

    payload1 = {
        "event_type": "chess_match_accepted_random",
        "game_key": game_key,
        "user": sender.username,
        "other": receiver.username
    }

    payload2 = {
        "event_type": "chess_match_accepted_random",
        "game_key": game_key,
        "other": sender.username,
        "user": receiver.username
    }


    send_event(receiver_id, payload1)
    send_event(sender_id, payload2)
    mark_event_as_processed(event_id, payload1["event_type"])

    return f"Notified both users that {sender.username} and {receiver.username} will have a match"