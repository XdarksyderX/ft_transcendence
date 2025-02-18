import jwt
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = await self.get_user_from_cookie()
        if self.user_id:
            self.room_group_name = f"user_{self.user_id}"
            await self.channel_layer.group_add(self.room_group_name, self.channel_name)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.user_id:
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def send_notification(self, event):
        await self.send_json(event["data"])

    async def get_user_from_cookie(self):
        cookies = {}
        for header in self.scope.get("headers", []):
            header_name = header[0].decode("utf-8")
            header_value = header[1].decode("utf-8")
            if header_name == "cookie":
                for pair in header_value.split(";"):
                    if "=" in pair:
                        key, value = pair.split("=", 1)
                        cookies[key.strip()] = value.strip()

        token = cookies.get("access_token")
        if not token:
            return None

        try:
            payload = jwt.decode(
                token,
                settings.SIMPLE_JWT["VERIFYING_KEY"],
                algorithms=[settings.SIMPLE_JWT["ALGORITHM"]],
            )
            return payload.get("user_id")
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
