import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .logic import Game  # Import your game logic here

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'game_{self.room_name}'

        # Initialize game logic
        self.game = Game(player1=None, player2=None)

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Handle player disconnection
        if self.game.player1 == self.channel_name:
            self.game.player1 = None
        elif self.game.player2 == self.channel_name:
            self.game.player2 = None

        # If both players leave, reset the game
        if not self.game.player1 and not self.game.player2:
            self.game = Game()

        # Leave the room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            # Parse incoming data
            data = json.loads(text_data)
            action = data.get('action')
            player = data.get('player')
            position = data.get('position')
            game_key = data.get('game_key')

            # Validate the game key
            if game_key != "your_secret_key_here":  # Replace with your actual key logic
                await self.send(json.dumps({"error": "Invalid game key"}))
                return

            if action == 'register':
                if not player:
                    raise ValueError("Player name is required for registration")
                if not self.game.player1:
                    self.game.player1 = player
                elif not self.game.player2:
                    self.game.player2 = player
                else:
                    await self.send(json.dumps({"error": "Game is already full"}))
                    return

                # Notify players when both are registered
                if self.game.player1 and self.game.player2:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game_start',
                            'message': 'Game is starting!'
                        }
                    )
            elif action == 'move':
                if not player or not position:
                    raise ValueError("Player and position are required for movement")
                self.game.update_player_position(player, position)
                self.game.update_ball_position()

            # Broadcast the updated game state
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_update',
                    'state': self.game.get_game_state()
                }
            )
        except ValueError as e:
            await self.send(json.dumps({"error": str(e)}))
        except Exception as e:
            await self.send(json.dumps({"error": "An unexpected error occurred"}))

    async def game_update(self, event):
        # Send the updated game state to WebSocket
        await self.send(text_data=json.dumps(event['state']))

    async def game_start(self, event):
        # Notify players that the game is starting
        await self.send(text_data=json.dumps({"message": event['message']}))