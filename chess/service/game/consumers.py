import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from core.models import ChessGame
from core.utils.event_domain import publish_event
from .logic import ChessLogic

chess_games = {}

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
def update_game_in_db(game_obj, board_state, status=None, winner=None):
    game_obj.add_board_state(board_state)
    
    if status:
        game_obj.status = status
    
    if winner:
        game_obj.winner = winner
        publish_event("chess.match_finished", {
            "game_id": str(game_obj.id),
            "winner": winner.username,
            "loser": game_obj.player_white.username if winner == game_obj.player_black else game_obj.player_black.username
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
			chess_games[self.game_key] = {
				"players": {},
				"ready": {},
				"game_logic": ChessLogic(game_mode=self.game_obj.game_mode),
				"board": None
			}
		
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
	
	async def receive(self, text_data):
		data = json.loads(text_data)
		action = data.get("action")
		game = chess_games.get(self.game_key)
		
		if not game:
			return
		
		if action == "ready":
			game["ready"][self.color] = True
			
			await self.channel_layer.group_send(
				self.group_name,
				{
					"type": "player.ready",
					"color": self.color,
					"username": self.user.username
				}
			)
			
			if len(game["ready"]) == 2:
				board = game["game_logic"].initialize_game()
				game["board"] = board
				
				await update_game_in_db(self.game_obj, board)
				
				await self.channel_layer.group_send(
					self.group_name,
					{
						"type": "game.start",
						"board": board,
						"current_player": "white"
					}
				)
				
				self.game_obj.status = "in_progress"
				self.game_obj.save()
		elif action == "move":
			if not game["board"]:
				return
			
			from_pos = data.get("from")
			to_pos = data.get("to")
			
			success, message, updated_board = game["game_logic"].make_move(from_pos, to_pos, self.color)
			
			if success:
				game["board"] = updated_board
				
				await update_game_in_db(self.game_obj, updated_board)
				
				game_over = game["game_logic"].game_mode.check_game_over(
					updated_board, 
					"black" if self.color == "white" else "white"
				)
				
				if game_over:
					status, winner_color = game_over
					winner_user = self.game_obj.player_white if winner_color == "white" else self.game_obj.player_black
					
					await update_game_in_db(
						self.game_obj, 
						updated_board, 
						status="finished", 
						winner=winner_user
					)
					
					await self.channel_layer.group_send(
						self.group_name,
						{
							"type": "game.over",
							"winner": winner_color,
							"reason": status
						}
					)
				else:
					await self.channel_layer.group_send(
						self.group_name,
						{
							"type": "game.update",
							"board": updated_board,
							"last_move": {
								"from": from_pos,
								"to": to_pos,
								"player": self.color
							},
							"current_player": "black" if self.color == "white" else "white"
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
