import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from core.utils.event_domain import publish_event
from core.utils.notifications import send_event
from asgiref.sync import sync_to_async

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user", None)

        if self.user and self.user.is_authenticated:
            self.room_group_name = f"user_{self.user.id}"
            try:
                await self.channel_layer.group_add(self.room_group_name, self.channel_name)
                await self.accept()

                print(f"[WebSocket] Connected: user {self.user.id}")

                await self.publish_event_async("events", "events.user_connected", {"user_id": self.user.id})

                friends = await self.get_user_friends()

                for friend in friends:
                    notification = {
                        "event_type": "friend_status_updated",
                        "user": self.user.username,
                        "other": friend["username"],
                        "is_online": True
                    }
                    await self.send_event_async(friend["id"], notification)

                self.keepalive_task = asyncio.create_task(self.keepalive())

            except Exception as e:
                print(f"[WebSocket] Error during connection: {e}")
                await self.close()
        else:
            print("[WebSocket] Unauthorized connection attempt, closing WebSocket.")
            await self.close()

    async def disconnect(self, close_code):
        print(f"[WebSocket] Disconnecting with code: {close_code}")
        
        if hasattr(self, "keepalive_task"):
            self.keepalive_task.cancel()
        
        if hasattr(self, "user") and self.user and self.user.is_authenticated:
            try:
                if hasattr(self, "room_group_name"):
                    await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
                
                print(f"[WebSocket] Disconnected: user {self.user.id}")
                
                await self.publish_event_async("events", "events.user_disconnected", {"user_id": self.user.id})
                
                try:
                    friends = await self.get_user_friends()
                    
                    for friend in friends:
                        notification = {
                            "event_type": "friend_status_updated",
                            "user": self.user.username,
                            "other": friend["username"],
                            "is_online": False
                        }
                        await self.send_event_async(friend["id"], notification)
                except Exception as e:
                    print(f"[WebSocket] Error notifying friends during disconnection: {e}")
                    
            except Exception as e:
                print(f"[WebSocket] Error during disconnection: {e}")
                try:
                    await self.publish_event_async("events", "events.user_disconnected", {"user_id": self.user.id})
                except Exception as ex:
                    print(f"[WebSocket] Failed final attempt to send disconnect event: {ex}")

            if hasattr(self, "room_group_name"):
                try:
                    await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

                    print(f"[WebSocket] Disconnected: user {self.user.id}")

                    await self.publish_event_async("events", "events.user_disconnected", {"user_id": self.user.id})

                    friends = await self.get_user_friends()

                    for friend in friends:
                        notification = {
                            "event_type": "friend_status_updated",
                            "user": self.user.username,
                            "other": friend["username"],
                            "is_online": False
                        }
                        await self.send_event_async(friend["id"], notification)

                except Exception as e:
                    print(f"[WebSocket] Error during disconnection: {e}")

            if hasattr(self, "keepalive_task"):
                self.keepalive_task.cancel()

    async def receive(self, text_data):
        try:
            message = json.loads(text_data)
            print(f"[WebSocket] Received message from user {self.user.id}: {message}")
        except json.JSONDecodeError:
            print("[WebSocket] Error decoding message JSON")

    async def notification(self, event):
        try:
            await self.send(text_data=json.dumps(event["data"]))
        except Exception as e:
            print(f"[WebSocket] Error sending notification: {e}")
    
    async def event(self, event):
        try:
            await self.send(text_data=json.dumps(event["data"]))
        except Exception as e:
            print(f"[WebSocket] Error sending event: {e}")

    async def keepalive(self):
        while True:
            try:
                await self.send(json.dumps({"event_type": "ping"}))
            except Exception as e:
                print(f"[WebSocket] Connection lost: {e}")
                publish_event("events", "events.user_disconnected", {"user_id": self.user.id})
                break
            await asyncio.sleep(30)

    async def send_event_async(self, user_id, event):
        await sync_to_async(send_event)(user_id, event)

    async def publish_event_async(self, exchange, event_type, data):
        await sync_to_async(publish_event)(exchange, event_type, data)

    async def get_user_friends(self):
        friends = await sync_to_async(lambda: list(
            self.user.friends.values("id", "username")
        ))()
        return friends
