import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(text_data=json.dumps({"message": "WebSocket conectado"}))

    async def disconnect(self, close_code):
        print(f"WebSocket desconectado: {close_code}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message", "")
        await self.send(text_data=json.dumps({"message": message}))
