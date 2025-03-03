
import json
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from core.models import IncomingEvent, User, Notification

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

def send_event(user_id, event):
    channel_layer = get_channel_layer()
    room_group_name = f"user_{user_id}"
    async_to_sync(channel_layer.group_send)(
        room_group_name,
        {
            "type": "notification",
            "data": event
        }
    )