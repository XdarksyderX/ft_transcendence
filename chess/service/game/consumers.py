import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from core.models import ChessGame
from core.utils.event_domain import publish_event
from asgiref.sync import sync_to_async
from .logic import ChessLogic

# Configuración de logger
logger = logging.getLogger('chess_game')
logger.setLevel(logging.INFO)

# Almacén en memoria para los juegos activos
chess_games = {}

def serialize_board(board):
    serialized_board = {}
    for position, piece in board.items():
        if piece is not None:
            serialized_board[position] = piece.to_dict()
        else:
            serialized_board[position] = None
    return serialized_board

@database_sync_to_async
def get_game_and_role(game_key, user):
    try:
        game_obj = ChessGame.objects.get(game_key=game_key)
    except ChessGame.DoesNotExist:
        return None, None
    
    if game_obj.player_white == user:
        return game_obj, "white"
    elif game_obj.player_black == user:
        return game_obj, "black"
    else:
        return None, None

@database_sync_to_async
def get_current_game_state(game_obj):
    """Recuperar el estado actual del juego desde la base de datos"""
    return {
        'board_state': game_obj.get_last_board_state(),
        'status': game_obj.status,
        'winner': game_obj.winner.username if game_obj.winner else None,
        'current_player': game_obj.get_current_player(),
        'history': game_obj.get_move_history()
    }

@database_sync_to_async
def update_game_in_db(game_obj, board_state, status=None, winner=None):
    game_obj.add_board_state(serialize_board(board_state))
    
    if status:
        game_obj.status = status
    
    if winner:
        game_obj.winner = winner
        publish_event("chess", "chess.match_finished", {
            "game_id": str(game_obj.id),
            "winner": winner.username,
            "loser": game_obj.player_white.username if winner == game_obj.player_black else game_obj.player_black.username
        })
    
    game_obj.save()

@database_sync_to_async
def save_move_to_db(game_obj, from_pos, to_pos, player_color, piece_info=None):
    game_obj.add_move({
        'from': from_pos,
        'to': to_pos,
        'player': player_color,
        'piece_info': piece_info
    })
    game_obj.save()

class ChessConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_key = self.scope["url_route"]["kwargs"]["game_key"]
        self.group_name = f"chess_{self.game_key}"
        self.user = self.scope["user"]
        
        if not self.user.is_authenticated:
            await self.close()
            return
        
        # Obtener el objeto del juego y el rol del jugador
        self.game_obj, self.color = await get_game_and_role(self.game_key, self.user)
        if not self.game_obj:
            await self.close()
            return
        
        # Unirse al grupo de canal
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        
        # Inicializar o recuperar el juego en la caché en memoria
        if self.game_key not in chess_games:
            # Si no existe en memoria, intentar recuperar desde la BD
            db_state = await get_current_game_state(self.game_obj)
            
            # Inicializar el juego con el estado de la BD
            chess_logic = ChessLogic(game_mode=self.game_obj.game_mode)
            
            # Si hay un estado de tablero guardado, cargarlo
            if db_state['board_state']:
                chess_logic.load_board_from_serialized(db_state['board_state'])
                board = chess_logic.get_board()
            else:
                board = None
            
            chess_games[self.game_key] = {
                "players": {},
                "ready": {},
                "game_logic": chess_logic,
                "board": board,
                "status": db_state['status'],
                "current_player": db_state['current_player'] or "white",
                "move_history": db_state['history'] or []
            }
            
            # Si el juego ya estaba en progreso, marcar ambos jugadores como listos
            if db_state['status'] == 'in_progress' or db_state['status'] == 'finished':
                chess_games[self.game_key]["ready"] = {"white": True, "black": True}
        
        game = chess_games[self.game_key]
        
        # Actualizar el estado de conexión del jugador
        if self.color not in game["players"]:
            game["players"][self.color] = {
                "username": self.user.username,
                "connected": True
            }
        else:
            game["players"][self.color]["connected"] = True
        
        # Notificar a otros jugadores
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "player.status",
                "color": self.color,
                "username": self.user.username,
                "status": "connected"
            }
        )
        
        # Sincronizar el estado del juego para el jugador que se reconecta
        # Enviar el estado actual del tablero al jugador reconectado
        if game["board"]:
            serialized_board = serialize_board(game["board"])
            await self.send(text_data=json.dumps({
                "status": "sync_state",
                "board": serialized_board,
                "current_player": game["current_player"],
                "game_status": game["status"]
            }))
            
            # Si el juego está terminado, enviar también el resultado
            if game["status"] == "finished":
                winner = self.game_obj.winner
                winner_color = "white" if winner == self.game_obj.player_white else "black"
                await self.send(text_data=json.dumps({
                    "status": "game_over",
                    "winner": winner_color,
                    "reason": "checkmate"  # Esto podría refinarse si guardas la razón específica
                }))
            
            # Enviar el estado "ready" para ambos jugadores si corresponde
            if self.color in game["ready"] and game["ready"][self.color]:
                await self.send(text_data=json.dumps({
                    "status": "player_ready",
                    "color": self.color,
                    "username": self.user.username
                }))
                
                opponent_color = "black" if self.color == "white" else "white"
                if opponent_color in game["ready"] and game["ready"][opponent_color]:
                    opponent_username = game["players"][opponent_color]["username"] if opponent_color in game["players"] else "Opponent"
                    await self.send(text_data=json.dumps({
                        "status": "player_ready",
                        "color": opponent_color,
                        "username": opponent_username
                    }))
        
        # Log de la conexión
        logger.info(f"Player {self.user.username} ({self.color}) connected to game {self.game_key}")

    async def disconnect(self, close_code):
        game = chess_games.get(self.game_key)
        if game and self.color in game["players"]:
            game["players"][self.color]["connected"] = False
            
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "player.status",
                    "color": self.color,
                    "username": self.user.username,
                    "status": "disconnected"
                }
            )
        
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"Player {self.user.username} ({self.color}) disconnected from game {self.game_key}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")
        game = chess_games.get(self.game_key)
        
        if not game:
            # Si no hay juego en memoria pero existe en la BD, recuperarlo
            if hasattr(self, 'game_obj') and self.game_obj:
                await self.connect()  # Reconectar para recuperar estado
                game = chess_games.get(self.game_key)
                if not game:
                    return
            else:
                return
        
        if action == "ready":
            game["ready"][self.color] = True
            logger.info(f"Player {self.user.username} ({self.color}) is ready")
            
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "player.ready",
                    "color": self.color,
                    "username": self.user.username
                }
            )
            
            if len(game["ready"]) == 2:
                # Iniciar juego solo si no hay un tablero (para evitar reiniciar en reconexiones)
                if not game["board"]:
                    board = game["game_logic"].initialize_game()
                    game["board"] = board
                    game["status"] = "in_progress"
                    game["current_player"] = "white"
                    
                    # Guardar en BD
                    await update_game_in_db(self.game_obj, board, status="in_progress")
                    
                    serialized_board = serialize_board(board)
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "game.start",
                            "board": serialized_board,
                            "current_player": "white"
                        }
                    )
                    logger.info(f"Game {self.game_key} started")
                else:
                    # Si el juego ya había comenzado, enviar el estado actual al jugador
                    serialized_board = serialize_board(game["board"])
                    await self.send(text_data=json.dumps({
                        "status": "game_starting",
                        "board": serialized_board,
                        "current_player": game["current_player"]
                    }))
        
        elif action == "move":
            # Verificar si es el turno del jugador
            if game["current_player"] != self.color:
                await self.send(text_data=json.dumps({
                    "status": "error",
                    "message": "Not your turn"
                }))
                return
                
            if not game["board"]:
                return
            
            from_pos = data.get("from")
            to_pos = data.get("to")
            
            # Obtener pieza para log
            piece = game["board"].get(from_pos)
            piece_info = piece.to_dict() if piece else None
            
            success, message, updated_board, result = game["game_logic"].make_move(from_pos, to_pos, self.color)
            
            # Log del resultado del movimiento
            logger.info(f"Move attempt: {self.color} from {from_pos} to {to_pos} - Result: {success}")
            if not success:
                logger.info(f"Move failed: {message}")
            
            if success:
                # Actualizar el estado del juego en memoria
                game["board"] = updated_board
                game["current_player"] = "black" if self.color == "white" else "white"
                
                # Guardar el movimiento y el estado en la BD
                await update_game_in_db(self.game_obj, updated_board)
                await save_move_to_db(self.game_obj, from_pos, to_pos, self.color, piece_info)
                
                # Registrar el movimiento en el historial en memoria
                game["move_history"].append({
                    "from": from_pos,
                    "to": to_pos,
                    "player": self.color,
                    "piece": piece_info
                })
                
                if result.get('game_over'):
                    winner_color = result.get('winner')
                    game["status"] = "finished"
                    
                    winner_user = await sync_to_async(lambda: self.game_obj.player_white if winner_color == "white" else self.game_obj.player_black)()
                    
                    await update_game_in_db(
                        self.game_obj, 
                        updated_board, 
                        status="finished", 
                        winner=winner_user
                    )
                    
                    logger.info(f"Game over: {result.get('game_over')} - Winner: {winner_color}")
                    
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "game.over",
                            "winner": winner_color,
                            "reason": result.get('game_over')
                        }
                    )
                else:
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "game.update",
                            "board": serialize_board(updated_board),
                            "last_move": {
                                "from": from_pos,
                                "to": to_pos,
                                "player": self.color
                            },
                            "current_player": game["current_player"]
                        }
                    )
            else:
                await self.send(text_data=json.dumps({
                    "status": "error",
                    "message": message
                }))
        
        elif action == "resign":
            winner_color = "black" if self.color == "white" else "white"
            winner_user = self.game_obj.player_white if winner_color == "white" else self.game_obj.player_black
            
            game["status"] = "finished"
            
            logger.info(f"Player {self.user.username} ({self.color}) resigned. Winner: {winner_color}")
            
            await update_game_in_db(
                self.game_obj, 
                game["board"], 
                status="finished", 
                winner=winner_user
            )
            
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "game.over",
                    "winner": winner_color,
                    "reason": "resignation"
                }
            )
        
        elif action == "sync_request":
            if game["board"]:
                serialized_board = serialize_board(game["board"])
                await self.send(text_data=json.dumps({
                    "status": "sync_state",
                    "board": serialized_board,
                    "current_player": game["current_player"],
                    "game_status": game["status"],
                    "your_color": self.color
                }))

    async def player_status(self, event):
        await self.send(text_data=json.dumps({
            "status": "player_status",
            "color": event["color"],
            "username": event["username"],
            "connection_status": event["status"]
        }))

    async def player_ready(self, event):
        await self.send(text_data=json.dumps({
            "status": "player_ready",
            "color": event["color"],
            "username": event["username"]
        }))

    async def game_start(self, event):
        await self.send(text_data=json.dumps({
            "status": "game_starting",
            "board": event["board"],
            "current_player": event["current_player"]
        }))

    async def game_update(self, event):
        await self.send(text_data=json.dumps({
            "status": "game_update",
            "board": event["board"],
            "last_move": event["last_move"],
            "current_player": event["current_player"]
        }))

    async def game_over(self, event):
        await self.send(text_data=json.dumps({
            "status": "game_over",
            "winner": event["winner"],
            "reason": event["reason"]
        }))
