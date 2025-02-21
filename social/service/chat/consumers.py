import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model
from core.models import Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.sender = self.scope["user"]

        if self.sender.is_anonymous:
            await self.send(text_data=json.dumps({
                "status": "error",
                "message": "Authentication required"
            }))
            await self.close()
            return


        self.receiver_username = self.scope["url_route"]["kwargs"]["receiver_username"]


        self.room_group_name = f"chat_{min(self.sender.username, self.receiver_username)}_{max(self.sender.username, self.receiver_username)}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.send(text_data=json.dumps({
            "status": "success",
            "message": "Connection established"
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_content = data.get("message", "").strip()

            if not message_content:
                await self.send(text_data=json.dumps({
                    "status": "error",
                    "message": "The message cannot be empty"
                }))
                return


            receiver = await sync_to_async(User.objects.get)(username=self.receiver_username)
            msg = await sync_to_async(Message.objects.create)(
                content=message_content,
                sender=self.sender,
                receiver=receiver
            )
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "status": "success",
                    "message": "Message received",
                    "data": {
                        "message": msg.content,
                        "sender": self.sender.username,
                        "receiver": receiver.username,
                        "sent_at": str(msg.sent_at),
                        "is_special": msg.is_special,
                        "is_read": msg.is_read
                    }
                }
            )
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
        await self.send(text_data=json.dumps(event))

    async def pong_new_tournament_invitation(self, event):
        await self.send(text_data=json.dumps(event))
