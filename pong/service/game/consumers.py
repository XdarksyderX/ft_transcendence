from channels.generic.websocket import AsyncWebsocketConsumer
from .logic import Game
import json

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'game_{self.room_name}'
        self.game = Game(player1="player1", player2="player2")  # Initialize game logic

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Receive message from WebSocket
        data = json.loads(text_data)
        action = data['action']  # ex 'move'
        player = data['player']  # ex 'player1'
        position = data.get('position', None)  # ex {'x': 100, 'y': 200}

        # Update game logic
        if action == 'move' and position:
            self.game.update_player_position(player, position)
        self.game.update_ball_position()  # Update ball state

        # Broadcast updated game state to the group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_update',
                'state': self.game.get_game_state()  # Send updated game state
            }
        )

    async def game_update(self, event):
        # Send updated game state to WebSocket
        await self.send(text_data=json.dumps(event['state']))
