from channels.generic.websocket import AsyncWebsocketConsumer
from core.utils.event_domain import publish_event

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user", None)
        if self.user and self.user.is_authenticated:
            self.room_group_name = f"user_{self.user.id}"
            publish_event("events", "events.user_connected", {"user_id": self.user.id})
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
            publish_event("events", "events.user_disconnected", {"user_id": self.user.id})
        else:
            print("disconnect called without room_group_name")

    async def notification(self, event):
        await self.send_json(event["data"])
