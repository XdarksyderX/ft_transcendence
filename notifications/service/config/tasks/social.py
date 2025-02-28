from celery import shared_task
from core.models import User
from core.utils.notifications import send_notification
from .common import event_already_processed, mark_event_as_processed

@shared_task(name="social.friend_added")
def handle_friend_added(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

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
        mark_event_as_processed(event["event_id"], event["event_type"])
        return f"Notified both users that {user.username} and {other.username} are now friends"
    except User.DoesNotExist:
        return "Could not add friend - one or both users do not exist"
    except Exception as e:
        return f"Error adding friend: {str(e)}"

@shared_task(name="social.friend_removed")
def handle_friend_removed(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

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
        mark_event_as_processed(event["event_id"], event["event_type"])
        return f"Notified both users that {user.username} and {other.username} are no longer friends"
    except User.DoesNotExist:
        return "Could not remove friend - one or both users do not exist"
    except Exception as e:
        return f"Error removing friend: {str(e)}"

@shared_task(name="social.request_declined")
def handle_request_declined(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

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
    mark_event_as_processed(event["event_id"], event["event_type"])
    return f"Notified both users that {user.username} declined the friend request from {other.username}"

@shared_task(name="social.request_cancelled")
def handle_request_cancelled(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

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
    mark_event_as_processed(event["event_id"], event["event_type"])
    return f"Notified both users that {user.username} cancelled the friend request to {other.username}"

@shared_task(name="social.request_sent")
def handle_request_sent(event):
    event_id = event["event_id"]
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

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
    mark_event_as_processed(event["event_id"], event["event_type"])
    return f"Notified both users that {user.username} sent a friend request to {other.username}"

@shared_task(name="social.avatar_changed")
def handle_avatar_changed(event):
	event_id = event["event_id"]
	if event_already_processed(event_id):
		return f"Event {event_id} already processed."
	event_data = event["data"]["data"]["attributes"]
	user_id = event_data["user_id"]
	user = User.objects.get(id=user_id)
	notification = {
		"event_type": "avatar_changed",
		"user": user.username
	}
	send_notification(user_id, notification)
	mark_event_as_processed(event["event_id"], event["event_type"])
	return f"Notified {user.username} that their avatar has been changed"