import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from core.utils.event_domain import publish_event

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handles WebSocket connection and registers the user."""
        self.user = self.scope.get("user", None)

        if self.user and self.user.is_authenticated:
            self.room_group_name = f"user_{self.user.id}"
            try:
                await self.channel_layer.group_add(self.room_group_name, self.channel_name)
                await self.accept()
                print(f"[WebSocket] Connected: user {self.user.id}")
                
                publish_event("events", "events.user_connected", {"user_id": self.user.id})

                self.keepalive_task = asyncio.create_task(self.keepalive())

            except Exception as e:
                print(f"[WebSocket] Error during connection: {e}")
                await self.close()
        else:
            print("[WebSocket] Unauthorized connection attempt, closing WebSocket.")
            await self.close()

    async def disconnect(self, close_code):
        """Handles WebSocket disconnection and cleanup."""
        if hasattr(self, "room_group_name"):
            try:
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
                print(f"[WebSocket] Disconnected: user {self.user.id}")
                publish_event("events", "events.user_disconnected", {"user_id": self.user.id})
            except Exception as e:
                print(f"[WebSocket] Error during disconnection: {e}")

        if hasattr(self, "keepalive_task"):
            self.keepalive_task.cancel()

    async def receive(self, text_data):
        """Handles incoming WebSocket messages."""
        try:
            message = json.loads(text_data)
            print(f"[WebSocket] Received message from user {self.user.id}: {message}")
        except json.JSONDecodeError:
            print("[WebSocket] Error decoding message JSON")

    async def notification(self, event):
        """Handles messages sent from the backend to the WebSocket."""
        try:
            await self.send(text_data=json.dumps(event["data"]))
            print(f"[WebSocket] Sent notification to user {self.user.id}: {event['data']}")
        except Exception as e:
            print(f"[WebSocket] Error sending notification: {e}")

    async def keepalive(self):
        """Send periodic ping messages to keep the connection alive."""
        while True:
            try:
                await self.send(json.dumps({"type": "ping"}))
                print(f"[WebSocket] Sent keepalive ping to user {self.user.id}")
            except Exception as e:
                print(f"[WebSocket] Connection lost. Attempting to reconnect... Error: {e}")
                break
            await asyncio.sleep(30)
