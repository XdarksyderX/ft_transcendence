
import json
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from core.models import User, Notification

def send_notification(user_id, notification):
    send_event(user_id, notification, is_notification=True)

def send_event(user_id, event, is_notification=False):
    try:
        if is_notification:
            user = User.objects.get(id=user_id)
            notif = Notification.objects.create(
                content=json.dumps(event),
                receiver=user
            )
            user.notifications.add(notif)
        
        event["is_notification"] = is_notification

        channel_layer = get_channel_layer()
        room_group_name = f"user_{user_id}"
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                "type": "event" if not is_notification else "notification",
                "data": event
            }
        )
    except User.DoesNotExist:
        print(f"User with id {user_id} does not exist. Notification not sent.")