import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from core.models import ChessGame
from core.utils.event_domain import publish_event
from asgiref.sync import sync_to_async
from .logic import ChessLogic


logger = logging.getLogger('chess_game')
logger.setLevel(logging.DEBUG)


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
		
		self.game_obj, self.color = await get_game_and_role(self.game_key, self.user)
		
		if not self.game_obj:
			await self.close()
			return
		
		await self.channel_layer.group_add(self.group_name, self.channel_name)
		await self.accept()
		
		if self.game_key not in chess_games:
			db_state = await get_current_game_state(self.game_obj)
			chess_logic = ChessLogic(game_mode=self.game_obj.game_mode)
			
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
			
			if db_state['status'] == 'in_progress' or db_state['status'] == 'finished':
				chess_games[self.game_key]["ready"] = {"white": True, "black": True}
		
		game = chess_games[self.game_key]
		
		if self.color not in game["players"]:
			game["players"][self.color] = {
				"username": self.user.username,
				"connected": True
			}
		else:
			game["players"][self.color]["connected"] = True
		
		await self.channel_layer.group_send(
			self.group_name,
			{
				"type": "player.status",
				"color": self.color,
				"username": self.user.username,
				"status": "connected"
			}
		)
		
		if game["board"]:
			serialized_board = serialize_board(game["board"])
			await self.send(text_data=json.dumps({
				"status": "sync_state",
				"board": serialized_board,
				"current_player": game["current_player"],
				"game_status": game["status"]
			}))
			
			if game["status"] == "finished":
				winner = self.game_obj.winner
				winner_color = "white" if winner == self.game_obj.player_white else "black"
				last_move = game["move_history"][-1] if game["move_history"] else None
				await self.send(text_data=json.dumps({
					"status": "game_over",
					"winner": winner_color,
					"reason": "checkmate",
					"lastMovement": {
						"from": last_move["from"],
						"to": last_move["to"]
					} if last_move else None
				}))
			
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
		logger.debug(f"Received WebSocket message: {text_data}")
		try:
			data = json.loads(text_data)
		except json.JSONDecodeError:
			logger.error("Failed to decode JSON")
			return
		
		action = data.get("action")
		game = chess_games.get(self.game_key)
		
		if not game:
			logger.error(f"Game not found for key: {self.game_key}")
			return
		
		logger.debug(f"Action: {action}")
		if action == "ready":
			logger.debug(f"Handling 'ready' action for {self.color}")
			game["ready"][self.color] = True
			await self.channel_layer.group_send(
				self.group_name,
				{
					"type": "player.ready",
					"game_mode": self.game_obj.game_mode,
					"color": self.color,
					"username": self.user.username
				}
			)
			
			if len(game["ready"]) == 2:
				if not game["board"]:
					board = game["game_logic"].initialize_game()
					game["board"] = board
					game["status"] = "in_progress"
					game["current_player"] = "white"
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
					serialized_board = serialize_board(game["board"])
					await self.send(text_data=json.dumps({
						"status": "game_starting",
						"board": serialized_board,
						"current_player": game["current_player"]
					}))
		elif action == "move":
			logger.debug(f"Handling 'move' action for {self.color}")
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
			piece = game["board"].get(from_pos)
			piece_info = piece.to_dict() if piece else None
			
			success, message, updated_board, result = game["game_logic"].make_move(from_pos, to_pos, self.color)
			logger.info(f"Move attempt: {self.color} from {from_pos} to {to_pos} - Result: {success}")
			
			if not success:
				logger.info(f"Move failed: {message}")
			
			if success:
				game["board"] = updated_board
				game["move_history"].append({
					"from": from_pos,
					"to": to_pos,
					"player": self.color,
					"piece": piece_info
				})
				
				# Check for promotion in the result
				promotion_data = None
				if result.get('promotion_pending') == True:
					promotion_data = {
						"square": to_pos,
						"piece_type": None,
						"color": self.color
					}
					game["promotion_pending"] = True
					game["promotion_color"] = self.color
					logger.debug(f"Promotion pending set to true for {self.color}")
				else:
					game["current_player"] = "black" if self.color == "white" else "white"
					await update_game_in_db(self.game_obj, updated_board)
					await save_move_to_db(self.game_obj, from_pos, to_pos, self.color, piece_info)
				
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
					
					# Include promotion data in game over event if available
					game_over_event = {
						"type": "game.over",
						"winner": winner_color,
						"reason": result.get('game_over')
					}
					
					if promotion_data:
						game_over_event["promotion"] = promotion_data
					
					await self.channel_layer.group_send(
						self.group_name,
						game_over_event
					)
				else:
					# Include promotion data in game update event if available
					game_update_event = {
						"type": "game.update",
						"board": serialize_board(updated_board),
						"last_move": {
							"from": from_pos,
							"to": to_pos,
							"player": self.color
						},
						"current_player": game["current_player"]
					}
					
					if promotion_data and promotion_data.get('piece_type') != None:
						game_update_event["promotion"] = promotion_data
					
					await self.channel_layer.group_send(
						self.group_name,
						game_update_event
					)
			else:
				await self.send(text_data=json.dumps({
					"status": "error",
					"message": message
				}))
		elif action == "resign":
			logger.debug(f"Handling 'resign' action for {self.color}")
			winner_color = "black" if self.color == "white" else "white"
			winner_user = await sync_to_async(lambda: self.game_obj.player_white if winner_color == "white" else self.game_obj.player_black)()
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
			logger.debug(f"Handling 'sync_request' action for {self.color}")
			if game["board"]:
				serialized_board = serialize_board(game["board"])
				await self.send(text_data=json.dumps({
					"status": "sync_state",
					"game_mode": self.game_obj.game_mode,
					"board": serialized_board,
					"current_player": game["current_player"],
					"game_status": game["status"],
					"your_color": self.color
				}))
		elif action == "promotion_choice":
			logger.debug(f"Handling 'promotion_choice' action for {self.color}")
			logger.debug(f"Promotion pending: {game.get('promotion_pending')}, Promotion color: {game.get('promotion_color')}")
			if game.get("promotion_pending") and game.get("promotion_color") == self.color:
				promotion_choice = data.get("piece_type")
				logger.debug(f"Promotion choice: {promotion_choice}")
		
				success, message, updated_board, result = game["game_logic"].handle_promotion(promotion_choice)
				logger.debug(f"Promotion result: {success}, {message}, {result}")
		
				if success:
					game["board"] = updated_board
					game["promotion_pending"] = False
					await update_game_in_db(self.game_obj, updated_board)
					logger.debug(f"Updated game in DB with new board state")
		
					if result.get('game_over'):
						winner_color = result.get('winner')
						game["status"] = "finished"
						winner_user = await sync_to_async(lambda: self.game_obj.player_white if winner_color == "white" else self.game_obj.player_black)()
						logger.debug(f"Game over detected, winner: {winner_color}")
		
						await update_game_in_db(
							self.game_obj, 
							updated_board, 
							status="finished", 
							winner=winner_user
						)
						logger.debug(f"Updated game in DB with game over status")
		
						await self.channel_layer.group_send(
							self.group_name,
							{
								"type": "game.over",
								"winner": winner_color,
								"reason": result.get('game_state'),
								"promotion_piece": promotion_choice
							}
						)
						logger.debug(f"Sent game over event to group: {self.group_name}")
					else:
						game["current_player"] = "black" if self.color == "white" else "white"
						await self.channel_layer.group_send(
							self.group_name,
							{
								"type": "game.update",
								"board": serialize_board(updated_board),
								"promotion": {
									"square": game["move_history"][-1]["to"],
									"piece_type": promotion_choice,
									"color": self.color
								},
								"current_player": game["current_player"]
							}
						)
						logger.debug(f"Sent promotion update to group: {self.group_name}")
						logger.debug(f"promotion choice: {promotion_choice}")
				else:
					await self.send(text_data=json.dumps({
						"status": "error",
						"message": message
					}))
					logger.debug(f"Promotion failed: {message}")
			else:
				await self.send(text_data=json.dumps({
					"status": "error",
					"message": "Not your turn"
				}))
				logger.debug(f"Promotion choice error: Not your turn")

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
		update_data = {
			"status": "game_update",
			"board": event["board"],
			"current_player": event["current_player"]
		}
		
		if "last_move" in event:
			update_data["last_move"] = event["last_move"]
			
		if "promotion" in event:
			update_data["promotion"] = event["promotion"]
			
		await self.send(text_data=json.dumps(update_data))

	async def game_over(self, event):
		game_over_data = {
			"status": "game_over",
			"winner": event["winner"],
			"reason": event["reason"]
		}
		
		if "promotion_square" in event and "promotion_piece" in event:
			game_over_data["promotion"] = {
				"square": event["promotion_square"],
				"piece_type": event["promotion_piece"],
				"color": event["winner"]
			}
		
		await self.send(text_data=json.dumps(game_over_data))
