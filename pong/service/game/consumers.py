import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from django.db.models import Q
from core.models import PongGame, User  # Import the database models
from asgiref.sync import sync_to_async


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'game_{self.room_name}'
        self.game = None  # Initialize game object

        # Add the WebSocket connection to the group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        """Handles disconnection of a player. If both players leave, the game is reset."""
        if self.game:
            await sync_to_async(self.game.delete)()  # Clean up game if both players leave

        # Remove from WebSocket group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    """ .json received from frontend through WebSocket
    {
        "action": "move",       // Action type (e.g., 'move', 'register', 'power-up'), register is registering for the game (connecting)
        "player": "player1",    // Identifies the player (e.g., 'player1', 'player2') 1: left, 2: right
        "position": {           // Position object (only for 'move' actions)
        "x": 100,               // X-coordinate, maybe REDUNDANT (move is vertical) but could be important x_pos is configurable in game settings
        "y": 200                // Y-coordinate
        },
        "game_key": "unique_game_key"    // A unique key to verify the player belongs to the game
    }
    """
    async def receive(self, text_data):
        """Handles incoming WebSocket messages from clients."""
        try:
            # Parse incoming data
            data = json.loads(text_data)
            action = data.get('action')
            player_name = data.get('player')
            position = data.get('position')
            game_key = data.get('game_key')

            # Validate game existence
            if not self.game:
                self.game = await sync_to_async(self.get_or_create_game)(game_key)

            # Validate game key
            if game_key != str(self.game.game_key):
                await self.send(json.dumps({"error": "Invalid game key"}))
                return

            # Handle different actions
            if action == 'register':
                await self.register_player(player_name)
            elif action == 'move':
                if not position:
                    raise ValueError("Position data is required for movement")
                await self.update_positions(player_name, position)

            # Send updated game state to all players
            await self.broadcast_game_state()

        except ValueError as e:
            await self.send(json.dumps({"error": str(e)}))
        except Exception as e:
            await self.send(json.dumps({"error": "An unexpected error occurred"}))

    @sync_to_async
    def get_or_create_game(self, game_key):
        """Fetches or creates a game instance with the given game_key."""
        game, created = PongGame.objects.get_or_create(
            game_key=uuid.UUID(game_key),
            defaults={'status': 'pending'}
        )
        return game

    @sync_to_async
    def register_player(self, player_name):
        """Registers a player in the game session and updates the database."""
        if not player_name:
            raise ValueError("Player name is required")

        player, _ = User.objects.get_or_create(username=player_name)

        if not self.game.player1:
            self.game.player1 = player
        elif not self.game.player2:
            self.game.player2 = player
        else:
            raise ValueError("Game is already full")

        # Start game when both players are registered
        if self.game.player1 and self.game.player2:
            self.game.status = 'in_progress'
        self.game.save()

    @sync_to_async
    def update_positions(self, player_name, position):
        """Updates player or ball positions based on received movement data."""
        if player_name == self.game.player1.username:
            self.game.player_positions["player1"] = position
        elif player_name == self.game.player2.username:
            self.game.player_positions["player2"] = position
        self.game.save()

    async def broadcast_game_state(self):
        """Sends the latest game state to all connected players."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_update',
                'state': await sync_to_async(self.get_game_state)()
            }
        )

    """ .json example sent to WebSocket for frontend to render
    {
        "players": {
            "player1": {"x": 50, "y": 200, "score": 2},
            "player2": {"x": 650, "y": 250, "score": 3}
        },
        "ball": {
            "x": 350,
            "y": 250,
            "xVel": 7, // velocities could be removed depending speed of updates
            "yVel": -4
            },
        "status": "in_progress"
    }
    On the frontend, JavaScript should listen for incoming WebSocket messages, parse & then render based on the info"""
    @sync_to_async
    def get_game_state(self):
        """Returns the current game state as a JSON object."""
        return {
            "players": self.game.player_positions,
            "ball": self.game.ball_position,
            "status": self.game.status
        }

    async def game_update(self, event):
        """Handles sending game updates to clients through WebSockets."""
        await self.send(text_data=json.dumps(event['state']))

    async def game_start(self, event):
        """Handles sending game start notifications to clients."""
        await self.send(text_data=json.dumps({"message": event['message']}))
