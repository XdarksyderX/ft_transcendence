from celery import shared_task
from asgiref.sync import async_to_sync
from events.utils import rabbitmq_client
from channels.layers import get_channel_layer

def send_notification(user_id, notification):
	channel_layer = get_channel_layer()
	room_group_name = f"user_{user_id}"
	async_to_sync(channel_layer.group_send)(
		room_group_name,
		{
			"type": "notification",
			"message": notification
		}
	)

@shared_task(name="social.friend_added")
def handle_user_deleted(event):
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
def handle_user_deleted(event):
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
def handle_user_deleted(event):
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
def handle_user_deleted(event):
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
def handle_user_deleted(event):
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
def handle_user_deleted(event):
	event_data = event["data"]["data"]["attributes"]
	user_id = event_data["user_id"]
	notification = {
		"event_type": "avatar_changed",
		"user_id": user_id
	}
	send_notification(user_id, notification)
	return f"Notified user_{user_id} that their avatar has been changed"


