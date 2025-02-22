import json
import uuid
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from core.models import PongGame
from asgiref.sync import sync_to_async
from .logic import Game  # Lógica básica del juego

class GameManager:
    def __init__(self, game, broadcast_callback):
        self.game = game
        self.in_progress = False
        self.broadcast = broadcast_callback
        self.event_queue = asyncio.Queue()  # Cola para los eventos

    async def add_event(self, event):
        await self.event_queue.put(event)

    async def process_pending_events(self):
        while not self.event_queue.empty():
            event = await self.event_queue.get()
            # Procesa el evento; por ejemplo, actualizar la posición del jugador,
            # manejar colisiones, etc.
            await self.handle_event(event)

    async def handle_event(self, event):
        # Aquí iría la lógica para procesar cada evento
        pass

    async def update_game_state(self):
        # Actualiza la posición de la bola, colisiones, etc.
        game_logic = Game(self.game)
        await sync_to_async(game_logic.update_ball_position)()
        state = await self.get_game_state()
        await self.broadcast({
            'type': 'game_update',
            'status': 'game_update',
            'state': state
        })

    async def get_game_state(self):
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
            "status": "in_progress" if self.in_progress else "waiting"
        }

    async def start_game(self):
        self.in_progress = True
        await self.broadcast({
            'type': 'game_start',
            'status': 'game_starting',
            'message': 'Both players are ready. Game is starting!'
        })
        tick_interval = 0.1  # Intervalo ajustable, por ejemplo, 10 ms
        while self.in_progress:
            await self.process_pending_events()  # Procesa los eventos encolados
            await self.update_game_state()         # Actualiza el estado del juego
            await asyncio.sleep(tick_interval)       # Cede control para procesar otros eventos

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_key = self.scope['url_route']['kwargs']['game_key']
        self.room_group_name = f'game_{self.game_key}'
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.accept()
            await self.send(json.dumps({"status": "error", "message": "Authentication required"}))
            await self.close()
            return

        self.game = await self.get_game_by_key(self.game_key)
        if not self.game:
            await self.accept()
            await self.send(json.dumps({"status": "error", "message": "Game not found"}))
            await self.close()
            return

        # Validar que el usuario forme parte de la partida y gestionar conexiones
        # ...

        await self.accept()
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        # Crear el GameManager pasando un callback para emitir mensajes a la grupo
        self.game_manager = GameManager(self.game, self.group_broadcast)

    async def disconnect(self, close_code):
        # Remover la conexión del grupo y gestionar estado
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')

            if action == 'move':
                if not self.game_manager.in_progress:
                    await self.send(json.dumps({"status": "error", "message": "Game has not started yet."}))
                    return
                direction = data.get('direction')
                if not direction:
                    await self.send(json.dumps({"status": "error", "message": "Direction is required"}))
                    return
                await self.update_player_movement(self.user, direction)

            elif action == 'ready':
                # Una vez que ambos jugadores están listos, se inicia el juego.
                await self.mark_player_ready(self.user)

            else:
                await self.send(json.dumps({"status": "error", "message": f"Unknown action: {action}"}))
        except Exception as e:
            await self.send(json.dumps({"status": "error", "message": f"Unexpected error: {str(e)}"}))

    async def mark_player_ready(self, user):
        if user.username not in self.game.ready_players:
            self.game.ready_players.append(user.username)
            await sync_to_async(self.game.save)()
        if len(self.game.ready_players) == 2 and not self.game_manager.in_progress:
            # Establecemos el flag antes de iniciar el loop para evitar la condición de carrera
            self.game_manager.in_progress = True
            asyncio.create_task(self.game_manager.start_game())


    async def group_broadcast(self, message):
        await self.channel_layer.group_send(
            self.room_group_name,
            message
        )

    @sync_to_async
    def get_game_by_key(self, game_key):
        try:
            return PongGame.objects.select_related('player1', 'player2').get(game_key=uuid.UUID(game_key))
        except (PongGame.DoesNotExist, ValueError):
            return None

    @sync_to_async
    def update_player_movement(self, user, direction):
        # Lógica de movimiento del jugador
        player_key = "player1" if user == self.game.player1 else "player2" if user == self.game.player2 else None
        if not player_key:
            return

        player_positions = self.game.player_positions or {}
        current_y = player_positions.get(player_key, {}).get("y", self.game.p_y_mid)

        if direction == "UP":
            new_y = max(0, current_y - self.game.player_speed)
        elif direction == "DOWN":
            new_y = min(self.game.board_height - self.game.player_height, current_y + self.game.player_speed)
        else:
            new_y = current_y

        player_positions[player_key] = {
            "x": self.game.x_margin if player_key == "player1" else self.game.p2_xpos,
            "y": new_y
        }
        self.game.player_positions = player_positions
        self.game.save()

    # Los métodos game_update, game_start, player_disconnect y player_reconnect
    # se mantienen para reenviar los mensajes recibidos desde el canal.
    async def game_update(self, event):
        await self.send(text_data=json.dumps(event))

    async def game_start(self, event):
        await self.send(text_data=json.dumps(event))

    async def player_disconnect(self, event):
        await self.send(text_data=json.dumps(event))

    async def player_reconnect(self, event):
        await self.send(text_data=json.dumps(event))
