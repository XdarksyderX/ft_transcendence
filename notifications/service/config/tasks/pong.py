from celery import shared_task
from core.models import User
from core.utils.notifications import send_notification, send_event
from .common import event_already_processed, mark_event_as_processed


@shared_task(name="pong.invitation_decline")
def handle_pong_invitation_decline(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    sender_id = event_attributes["denied_by"]
    receiver_id = event_attributes["invited_by"]

    sender = User.objects.get(id=sender_id)
    receiver = User.objects.get(id=receiver_id)

    payload = {
        "event_type": "pong_match_decline",
        "user": sender.username,
        "other": receiver.username
    }

    send_event(receiver_id, payload)
    send_event(sender_id, payload)
    mark_event_as_processed(event_id, payload["event_type"])

    return f"Notified both users that {sender.username} declined {receiver.username}'s match invitation"


@shared_task(name="pong.invitation_cancelled")
def handle_pong_invitation_cancelled(event):
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
        "event_type": "pong_match_cancelled",
        "invitation_token": invitation_token,
        "user": sender.username,
        "other": receiver.username
    }

    send_event(receiver_id, payload)
    send_event(sender_id, payload)
    mark_event_as_processed(event_id, payload["event_type"])

    return f"Notified both users that {sender.username} cancelled {receiver.username}'s match invitation"


@shared_task(name="pong.match_accepted")
def handle_pong_match_accepted(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    sender_id = event_attributes["accepted_by"]
    receiver_id = event_attributes["invited_by"]
    invitation_token = event_attributes["invitation_token"]
    game_key = event_attributes["game_key"]

    sender = User.objects.get(id=sender_id)
    receiver = User.objects.get(id=receiver_id)

    payload = {
        "event_type": "pong_match_accepted",
        "invitation_token": invitation_token,
        "game_key": game_key,
        "user": sender.username,
        "other": receiver.username
    }

    send_event(receiver_id, payload)
    send_event(sender_id, payload)
    mark_event_as_processed(event_id, payload["event_type"])

    return f"Notified both users that {sender.username} accepted {receiver.username}'s match invitation"

@shared_task(name="pong.tournament_round_finished")
def handle_pong_tournament_round_finished(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    tournament_name = event_attributes["tournament_name"]
    players_ids = event_attributes["alive_players"]

    players = User.objects.filter(id__in=players_ids)

    notification = {
        "event_type": "pong_tournament_round_finished",
        "tournament_name": tournament_name,
    }

    for player in players:
        send_notification(player.id, notification)
    mark_event_as_processed(event_id, notification["event_type"])
    return f"Notified players that a tournament round has finished"

@shared_task(name="pong.tournament_invitation")
def handle_pong_tournament_invitation(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    sender_id = event_attributes["sender_id"]
    receiver_id = event_attributes["receiver_id"]
    tournament_token = event_attributes.get("tournament_token", "")
    invitation_token = event_attributes.get("invitation_token", "")

    sender = User.objects.get(id=sender_id)
    receiver = User.objects.get(id=receiver_id)

    payload = {
        "event_type": "pong_tournament_invitation",
        "tournament_token": tournament_token,
        "invitation_token": invitation_token,
        "user": sender.username,
        "other": receiver.username
    }

    send_event(receiver_id, payload)
    send_event(sender_id, payload)
    mark_event_as_processed(event_id, payload["event_type"])

    return f"Notified both users that {sender.username} invited {receiver.username} to a tournament"


@shared_task(name="pong.tournament_invitation.accepted")
def handle_pong_tournament_invitation_accepted(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    sender_id = event_attributes["sender_id"]
    tournament_token = event_attributes.get("tournament_token", "")

    sender = User.objects.get(id=sender_id)

    payload = {
        "event_type": "pong_tournament_players_update",
        "tournament_token": tournament_token,
    }

    send_event(sender_id, payload)
    mark_event_as_processed(event_id, payload["event_type"])

    return f"Notified new player accepted {sender.username}'s tournament invitation"


@shared_task(name="pong.tournament_invitation.deny")
def handle_pong_tournament_invitation_deny(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    sender_id = event_attributes["sender_id"]
    tournament_token = event_attributes.get("tournament_token", "")

    sender = User.objects.get(id=sender_id)

    payload = {
        "event_type": "pong_tournament_players_update",
        "tournament_token": tournament_token,
    }

    send_event(sender_id, payload)
    mark_event_as_processed(event_id, payload["event_type"])

    return f"Notified new player accepted {sender.username}'s tournament invitation"

@shared_task(name="pong.tournament_finished")
def handle_pong_tournament_finished(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    tournament_name = event_attributes["tournament_name"]
    players_ids = event_attributes["players_id"]
    winner = event_attributes["winner"]

    players = User.objects.filter(id__in=players_ids)

    payload = {
        "event_type": "pong_tournament_finished",
        "tournament_name": tournament_name,
        "winner": {
            "username": winner["username"],
            "alias": winner["alias"]
        }
    }

    for player in players:
        send_event(player.id, payload)
    mark_event_as_processed(event_id, payload["event_type"])
    return f"Notified all players that tournament {tournament_name} has finished with winner {winner['username']}"

@shared_task(name="pong.tournament_match_waiting")
def handle_pong_tournament_match_waiting(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    sender_id = event_attributes["sender_id"]
    sender_alias = event_attributes["sender_alias"]
    receiver_id = event_attributes["receiver_id"]
    tournament_name = event_attributes["tournament_name"]

    sender = User.objects.get(id=sender_id)
    receiver = User.objects.get(id=receiver_id)

    payload = {
        "event_type": "pong_tournament_match_waiting",
        "opponent": {
            'username': sender.username,
            'alias': sender_alias,
        },
        "tournament": tournament_name
    }

    send_notification(receiver_id, payload)
    mark_event_as_processed(event_id, payload["event_type"])

    return f"Notified oponent that tournament match is waiting to start"

@shared_task(name="pong.tournament_closed")
def handle_pong_tournament_closed(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    tournament_token = event_attributes["tournament_token"]
    players_ids = event_attributes["players_id"]

    players = User.objects.filter(id__in=players_ids)
    
    for player in players:
        payload = {
            "event_type": "pong_tournament_closed",
            "tournament_token": tournament_token
        }
        
        send_event(player.id, payload)
    
    mark_event_as_processed(event_id, "pong_tournament_closed")
    
    return f"Notified all players that tournament {tournament_token} has been closed"

@shared_task(name="pong.tournament_deleted")
def handle_pong_tournament_deleted(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    tournament_token = event_attributes["tournament_token"]
    players_ids = event_attributes["players_id"]
    invited_users_ids = event_attributes["invited_users_id"]

    all_user_ids = set(players_ids + invited_users_ids)
    users = User.objects.filter(id__in=all_user_ids)
    
    for user in users:
        payload = {
            "event_type": "pong_tournament_deleted",
            "tournament_token": tournament_token
        }
        
        send_event(user.id, payload)
    
    mark_event_as_processed(event_id, "pong_tournament_deleted")
    
    return f"Notified all relevant users that tournament {tournament_token} has been deleted"

@shared_task(name="pong.tournament_match_ready")
def handle_pong_tournament_match_ready(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    player1_id = event_attributes["player1_id"]
    player2_id = event_attributes["player2_id"]
    game_key = event_attributes["game_key"]
    tournament_token = event_attributes.get("tournament_token", "")

    player1 = User.objects.get(id=player1_id)
    player2 = User.objects.get(id=player2_id)

    payload1 = {
        "event_type": "pong_tournament_match_ready",
        "game_key": game_key,
        "tournament_token": tournament_token,
        "user": player1.username,
        "other": player2.username
    }

    payload2 = {
        "event_type": "pong_tournament_match_ready",
        "game_key": game_key,
        "tournament_token": tournament_token,
        "user": player2.username,
        "other": player1.username
    }

    send_event(player1_id, payload2)
    send_event(player2_id, payload1)
    mark_event_as_processed(event_id, payload1["event_type"])

    return f"Notified both users that their tournament match is ready"

@shared_task(name="pong.tournament_match_finished")
def handle_tournament_match_finished(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_attributes = event["data"]["attributes"]
    player1_username = event_attributes["player1"]
    player2_username = event_attributes["player2"]
    players_id = event_attributes["players_id"]
    winner = event_attributes["winner"]

    players = User.objects.filter(id__in=players_id)

    payload = {
        "event_type": "pong_tournament_match_finished",
        "tournament_token": event_attributes["tournament_token"],
        "player1": player1_username,
        "player2": player2_username,
        "winner": winner
    }

    for player in players:
        send_event(player.id, payload)
    mark_event_as_processed(event_id, payload["event_type"])
    return f"Notified players that a tournament match has finished"