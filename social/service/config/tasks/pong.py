from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from core.models import Message
import json
from .utils import event_already_processed, mark_event_as_processed

User = get_user_model()

@shared_task(name="pong.match_invitation")
def handle_match_invitation(event):
    event_id = event["event_id"]
    
    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    try:
        event_data = event["data"]["attributes"]
        sender = User.objects.get(id=event_data["sender_id"])
        receiver = User.objects.get(id=event_data["receiver_id"])
        invitation_token = event_data["invitation_token"]

        msg = Message.objects.create(
            sender=sender,
            receiver=receiver,
            content=json.dumps({"type": "pong-match", "invitation_token": invitation_token}),
            is_special=True
        )
        msg.save()

        data = {
            "type": "message",
            "status": "success",
            "message": "New match invitation received",
            "data": {
                "message": json.dumps({
                    "type": "pong-match",
                    "invitation_token": invitation_token
                }),
                "is_read": False,
                "is_special": True,
                "receiver": receiver.username,
                "sender": sender.username,
                "sent_at": msg.sent_at.strftime("%Y-%m-%d %H:%M:%S.%f%z")
            }
        }

        channel_layer = get_channel_layer()
        for user in [sender, receiver]:
            user_group_name = f"user_{user.username}"
            async_to_sync(channel_layer.group_send)(
                user_group_name,
                {
                    "type": "pong_new_match_invitation",
                    "event": data
                }
            )

        return f"Match invitation message from {sender.username} to {receiver.username} sent correctly."
    
    except User.DoesNotExist:
        return f"Error: User with provided ID not found."
    except Exception as e:
        return f"Error processing match invitation: {str(e)}"

@shared_task(name="pong.tournament_invitation")
def handle_tournament_invitation(event):
    event_id = event["event_id"]

    if event_already_processed(event_id):
        return f"Event {event_id} already processed."

    try:
        event_data = event["data"]["attributes"]
        sender = User.objects.get(id=event_data["sender_id"])
        receiver = User.objects.get(id=event_data["receiver_id"])
        tournament_token = event_data["tournament_token"]
        invitation_token = event_data["invitation_token"]

        msg = Message.objects.create(
            sender=sender,
            receiver=receiver,
            content=json.dumps({"type": "tournament", "tournament_token": tournament_token, "invitation_token": invitation_token}),
            is_special=True
        )
        msg.save()

        data = {
            "type": "message",
            "status": "success",
            "message": "New tournament invitation received",
            "data": {
                "message": json.dumps({
                    "type": "pong-tournament",
                    "tournament_token": tournament_token,
                    "invitation_token": invitation_token
                }),
                "is_read": False,
                "is_special": True,
                "receiver": receiver.username,
                "sender": sender.username,
                "sent_at": msg.sent_at.strftime("%Y-%m-%d %H:%M:%S.%f%z")
            }
        }

        channel_layer = get_channel_layer()
        for user in [sender, receiver]:
            user_group_name = f"user_{user.username}"
            async_to_sync(channel_layer.group_send)(
                user_group_name,
                {
                    "type": "pong_new_tournament_invitation",
                    "event": data
                }
            )

        return f"Tournament invitation message from {sender.username} to {receiver.username} sent correctly."
    
    except User.DoesNotExist:
        return f"Error: User with provided ID not found."
    except Exception as e:
        return f"Error processing tournament invitation: {str(e)}"