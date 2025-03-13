import json
import asyncio
import random
import math
import uuid
import traceback

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async
from core.models import PongGame
from core.utils.event_domain import publish_event

games = {}
game_tasks = {}

@sync_to_async
def async_publish_event(source, event_name, payload):
    try:
        publish_event(source, event_name, payload)
    except Exception as e:
        print(traceback.format_exc())
        raise

@database_sync_to_async
def get_game_and_role(game_key, user):
    try:
        game_obj = PongGame.objects.get(game_key=game_key)
        if game_obj.player1 == user:
            return game_obj, "player1"
        elif game_obj.player2 == user:
            return game_obj, "player2"
        else:
            return None, None
    except Exception as e:
        print(traceback.format_exc())
        raise

@database_sync_to_async
def update_score_in_db(game_obj, player, new_score):
    try:
        if player == "player1":
            game_obj.score_player1 = new_score
        elif player == "player2":
            game_obj.score_player2 = new_score
        game_obj.save()
    except Exception as e:
        print(traceback.format_exc())
        raise

@database_sync_to_async
def finish_game_in_db(game_obj, winner):
    try:
        game_obj.winner = winner
        game_obj.status = "finished"
        game_obj.save()
        return {
            "game_id": str(game_obj.id),
            "winner": winner.username,
            "loser": game_obj.player1.username if winner == game_obj.player2 else game_obj.player2.username
        }
    except Exception as e:
        print(traceback.format_exc())
        raise

@database_sync_to_async
def get_game_status(game_key):
    try:
        game = PongGame.objects.get(game_key=game_key)
        return game.status
    except Exception as e:
        print(traceback.format_exc())
        raise

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.game_key = self.scope["url_route"]["kwargs"]["game_key"]
            self.group_name = f"game_{self.game_key}"
            self.user = self.scope["user"]

            if not self.user.is_authenticated:
                await self.close()
                return

            self.game_obj, role = await get_game_and_role(self.game_key, self.user)
            if not self.game_obj:
                await self.close()
                return

            self.player = role

            game_status = await get_game_status(self.game_key)
            if game_status == "finished":
                await self.accept()
                await self.send(text_data=json.dumps({
                    "status": "game_over",
                    "message": "This game has already finished."
                }))
                await asyncio.sleep(1)
                await self.close()
                return

            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()

            if self.game_key not in games:
                games[self.game_key] = {
                    "players": {},
                    "ready": {},
                    "ball": {
                        "x": self.game_obj.board_width / 2,
                        "y": self.game_obj.board_height / 2,
                        "xVel": random.choice([-self.game_obj.start_speed, self.game_obj.start_speed]),
                        "yVel": 0,
                        "serve": True
                    },
                    "last_updated": asyncio.get_event_loop().time(),
                    "active_connections": 0
                }

            game = games[self.game_key]
            game["active_connections"] += 1

            if self.player in game["players"]:
                game["players"][self.player]["connected"] = True
                await self.send(text_data=json.dumps({
                    "status": "reconnected",
                    "state": {
                        "players": game["players"],
                        "ball": {"x": game["ball"]["x"], "y": game["ball"]["y"]}
                    }
                }))
            else:
                if self.player == "player1":
                    game["players"]["player1"] = {
                        "username": self.user.username,
                        "x": 20,
                        "y": (self.game_obj.board_height - self.game_obj.player_height) / 2,
                        "score": self.game_obj.score_player1,
                        "direction": None,
                        "connected": True
                    }
                else:
                    game["players"]["player2"] = {
                        "username": self.user.username,
                        "x": self.game_obj.board_width - 20 - 12,
                        "y": (self.game_obj.board_height - self.game_obj.player_height) / 2,
                        "score": self.game_obj.score_player2,
                        "direction": None,
                        "connected": True
                    }

            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "game.message",
                    "message": json.dumps({
                        "status": "player_connected",
                        "player": self.player,
                        "username": self.user.username
                    })
                }
            )

            if self.game_key not in game_tasks and len(game["ready"]) == 2:
                game_tasks[self.game_key] = asyncio.create_task(self.game_loop())
        except Exception as e:
            await self.close()

    async def game_loop(self):
        try:
            game = games[self.game_key]
            ball = game["ball"]
            board_width = self.game_obj.board_width
            board_height = self.game_obj.board_height
            ball_side = self.game_obj.ball_side
            paddle_height = self.game_obj.player_height
            player_speed = self.game_obj.player_speed
            start_speed = self.game_obj.start_speed
            speed_up_multiple = self.game_obj.speed_up_multiple
            max_speed = self.game_obj.max_speed
            paddle_width = 12
            serve_speed_multiple = 0.3

            while True:
                if self.game_key not in games:
                    break

                # Update ball position differently if in serve mode
                if ball.get("serve", False):
                    ball["x"] += ball["xVel"] * serve_speed_multiple
                    ball["y"] += ball["yVel"] * serve_speed_multiple
                else:
                    ball["x"] += ball["xVel"]
                    ball["y"] += ball["yVel"]

                # Check collision with player1's paddle
                p1 = game["players"].get("player1")
                if p1:
                    if (ball["x"] <= p1["x"] + paddle_width and
                        ball["x"] + ball_side >= p1["x"] and
                        ball["y"] + ball_side >= p1["y"] and
                        ball["y"] <= p1["y"] + paddle_height):

                        # Calculate collision point and clamp it
                        collision_point = (ball["y"] + ball_side/2) - (p1["y"] + paddle_height/2)
                        if collision_point > paddle_height/2:
                            collision_point = paddle_height/2
                        elif collision_point < -paddle_height/2:
                            collision_point = -paddle_height/2
                        normalized = collision_point / (paddle_height/2)
                        rebound_angle = normalized * (math.pi/4)

                        # Increase speed up to max_speed
                        speed = ball.get("speed", math.hypot(ball["xVel"], ball["yVel"]))
                        if speed < max_speed:
                            speed *= speed_up_multiple
                        ball["speed"] = speed

                        # Ensure ball goes right (positive x) after collision with player1's paddle
                        ball["xVel"] = abs(speed * math.cos(rebound_angle))
                        ball["yVel"] = speed * math.sin(rebound_angle)
                        ball["serve"] = False

                # Check collision with player2's paddle
                p2 = game["players"].get("player2")
                if p2:
                    if (ball["x"] + ball_side >= p2["x"] and
                        ball["x"] <= p2["x"] + paddle_width and
                        ball["y"] + ball_side >= p2["y"] and
                        ball["y"] <= p2["y"] + paddle_height):

                        collision_point = (ball["y"] + ball_side/2) - (p2["y"] + paddle_height/2)
                        if collision_point > paddle_height/2:
                            collision_point = paddle_height/2
                        elif collision_point < -paddle_height/2:
                            collision_point = -paddle_height/2
                        normalized = collision_point / (paddle_height/2)
                        rebound_angle = normalized * (math.pi/4)

                        speed = ball.get("speed", math.hypot(ball["xVel"], ball["yVel"]))
                        if speed < max_speed:
                            speed *= speed_up_multiple
                        ball["speed"] = speed

                        # Ensure ball goes left (negative x) after collision with player2's paddle
                        ball["xVel"] = -abs(speed * math.cos(rebound_angle))
                        ball["yVel"] = speed * math.sin(rebound_angle)
                        ball["serve"] = False

                # Bounce off top/bottom boundaries, AFTER paddle hit to avoid ball getting clamped between paddle & top/bottom wall BUGG
                if ball["y"] <= 0 or ball["y"] >= board_height - ball_side:
                    ball["yVel"] *= -1

                # Update players' positions
                for player_role, player in game["players"].items():
                    if player.get("connected", False):
                        direction = player.get("direction")
                        if direction == "UP":
                            player["y"] = max(0, player["y"] - player_speed)
                        elif direction == "DOWN":
                            player["y"] = min(board_height - paddle_height, player["y"] + player_speed)

                # Scoring and ball reset logic:
                # When the ball goes off left, right player scores and left player (conceding) serves.
                if ball["x"] < 0:
                    if "player2" in game["players"]:
                        new_score = game["players"]["player2"]["score"] + 1
                        game["players"]["player2"]["score"] = new_score
                        # Reset ball using a random serve angle
                        start_rad_angle = random.uniform(-math.pi/4, math.pi/4)
                        ball.update({
                            "x": board_width / 2 - ball_side/2,
                            "y": board_height / 2 - ball_side/2,
                            "xVel": start_speed * math.cos(start_rad_angle) * -1,  # negative xVel (ball served to right)
                            "yVel": start_speed * math.sin(start_rad_angle),
                            "speed": start_speed,
                            "serve": True
                        })

                        if new_score >= self.game_obj.points_to_win:
                            await self.channel_layer.group_send(
                                self.group_name,
                                {
                                    "type": "game.message",
                                    "message": json.dumps({
                                        "status": "game_update",
                                        "state": {
                                            "players": game["players"],
                                            "ball": {"x": board_width / 2, "y": board_height / 2}
                                        }
                                    })
                                }
                            )
                            player2 = await database_sync_to_async(lambda: self.game_obj.player2)()
                            event_data = await finish_game_in_db(self.game_obj, player2)
                            try:
                                await async_publish_event("pong", "pong.match_finished", event_data)
                            except Exception as e:
                                print(traceback.format_exc())
                            await self.channel_layer.group_send(
                                self.group_name,
                                {
                                    "type": "game.message",
                                    "message": json.dumps({
                                        "status": "game_over",
                                        "winner": game["players"]["player2"]["username"]
                                    })
                                }
                            )
                            break

                # When the ball goes off right, left player scores and right player (conceding) serves.
                elif ball["x"] > board_width - ball_side:
                    if "player1" in game["players"]:
                        new_score = game["players"]["player1"]["score"] + 1
                        game["players"]["player1"]["score"] = new_score
                        start_rad_angle = random.uniform(-math.pi/4, math.pi/4)
                        ball.update({
                            "x": board_width / 2 - ball_side/2,
                            "y": board_height / 2 - ball_side/2,
                            "xVel": start_speed * math.cos(start_rad_angle) * 1,  # positive xVel (ball served to right)
                            "yVel": start_speed * math.sin(start_rad_angle),
                            "speed": start_speed,
                            "serve": True
                        })

                        if new_score >= self.game_obj.points_to_win:
                            await self.channel_layer.group_send(
                                self.group_name,
                                {
                                    "type": "game.message",
                                    "message": json.dumps({
                                        "status": "last_status",
                                        "state": {
                                            "players": game["players"],
                                            "ball": {"x": board_width / 2, "y": board_height / 2}
                                        }
                                    })
                                }
                            )
                            player1 = await database_sync_to_async(lambda: self.game_obj.player1)()
                            event_data = await finish_game_in_db(self.game_obj, player1)
                            try:
                                await async_publish_event("pong", "pong.match_finished", event_data)
                            except Exception as e:
                                print(traceback.format_exc())
                            await self.channel_layer.group_send(
                                self.group_name,
                                {
                                    "type": "game.message",
                                    "message": json.dumps({
                                        "status": "game_over",
                                        "winner": game["players"]["player1"]["username"]
                                    })
                                }
                            )
                            break

                # Send the updated game state to all connected clients
                if game["active_connections"] > 0:
                    state = {
                        "players": game["players"],
                        "ball": {"x": ball["x"], "y": ball["y"]}
                    }
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "game.message",
                            "message": json.dumps({"status": "game_update", "state": state})
                        }
                    )
                game["last_updated"] = asyncio.get_event_loop().time()
                await asyncio.sleep(0.03)
        except Exception as e:
            print(traceback.format_exc())

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get("action")
            if self.game_key not in games:
                return
            game = games[self.game_key]
            if action == "ready":
                game["ready"][self.player] = True
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "game.message",
                        "message": json.dumps({
                            "status": "player_ready",
                            "player": self.player,
                            "username": self.user.username
                        })
                    }
                )
                if len(game["ready"]) == 2:
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "game.message",
                            "message": json.dumps({"status": "game_starting"})
                        }
                    )
                    if self.game_key not in game_tasks or game_tasks[self.game_key].done():
                        game_tasks[self.game_key] = asyncio.create_task(self.game_loop())
            elif action == "move":
                direction = data.get("direction")
                if self.player in game["players"] and game["players"][self.player]["connected"]:
                    game["players"][self.player]["direction"] = direction
        except Exception as e:
            print(traceback.format_exc())

    async def disconnect(self, close_code):
        try:
            game = games.get(self.game_key)
            if not game:
                return
            game["active_connections"] -= 1
            if hasattr(self, "player") and self.player in game.get("players", {}):
                game["players"][self.player]["connected"] = False
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "game.message",
                        "message": json.dumps({
                            "status": "player_disconnected",
                            "player": self.player
                        })
                    }
                )
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            if game["active_connections"] <= 0 and self.game_key in game_tasks and game_tasks[self.game_key].done():
                if self.game_key in games:
                    del games[self.game_key]
                if self.game_key in game_tasks:
                    del game_tasks[self.game_key]
        except Exception as e:
            print(traceback.format_exc())

    async def game_message(self, event):
        try:
            message = event["message"]
            await self.send(text_data=message)
        except Exception as e:
            print(traceback.format_exc())