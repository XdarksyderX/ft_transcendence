#logic.py
import math

class Game:
    def __init__(self, board_width=700, board_height=500, player_height=50, player_speed=5,
                 ball_side=10, start_speed=7.5, speed_up_multiple=1.02, points_to_win=3):
        # Base init board settings, WILL BE CHANGEABLE (game customization module, AI opponent will be configurable here)
        self.board_width = board_width
        self.board_height = board_height
        self.player_height = player_height
        self.ball_side = ball_side
        self.start_speed = start_speed
        self.speed_up_multiple = speed_up_multiple
        self.points_to_win = points_to_win

        # Initialize game objects
        self.ball = self._reset_ball()
        self.players = {
            "player1": {
                "x": ball_side * 1.2,  # Left side
                "y": board_height / 2 - player_height / 2,
                "score": 0
            },
            "player2": {
                "x": board_width - ball_side * 1.2 - ball_side,  # Right side
                "y": board_height / 2 - player_height / 2,
                "score": 0
            }
        }
        self.winner = None

    def _reset_ball(self):
        """Reset the ball to the center of the board with a random initial velocity."""
        angle = math.radians(30)  # Fixed angle for simplicity (can randomize if needed)
        direction = 1 if math.random() > 0.5 else -1
        return {
            "x": self.board_width / 2 - self.ball_side / 2,
            "y": self.board_height / 2 - self.ball_side / 2,
            "x_vel": self.start_speed * math.cos(angle) * direction,
            "y_vel": self.start_speed * math.sin(angle),
            "speed": self.start_speed
        }

    def update_player_position(self, player, new_y):
        """Update the player's paddle position, ensuring it stays within bounds."""
        new_y = max(0, min(new_y, self.board_height - self.player_height))
        self.players[player]["y"] = new_y

    def update_ball_position(self):
        """Update the ball's position and handle collisions."""
        ball = self.ball
        ball["x"] += ball["x_vel"]
        ball["y"] += ball["y_vel"]

        # Ball collision with top/bottom walls
        if ball["y"] <= 0 or ball["y"] + self.ball_side >= self.board_height:
            ball["y_vel"] *= -1

        # Ball collision with paddles
        if self._check_paddle_collision("player1"):
            ball["x_vel"] = abs(ball["x_vel"]) * self.speed_up_multiple  # Bounce right
        elif self._check_paddle_collision("player2"):
            ball["x_vel"] = -abs(ball["x_vel"]) * self.speed_up_multiple  # Bounce left

        # Ball out of bounds
        if ball["x"] <= 0:  # Player 2 scores
            self.players["player2"]["score"] += 1
            self._check_game_over()
            self.ball = self._reset_ball()
        elif ball["x"] + self.ball_side >= self.board_width:  # Player 1 scores
            self.players["player1"]["score"] += 1
            self._check_game_over()
            self.ball = self._reset_ball()

    def _check_paddle_collision(self, player):
        """Check if the ball collides with a paddle."""
        paddle = self.players[player]
        if player == "player1" and self.ball["x"] <= paddle["x"] + self.ball_side:
            return paddle["y"] <= self.ball["y"] <= paddle["y"] + self.player_height
        elif player == "player2" and self.ball["x"] + self.ball_side >= paddle["x"]:
            return paddle["y"] <= self.ball["y"] <= paddle["y"] + self.player_height
        return False

    def _check_game_over(self):
        """Check if a player has won the game."""
        if self.players["player1"]["score"] >= self.points_to_win:
            self.winner = "player1"
        elif self.players["player2"]["score"] >= self.points_to_win:
            self.winner = "player2"

    def get_game_state(self):
        """Return the current game state as a dictionary."""
        return {
            "ball": self.ball,
            "players": self.players,
            "winner": self.winner
        }
