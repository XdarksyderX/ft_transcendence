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

		self.receiver_id = self.scope["url_route"]["kwargs"]["receiver_id"]
		self.room_group_name = f"chat_{min(self.sender.id, int(self.receiver_id))}_{max(self.sender.id, int(self.receiver_id))}"

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

			receiver = await sync_to_async(User.objects.get)(id=self.receiver_id)
			msg = await sync_to_async(Message.objects.create)(
				content=message_content,
				sender_id=self.sender,
				receiver_id=receiver
			)
			await self.channel_layer.group_send(
				self.room_group_name,
				{
					"type": "chat_message",
					"status": "success",
					"message": "Message received",
					"data": {
						"message": msg.content,
						"sender_id": self.sender.id,
						"receiver_id": self.receiver_id,
						"sent_at": str(msg.sent_at),
						"is_special": str(msg.is_special),
						"is_read": str(msg.is_read)
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

	async def new_match_invitation(self, event):
		await self.send(text_data=json.dumps(event))