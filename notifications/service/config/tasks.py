from celery import shared_task
from core.models import IncomingEvent, User
from core.utils.notifications import send_notification

def event_already_processed(event_id):
    return IncomingEvent.objects.filter(event_id=event_id).exists()

def mark_event_as_processed(event_id, event_type):
    IncomingEvent.objects.create(
        event_id=event_id,
        event_type=event_type
    )

@shared_task(name="auth.user_registered")
def handle_user_registered(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    event_data = event["data"]["data"]["attributes"]
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
        event_data = event["data"]["data"]["attributes"]
        user = User.objects.get(id=event_data["user_id"])
        notification = {
            "event_type": "user_deleted",
            "user": user.username
        }
        for friend in user.friends.all():
            send_notification(friend.id, notification)
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
        event_data = event["data"]["data"]["attributes"]
        user = User.objects.get(id=event_data["user_id"])
        user.username = event_data["username"]
        user.save()
        mark_event_as_processed(event_id, event["event_type"])
        return f"Username updated to {event_data['username']} in notifications service."
    except User.DoesNotExist:
        return f"User with ID {event_data['id']} does not exist."

@shared_task(name="social.friend_added")
def handle_friend_added(event):
    try:
        event_data = event["data"]["data"]["attributes"]
        user_id = event_data["user_id"]
        other_id = event_data["friend_id"]
        user = User.objects.get(id=user_id)
        other = User.objects.get(id=other_id)
        notification = {
            "event_type": "friend_added",
            "user": user.username,
            "other": other.username
        }
        send_notification(user_id, notification)
        send_notification(other_id, notification)
        user.friends.add(other)
        other.friends.add(user)
        return f"Notified both users that {user.username} and {other.username} are now friends"
    except User.DoesNotExist:
        return "Could not add friend - one or both users do not exist"
    except Exception as e:
        return f"Error adding friend: {str(e)}"

@shared_task(name="social.friend_removed")
def handle_friend_removed(event):
    try:
        event_data = event["data"]["data"]["attributes"]
        user_id = event_data["user_id"]
        other_id = event_data["friend_id"]
        user = User.objects.get(id=user_id)
        other = User.objects.get(id=other_id)
        notification = {
            "event_type": "friend_removed",
            "user": user.username,
            "other": other.username
        }
        send_notification(user_id, notification)
        send_notification(other_id, notification)
        user.friends.remove(other)
        other.friends.remove(user)
        return f"Notified both users that {user.username} and {other.username} are no longer friends"
    except User.DoesNotExist:
        return "Could not remove friend - one or both users do not exist"
    except Exception as e:
        return f"Error removing friend: {str(e)}"

@shared_task(name="social.request_declined")
def handle_request_declined(event):
    event_data = event["data"]["data"]["attributes"]
    user_id = event_data["user_id"]
    other_id = event_data["friend_id"]
    user = User.objects.get(id=user_id)
    other = User.objects.get(id=other_id)
    notification = {
        "event_type": "request_declined",
        "user": user.username,
        "other": other.username
    }
    send_notification(user_id, notification)
    send_notification(other_id, notification)
    return f"Notified both users that {user.username} declined the friend request from {other.username}"

@shared_task(name="social.request_cancelled")
def handle_request_cancelled(event):
    event_data = event["data"]["data"]["attributes"]
    user_id = event_data["user_id"]
    other_id = event_data["friend_id"]
    user = User.objects.get(id=user_id)
    other = User.objects.get(id=other_id)
    notification = {
        "event_type": "request_cancelled",
        "user": user.username,
        "other": other.username
    }
    send_notification(user_id, notification)
    send_notification(other_id, notification)
    return f"Notified both users that {user.username} cancelled the friend request to {other.username}"

@shared_task(name="social.request_sent")
def handle_request_sent(event):
    event_data = event["data"]["data"]["attributes"]
    user_id = event_data["user_id"]
    other_id = event_data["friend_id"]
    user = User.objects.get(id=user_id)
    other = User.objects.get(id=other_id)
    notification = {
        "event_type": "request_sent",
        "user": user.username,
        "other": other.username
    }
    send_notification(user_id, notification)
    send_notification(other_id, notification)
    return f"Notified both users that {user.username} sent a friend request to {other.username}"

@shared_task(name="social.avatar_changed")
def handle_avatar_changed(event):
    event_data = event["data"]["data"]["attributes"]
    user_id = event_data["user_id"]
    user = User.objects.get(id=user_id)
    notification = {
        "event_type": "avatar_changed",
        "user": user.username
    }
    send_notification(user_id, notification)
    return f"Notified {user.username} that their avatar has been changed"

@shared_task(name="pong.match_invitation")
def handle_pong_match_invitation(event):
    event_data = event["data"]["data"]["attributes"]
    sender_id = event_data["sender_id"]
    receiver_id = event_data["receiver_id"]
    sender = User.objects.get(id=sender_id)
    receiver = User.objects.get(id=receiver_id)
    notification = {
        "event_type": "pong.match_invitation",
        "user": sender.username,
        "other": receiver.username
    }
    send_notification(receiver_id, notification)
    send_notification(sender_id, notification)
    return f"Notified both users that {sender.username} invited {receiver.username} to a match"

@shared_task(name="pong.tournament_invitation")
def handle_pong_tournament_invitation(event):
    event_data = event["data"]["data"]["attributes"]
    sender_id = event_data["sender_id"]
    receiver_id = event_data["receiver_id"]
    sender = User.objects.get(id=sender_id)
    receiver = User.objects.get(id=receiver_id)
    notification = {
        "event_type": "pong.tournament_invitation",
        "user": sender.username,
        "other": receiver.username
    }
    send_notification(receiver_id, notification)
    send_notification(sender_id, notification)
    return f"Notified both users that {sender.username} invited {receiver.username} to a tournament"
