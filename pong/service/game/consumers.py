import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from django.db.models import Q
from core.models import PongGame, User  # Import the database models
from asgiref.sync import sync_to_async


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handles new WebSocket connections"""
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'game_{self.room_name}'

        # Load existing game session or create a new one
        self.game = await sync_to_async(self.get_or_create_game)()

        # Join WebSocket group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        """Handles disconnection of a player."""
        if self.game:
            self.game.status = 'finished'  # Mark game as finished
            await sync_to_async(self.game.save)()  # Persist changes

        # Leave WebSocket group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    """ .json received from frontend through WebSocket
    {
        "action": "move",       // Action type (e.g., 'move', 'register')
        "player": "player1",    // Identifies the player ('player1', 'player2')
        "direction": "UP",      // Movement direction: "UP", "DOWN", "STOP"
        "game_key": "valid_key_here"
    }
    """
    async def receive(self, text_data):
        """Handles incoming WebSocket messages from clients."""
        try:
            data = json.loads(text_data)
            action = data.get('action')
            player_name = data.get('player')
            direction = data.get('direction')
            game_key = data.get('game_key')

            # Validate game key
            if game_key != str(self.game.game_key):
                await self.send(json.dumps({"error": "Invalid game key"}))
                return

            # Handle actions
            if action == 'register':
                await self.register_player(player_name)
            elif action == 'move':
                if not direction:
                    raise ValueError("Direction is required for movement")
                await self.update_player_movement(player_name, direction)

            # Update and broadcast game state
            await self.broadcast_game_state()

        except ValueError as e:
            await self.send(json.dumps({"error": str(e)}))
        except Exception as e:
            await self.send(json.dumps({"error": "An unexpected error occurred"}))

    @sync_to_async
    def get_or_create_game(self):
        """Fetches or creates a game instance using the game_key."""
        game, _ = PongGame.objects.get_or_create(status="in_progress")
        return game

    @sync_to_async
    def register_player(self, player_name):
        """Registers a player in the game session."""
        if not player_name:
            raise ValueError("Player name is required")

        player, _ = User.objects.get_or_create(username=player_name)

        if not self.game.player1:
            self.game.player1 = player
        elif not self.game.player2:
            self.game.player2 = player
        else:
            raise ValueError("Game is full")

        # Start game when both players are registered
        if self.game.player1 and self.game.player2:
            self.game.status = "in_progress"

        self.game.save()

    @sync_to_async
    def update_player_movement(self, player_name, direction):
        """Updates player movement and persists changes."""
        if player_name == self.game.player1.username:
            player_key = "player1"
        elif player_name == self.game.player2.username:
            player_key = "player2"
        else:
            return

        current_y = self.game.player_positions.get(player_key, {}).get("y", self.game.board_height // 2)

        if direction == "UP":
            new_y = max(0, current_y - 5)
        elif direction == "DOWN":
            new_y = min(self.game.board_height - self.game.player_height, current_y + 5)
        else:  # STOP case
            new_y = current_y

        self.game.update_position(player_key, {"y": new_y})  # Save new position in JSONField
        self.game.save()

    async def broadcast_game_state(self):
        """Updates ball position and broadcasts game state."""
        await sync_to_async(self.game.update_ball_position)(self.game.ball_position)  # Move ball
        self.game.save()

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
            "xVel": 7,
            "yVel": -4
        },
        "status": "in_progress"
    }
    """
    @sync_to_async
    def get_game_state(self):
        """Returns the current game state from the database."""
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
