import math
import random
from core.models import PongGame  # Import the database model

class Game:
    def __init__(self, game_instance: PongGame):
        """Initialize the game using an existing PongGame instance."""
        self.game = game_instance
        self.board_width = 700
        self.board_height = 500
        self.player_height = 50
        self.player_speed = 5
        self.ball_side = 10
        self.start_speed = 7.5
        self.speed_up_multiple = 1.02
        self.points_to_win = 3

        # Load player positions from the database or set defaults
        self.players = self.game.player_positions or {
            "player1": {"y": self.board_height / 2 - self.player_height / 2, "score": 0},
            "player2": {"y": self.board_height / 2 - self.player_height / 2, "score": 0}
        }

        # Load ball position or reset if missing
        self.ball = self.game.ball_position or self._reset_ball()
        self.winner = None

    def _reset_ball(self):
        """Reset the ball to the center of the board with a random initial velocity."""
        angle = math.radians(random.uniform(-30, 30))  # Randomized initial angle
        direction = random.choice([-1, 1])  # Randomly left (-1) or right (1)
        return {
            "x": self.board_width / 2 - self.ball_side / 2,
            "y": self.board_height / 2 - self.ball_side / 2,
            "x_vel": self.start_speed * math.cos(angle) * direction,
            "y_vel": self.start_speed * math.sin(angle),
            "speed": self.start_speed
        }

    def update_player_movement(self, player, direction):
        """Updates player movement & persists it in the database."""
        if player not in self.players:
            return

        current_y = self.players[player]["y"]

        if direction == "UP":
            new_y = max(0, current_y - self.player_speed)
        elif direction == "DOWN":
            new_y = min(self.board_height - self.player_height, current_y + self.player_speed)
        else:  # STOP case
            new_y = current_y

        # Persist movement update to the database
        self.game.update_position(player, {"y": new_y})
        self.game.save()

    def update_ball_position(self):
        """Updates the ball's position, handles collisions, and persists it."""
        ball = self.ball
        ball["x"] += ball["x_vel"]
        ball["y"] += ball["y_vel"]

        # Ball collision with top/bottom walls
        if ball["y"] <= 0 or ball["y"] + self.ball_side >= self.board_height:
            ball["y_vel"] *= -1  # Reverse Y direction

        # Ball collision with paddles
        if self._check_paddle_collision("player1"):
            ball["x_vel"] = abs(ball["x_vel"]) * self.speed_up_multiple  # Bounce right
        elif self._check_paddle_collision("player2"):
            ball["x_vel"] = -abs(ball["x_vel"]) * self.speed_up_multiple  # Bounce left

        # Check if a player scored
        if ball["x"] <= 0:  # Player 2 scores
            self.players["player2"]["score"] += 1
            self._check_game_over()
            self.ball = self._reset_ball()
        elif ball["x"] + self.ball_side >= self.board_width:  # Player 1 scores
            self.players["player1"]["score"] += 1
            self._check_game_over()
            self.ball = self._reset_ball()

        # Persist ball position update to the database
        self.game.update_ball_position(self.ball)
        self.game.save()

    def _check_paddle_collision(self, player):
        """Check if the ball collides with a paddle."""
        paddle = self.players[player]
        if player == "player1" and self.ball["x"] <= paddle.get("x", 0) + self.ball_side:
            return paddle["y"] <= self.ball["y"] <= paddle["y"] + self.player_height
        elif player == "player2" and self.ball["x"] + self.ball_side >= paddle.get("x", self.board_width):
            return paddle["y"] <= self.ball["y"] <= paddle["y"] + self.player_height
        return False

    def _check_game_over(self):
        """Check if a player has won the game."""
        if self.players["player1"]["score"] >= self.points_to_win:
            self.winner = "player1"
        elif self.players["player2"]["score"] >= self.points_to_win:
            self.winner = "player2"

        if self.winner:
            self.game.status = "finished"
            self.game.save()

    def get_game_state(self):
        """Return the current game state as a dictionary (fetching latest DB values)."""
        return {
            "ball": self.game.ball_position,
            "players": self.game.player_positions,
            "status": "in_progress" if not self.winner else "game_over",
            "winner": self.winner
        }
