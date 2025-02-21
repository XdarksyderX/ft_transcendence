import json
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from core.models import PongGame
from asgiref.sync import sync_to_async
from logic import Game

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """Handles new WebSocket connections."""
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'game_{self.room_name}'

        # Get authenticated user
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        # Fetch game using game_key from room_name
        self.game = await sync_to_async(self.get_game_by_key)(self.room_name)
        if not self.game:
            await self.close()
            return

        # Verify that the user is one of the game players
        if self.user != self.game.player1 and self.user != self.game.player2:
            await self.close()
            return

        # Prevent multiple connections for the same user
        if hasattr(self.game, 'connected_players') and self.user.username in self.game.connected_players:
            await self.send(json.dumps({"status": "error", "message": "User already connected from another location."}))
            await self.close()
            return

        # Initialize readiness state
        if not hasattr(self.game, 'ready_players'):
            self.game.ready_players = []

        # Initialize connected players list
        if not hasattr(self.game, 'connected_players'):
            self.game.connected_players = []

        # Add user to connected players
        if self.user.username not in self.game.connected_players:
            self.game.connected_players.append(self.user.username)

        await sync_to_async(self.game.save)()

        # Join WebSocket group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Notify others of reconnection
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_reconnect',
                'status': 'player_reconnected',
                'message': f'{self.user.username} has reconnected.'
            }
        )

    async def disconnect(self, close_code):
        """Handles disconnection of a player."""
        # Remove user from connected players
        if self.user.username in self.game.connected_players:
            self.game.connected_players.remove(self.user.username)
            await sync_to_async(self.game.save)()

        # Notify others of disconnection
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_disconnect',
                'status': 'player_disconnected',
                'message': f'{self.user.username} has disconnected.'
            }
        )

        # Leave WebSocket group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """Handles incoming WebSocket messages from clients."""
        try:
            data = json.loads(text_data)
            action = data.get('action')
            direction = data.get('direction')

            # Handle actions
            if action == 'move':
                if not direction:
                    await self.send(json.dumps({"status": "error", "message": "Direction is required for movement"}))
                    return
                await self.update_player_movement(self.user, direction)
            elif action == 'ready':
                await self.mark_player_ready(self.user)
            else:
                await self.send(json.dumps({"status": "error", "message": f"Unknown action: {action}"}))

            # Update ball position & broadcast updated game state
            await self.calculate_ball_position()
            await self.broadcast_game_state()

        except ValueError as e:
            await self.send(json.dumps({"status": "error", "message": str(e)}))
        except Exception as e:
            await self.send(json.dumps({"status": "error", "message": "An unexpected error occurred"}))

    @sync_to_async
    def get_game_by_key(self, game_key):
        """Fetches a game instance using the game_key."""
        try:
            return PongGame.objects.get(game_key=uuid.UUID(game_key))
        except PongGame.DoesNotExist:
            return None

    @sync_to_async
    def update_player_movement(self, user, direction):
        """Updates player movement and persists changes."""
        if user == self.game.player1:
            player_key = "player1"
        elif user == self.game.player2:
            player_key = "player2"
        else:
            return  # Ignore invalid players

        player_positions = self.game.player_positions
        if player_key not in player_positions:
            player_positions[player_key] = {
                "x": self.game.x_margin if player_key == "player1" else self.game.p2_xpos,
                "y": self.game.p_y_mid
            }

        current_y = player_positions[player_key]["y"]

        # Update position based on direction
        if direction == "UP":
            new_y = max(0, current_y - self.game.player_speed)
        elif direction == "DOWN":
            new_y = min(self.game.board_height - self.game.player_height, current_y + self.game.player_speed)
        else:  # STOP case
            new_y = current_y

        # Save updated position in database
        player_positions[player_key]["y"] = new_y
        self.game.player_positions = player_positions
        self.game.save()

    async def mark_player_ready(self, user):
        """Marks a player as ready and starts the game if both are ready."""
        if user.username not in self.game.ready_players:
            self.game.ready_players.append(user.username)

        if len(self.game.ready_players) == 2:
            # Both players are ready, start the game
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_start',
                    'status': 'game_starting',
                    'message': 'Both players are ready. Game is starting!'
                }
            )
            self.game.status = 'in_progress'
            await sync_to_async(self.game.save)()

    async def calculate_ball_position(self):
        """Updates ball movement based on game logic and saves the updated state."""
        game_logic = Game(self.game)
        game_logic.update_ball_position()
        await sync_to_async(self.game.save)()

    async def broadcast_game_state(self):
        """Broadcasts updated game state to all players."""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_update',
                'status': 'game_update',
                'state': await sync_to_async(self.get_game_state)()
            }
        )

    @sync_to_async
    def get_game_state(self):
        """Returns the current game state."""
        return {
            "players": {
                "player1": {
                    "username": self.game.player1.username,
                    **self.game.player_positions.get("player1", {"x": self.game.x_margin, "y": self.game.p_y_mid}),
                    "score": self.game.player1_score
                },
                "player2": {
                    "username": self.game.player2.username,
                    **self.game.player_positions.get("player2", {"x": self.game.p2_xpos, "y": self.game.p_y_mid}),
                    "score": self.game.player2_score
                }
            },
            "ball": self.game.ball_position,
            "status": self.game.status
        }

    async def game_update(self, event):
        """Sends game updates to clients."""
        await self.send(text_data=json.dumps(event))

    async def game_start(self, event):
        """Sends game start notification to clients."""
        await self.send(text_data=json.dumps(event))

    async def player_disconnect(self, event):
        """Notifies clients when a player disconnects."""
        await self.send(text_data=json.dumps(event))

    async def player_reconnect(self, event):
        """Notifies clients when a player reconnects."""
        await self.send(text_data=json.dumps(event))
