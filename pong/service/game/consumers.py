import json
import asyncio
import random
import math
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from core.models import PongGame
from core.utils.event_domain import publish_event

# In-memory dictionary to store game states
games = {}

@database_sync_to_async
def get_game_and_role(game_key, user):
    """
    Retrieves the PongGame object and determines the user's role.
    Returns (game_obj, role) where role is "player1" or "player2".
    If the user is not part of the game or doesn't exist, returns (None, None).
    """
    try:
        game_obj = PongGame.objects.get(game_key=game_key)
    except PongGame.DoesNotExist:
        return None, None

    if game_obj.player1 == user:
        return game_obj, "player1"
    elif game_obj.player2 == user:
        return game_obj, "player2"
    else:
        return None, None

@database_sync_to_async
def update_score_in_db(game_obj, player, new_score):
    """
    Updates the score in the database for the specified player.
    """
    if player == "player1":
        game_obj.score_player1 = new_score
    elif player == "player2":
        game_obj.score_player2 = new_score
    game_obj.save()

@database_sync_to_async
def finish_game_in_db(game_obj, winner):
    """
    Marks the game as finished and sets the winner in the database.
    """
    game_obj = PongGame.objects.get(pk=game_obj.pk) # Reload the game object to get a fresh copy, trying to fix game not ending properly in db, NOT WORKING
    game_obj.winner = winner
    game_obj.status = 'finished'
    game_obj.available = False  # Mark the game as no longer available/in progress to fix error hopefully
    publish_event("pong.match_finished", {
        "game_id": str(game_obj.id),
        "winner": winner.username,
        "loser": game_obj.player1.username if winner == game_obj.player2 else game_obj.player2.username
    })

    game_obj.save()

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.game_key = self.scope["url_route"]["kwargs"]["game_key"]
        self.group_name = f"game_{self.game_key}"
        self.user = self.scope["user"]

        # Check if the user is authenticated
        if not self.user.is_authenticated:
            await self.close()
            return

        self.game_obj, role = await get_game_and_role(self.game_key, self.user)
        if not self.game_obj:
            await self.close()
            return

        self.player = role

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Initialize in-memory game state if it doesn't exist yet
        if self.game_key not in games:
            games[self.game_key] = {
                "players": {},
                "ready": {},
                "ball": {
                    "x": self.game_obj.board_width / 2,
                    "y": self.game_obj.board_height / 2,
                    "xVel": random.choice([-self.game_obj.start_speed, self.game_obj.start_speed]),
                    "yVel": 0,
                    "serve": True,
                },
            }
        game = games[self.game_key]
        if self.player in game["players"]:
            # Mark the player as connected and reset direction upon reconnection
            game["players"][self.player]["connected"] = True
            game["players"][self.player]["direction"] = None
        else:
            if self.player == "player1":
                game["players"]["player1"] = {
                    "username": self.user.username,
                    "x": 20,
                    "y": (self.game_obj.board_height - self.game_obj.player_height) / 2,
                    "score": self.game_obj.score_player1,
                    "direction": None,
                    "connected": True,
                }
            else:  # player2
                game["players"]["player2"] = {
                    "username": self.user.username,
                    "x": self.game_obj.board_width - 20 - 12,
                    "y": (self.game_obj.board_height - self.game_obj.player_height) / 2,
                    "score": self.game_obj.score_player2,
                    "direction": None,
                    "connected": True,
                }

    async def disconnect(self, close_code):
        game = games.get(self.game_key)
        if game and self.player in game["players"]:
            # Instead of removing the player, mark them as disconnected
            game["players"][self.player]["connected"] = False
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")
        game = games[self.game_key]

        if action == "ready":
            game["ready"][self.player] = True
            if len(game["ready"]) == 2:
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "game.message",
                        "message": json.dumps({"status": "game_starting"}),
                    },
                )
                if "task" not in game:
                    game["task"] = asyncio.create_task(self.game_loop())
        elif action == "move":
            direction = data.get("direction")
            if self.player in game["players"]:
                game["players"][self.player]["direction"] = direction

    async def game_loop(self):
        game = games[self.game_key]
        ball = game["ball"]

        board_width   = self.game_obj.board_width
        board_height  = self.game_obj.board_height
        ball_side     = self.game_obj.ball_side
        paddle_height = self.game_obj.player_height
        player_speed  = self.game_obj.player_speed
        start_speed   = self.game_obj.start_speed
        paddle_width  = ball_side * 1.2

        while True:
            # Update ball position
            ball["x"] += ball["xVel"]
            ball["y"] += ball["yVel"]

            # Bounce off top and bottom edges
            if ball["y"] <= 0 or ball["y"] >= board_height - ball_side:
                ball["yVel"] *= -1

            # Collision with player1's paddle (left)
            p1 = game["players"].get("player1")
            if p1:
                if (ball["x"] <= p1["x"] + paddle_width and 
                    ball["x"] + ball_side >= p1["x"] and 
                    ball["y"] + ball_side >= p1["y"] and 
                    ball["y"] <= p1["y"] + paddle_height):
                    
                    collision_point = (ball["y"] + ball_side / 2) - (p1["y"] + paddle_height / 2)
                    normalized = collision_point / (paddle_height / 2)
                    rebound_angle = normalized * (math.pi / 4)
                    speed = math.hypot(ball["xVel"], ball["yVel"])
                    ball["xVel"] = abs(speed * math.cos(rebound_angle))
                    ball["yVel"] = speed * math.sin(rebound_angle)

            # Collision with player2's paddle (right)
            p2 = game["players"].get("player2")
            if p2:
                if (ball["x"] + ball_side >= p2["x"] and 
                    ball["x"] <= p2["x"] + paddle_width and 
                    ball["y"] + ball_side >= p2["y"] and 
                    ball["y"] <= p2["y"] + paddle_height):
                    
                    collision_point = (ball["y"] + ball_side / 2) - (p2["y"] + paddle_height / 2)
                    normalized = collision_point / (paddle_height / 2)
                    rebound_angle = normalized * (math.pi / 4)
                    speed = math.hypot(ball["xVel"], ball["yVel"])
                    ball["xVel"] = -abs(speed * math.cos(rebound_angle))
                    ball["yVel"] = speed * math.sin(rebound_angle)

            # Move players based on received direction
            for player in game["players"].values():
                direction = player.get("direction")
                if direction == "UP":
                    player["y"] = max(0, player["y"] - player_speed)
                elif direction == "DOWN":
                    player["y"] = min(board_height - paddle_height, player["y"] + player_speed)

            # Detect scoring and reset the ball position
            if ball["x"] < 0:
                new_score = game["players"]["player2"]["score"] + 1
                game["players"]["player2"]["score"] = new_score
                await update_score_in_db(self.game_obj, "player2", new_score)
                ball.update({
                    "x": board_width / 2,
                    "y": board_height / 2,
                    "xVel": abs(start_speed),
                    "yVel": 0,
                    "serve": True
                })
                # Check if the score limit has been reached to end the game
                if new_score >= self.game_obj.points_to_win:
                    await finish_game_in_db(self.game_obj, self.game_obj.player2)
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "game.message",
                            "message": json.dumps({
                                "status": "game_over",
                                "winner": game["players"]["player2"]["username"]
                            }),
                        },
                    )
                    break

            elif ball["x"] > board_width - ball_side:
                new_score = game["players"]["player1"]["score"] + 1
                game["players"]["player1"]["score"] = new_score
                await update_score_in_db(self.game_obj, "player1", new_score)
                ball.update({
                    "x": board_width / 2,
                    "y": board_height / 2,
                    "xVel": -abs(start_speed),
                    "yVel": 0,
                    "serve": True
                })
                # Check if the score limit has been reached to end the game
                if new_score >= self.game_obj.points_to_win:
                    await finish_game_in_db(self.game_obj, self.game_obj.player1)
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "game.message",
                            "message": json.dumps({
                                "status": "game_over",
                                "winner": game["players"]["player1"]["username"]
                            }),
                        },
                    )
                    break

            # Send the updated state to all players
            state = {
                "players": game["players"],
                "ball": {"x": ball["x"], "y": ball["y"]},
            }
            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "game.message",
                    "message": json.dumps({"status": "game_update", "state": state}),
                },
            )
            await asyncio.sleep(0.03)

    async def game_message(self, event):
        message = event["message"]
        await self.send(text_data=message)
