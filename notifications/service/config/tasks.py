from celery import shared_task
import json
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from core.models import IncomingEvent, User, Notification

def event_already_processed(event_id):
    return IncomingEvent.objects.filter(event_id=event_id).exists()

def mark_event_as_processed(event_id, event_type):
    IncomingEvent.objects.create(
        event_id=event_id,
        event_type=event_type
    )

def send_notification(user_id, notification):
    try:
        user = User.objects.get(id=user_id)
        notif = Notification.objects.create(
            content=json.dumps(notification),
            receiver=user
        )
        user.notifications.add(notif)

        channel_layer = get_channel_layer()
        room_group_name = f"user_{user_id}"
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                "type": "notification",
                "data": notification
            }
        )
    except User.DoesNotExist:
        print(f"User with id {user_id} does not exist. Notification not sent.")

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

@shared_task(name="social.friend_added")
def handle_friend_added(event):
    event_data = event["data"]["data"]["attributes"]
    user_id = event_data["user_id"]
    other_id = event_data["friend_id"]
    notification = {
        "event_type": "friend_added",
        "user_id": user_id,
        "other_id": other_id
    }
    send_notification(user_id, notification)
    send_notification(other_id, notification)
    return f"Notified both users that user_{user_id} and user_{other_id} are now friends"

@shared_task(name="social.friend_removed")
def handle_friend_removed(event):
    event_data = event["data"]["data"]["attributes"]
    user_id = event_data["user_id"]
    other_id = event_data["friend_id"]
    notification = {
        "event_type": "friend_removed",
        "user_id": user_id,
        "other_id": other_id
    }
    send_notification(user_id, notification)
    send_notification(other_id, notification)
    return f"Notified both users that user_{user_id} and user_{other_id} are no longer friends"

@shared_task(name="social.request_declined")
def handle_request_declined(event):
    event_data = event["data"]["data"]["attributes"]
    user_id = event_data["user_id"]
    other_id = event_data["friend_id"]
    notification = {
        "event_type": "request_declined",
        "user_id": user_id,
        "other_id": other_id
    }
    send_notification(user_id, notification)
    send_notification(other_id, notification)
    return f"Notified both users that user_{user_id} declined the friend request from user_{other_id}"

@shared_task(name="social.request_cancelled")
def handle_request_cancelled(event):
    event_data = event["data"]["data"]["attributes"]
    user_id = event_data["user_id"]
    other_id = event_data["friend_id"]
    notification = {
        "event_type": "request_cancelled",
        "user_id": user_id,
        "other_id": other_id
    }
    send_notification(user_id, notification)
    send_notification(other_id, notification)
    return f"Notified both users that user_{user_id} cancelled the friend request to user_{other_id}"

@shared_task(name="social.request_sent")
def handle_request_sent(event):
    event_data = event["data"]["data"]["attributes"]
    user_id = event_data["user_id"]
    other_id = event_data["friend_id"]
    notification = {
        "event_type": "request_sent",
        "user_id": user_id,
        "other_id": other_id
    }
    send_notification(user_id, notification)
    send_notification(other_id, notification)
    return f"Notified both users that user_{user_id} sent a friend request to user_{other_id}"

@shared_task(name="social.avatar_changed")
def handle_avatar_changed(event):
    event_data = event["data"]["data"]["attributes"]
    user_id = event_data["user_id"]
    notification = {
        "event_type": "avatar_changed",
        "user_id": user_id
    }
    send_notification(user_id, notification)
    return f"Notified user_{user_id} that their avatar has been changed"

@shared_task(name="pong.match_invitation")
def handle_friend_removed(event):
    event_data = event["data"]["data"]["attributes"]
    sender_id = event_data["sender_id"]
    receiver_id = event_data["receiver_id"]
    notification = {
        "event_type": "match_invitation",
        "sender_id": sender_id,
        "receiver_id": receiver_id
    }
    send_notification(receiver_id, notification)
    send_notification(sender_id, notification)
    return f"Notified both users that user_{sender_id} invited user_{receiver_id} to a match"


@shared_task(name="pong.tournament_invitation")
def handle_friend_removed(event):
    event_data = event["data"]["data"]["attributes"]
    sender_id = event_data["sender_id"]
    receiver_id = event_data["receiver_id"]
    notification = {
        "event_type": "tournament_invitation",
        "sender_id": sender_id,
        "receiver_id": receiver_id
    }
    send_notification(receiver_id, notification)
    send_notification(sender_id, notification)
    return f"Notified both users that user_{sender_id} invited user_{receiver_id} to a tournament"
