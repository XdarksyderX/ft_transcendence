import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from core.models import Message

User = get_user_model()

class GlobalChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        self.user_group_name = None

        await self.accept()

        if self.user.is_anonymous:
            await self.send(text_data=json.dumps({
                "status": "error",
                "message": "Authentication required"
            }))
            await self.close()
            return

        self.user_group_name = f"user_{self.user.username}"
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)

        await self.send(text_data=json.dumps({
            "status": "success",
            "message": "Connection established"
        }))

    async def disconnect(self, close_code):
        if self.user_group_name:
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_content = data.get("message", "").strip()
            receiver_username = data.get("receiver", "").strip()

            if not message_content or not receiver_username:
                await self.send(text_data=json.dumps({
                    "status": "error",
                    "message": "Both message and receiver are required"
                }))
                return

            receiver = await sync_to_async(User.objects.get)(username=receiver_username)
            msg = await sync_to_async(Message.objects.create)(
                content=message_content,
                sender=self.user,
                receiver=receiver
            )

            await self.channel_layer.group_send(
                f"user_{receiver.username}",
                {
                    "type": "chat_message",
                    "status": "success",
                    "message": "New message received",
                    "data": {
                        "message": msg.content,
                        "sender": self.user.username,
                        "receiver": receiver.username,
                        "sent_at": str(msg.sent_at),
                        "is_special": msg.is_special,
                        "is_read": msg.is_read
                    }
                }
            )
        except User.DoesNotExist:
            await self.send(text_data=json.dumps({
                "status": "error",
                "message": "Receiver not found"
            }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                "status": "error",
                "message": "Invalid JSON format"
            }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "status": event.get("status", "success"),
            "message": event.get("message", ""),
            "data": event.get("data", {})
        }))

    async def pong_new_match_invitation(self, event):
        await self.send(text_data=json.dumps(event["event"]))

    async def pong_new_tournament_invitation(self, event):
        await self.send(text_data=json.dumps(event["event"]))
