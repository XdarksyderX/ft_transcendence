import math
import random
from core.models import PongGame  # Import the database model

class Game:
    def __init__(self, game_instance: PongGame):
        """Initialize the game using an existing PongGame instance."""
        self.game = game_instance
        # load stored game attributes
        self.board_width = game_instance.board_width
        self.board_height = game_instance.board_height
        self.player_height = game_instance.player_height
        self.player_width = game_instance.player_width
        self.player_speed = game_instance.player_speed
        self.ball_side = game_instance.ball_side
        self.start_speed = game_instance.start_speed
        self.speed_up_multiple = game_instance.speed_up_multiple
        self.max_speed = game_instance.max_speed
        self.points_to_win = game_instance.points_to_win
        self.x_margin = game_instance.x_margin
        self.p2_xpos = game_instance.p2_xpos
        self.p_y_mid = game_instance.p_y_mid
        self.b_x_mid = game_instance.b_x_mid
        self.b_y_mid = game_instance.b_y_mid

        # Ensure database has correct defaults for players
        self.game.player_positions.setdefault("player1", {"x": self.x_margin, "y": self.p_y_mid}) #initialize at the middle of the board
        self.game.player_positions.setdefault("player2", {"x": self.p2_xpos, "y": self.p_y_mid}) 

        # Load ball position or reset if missing
        self.ball = self.game.ball_position or self._reset_ball(0) # param is the who scored, 0 means no one scored (game start)
        self.winner = None

    def _reset_ball(self, scored):
        """Reset the ball to the center of the board with a random initial velocity."""
        angle = math.radians(random.uniform(-45, 45))  # Randomized initial angle max 45 degress
        if scored == 1:
            direction = 1 #right
        elif scored == 2:
            direction = -1 #left
        else:
            direction = random.choice([-1, 1])  # Randomly left (-1) or right (1)
        ball_state = {
            "x": self.b_x_mid,
            "y": self.b_y_mid,
            "xVel": self.start_speed * math.cos(angle) * direction,
            "yVel": self.start_speed * math.sin(angle),
            "speed": self.start_speed
        }
        self.game.update_ball_position(ball_state) # Persist new ball state
        self.game.save()
        return ball_state

    def update_player_movement(self, player, direction):
        """Updates player movement & persists it in the database."""
        if player not in self.game.player_positions:
            return

        current_y = self.game.player_positions[player]["y"]

        # Update position based on direction
        if direction == "UP":
            new_y = max(0, current_y - self.player_speed) # returns max value between 0 & the calculated new_y
        elif direction == "DOWN":
            new_y = min(self.board_height - self.player_height, current_y + self.player_speed)
        else:  # STOP case
            new_y = current_y

        # Ensure player X-position is preserved
        current_x = self.game.player_positions[player].get("x", self.x_margin if player == "player1" else self.p2_xpos)

        # Persist movement update to the database
        self.game.player_positions[player]["y"] = new_y
        self.game.update_position(player, {"x": current_x, "y": new_y})
        self.game.save()

    def update_ball_position(self):
        """Updates the ball's position, handles collisions, and persists it."""
        ball = self.ball
        ball["x"] += ball["xVel"]
        ball["y"] += ball["yVel"]

        # Ball collision with top/bottom walls
        if ball["y"] <= 0 or ball["y"] + self.ball_side >= self.board_height:
            ball["yVel"] *= -1  # Reverse Y direction

        # Ball collision with paddles
        self._handle_paddle_hit("player1")
        self._handle_paddle_hit("player2")

        # Check if a player scored
        if ball["x"] <= 0:  # Player 2 scores
            self.game.player2_score += 1
            self._check_game_over()
            self.ball = self._reset_ball(2)
        elif ball["x"] + self.ball_side >= self.board_width:  # Player 1 scores
            self.game.player1_score += 1
            self._check_game_over()
            self.ball = self._reset_ball(1)

        # Persist ball position update to the database
        self.game.update_ball_position(self.ball)
        self.game.save()

    def _handle_paddle_hit(self, player):
        """Handles ball collision with paddles, calculating rebound angles."""
        paddle = self.game.player_positions.get(player)
        if not paddle:
            return

        paddle_x = paddle["x"]
        paddle_y = paddle["y"]

        ball = self.ball  # Get ball position

        # Check if the ball is colliding with the paddle
        if ((ball["x"] < paddle_x + self.player_width) and  # Ball doesn't pass right side
            (ball["x"] + self.ball_side > paddle_x) and      # Ball passes left side
            (ball["y"] < paddle_y + self.player_height) and  # Ball doesn't pass bottom
            (ball["y"] + self.ball_side > paddle_y)):        # Ball passes top
            
            # Calculate relative collision position
            collision_point = ball["y"] - paddle_y - self.player_height / 2 + self.ball_side / 2
            
            # Clamp the collision point to prevent extreme angles
            collision_point = max(-self.player_height / 2, min(self.player_height / 2, collision_point))
            
            # Normalize the collision point between -1 and 1
            collision_point /= (self.player_height / 2)

            # Compute rebound angle (max ±45 degrees)
            rebound_angle = (math.pi / 4) * collision_point

            # Increase speed slightly with each hit
            if ball["speed"] < self.max_speed:
                ball["speed"] *= self.speed_up_multiple

            # Calculate new velocity components
            ball["xVel"] = ball["speed"] * math.cos(rebound_angle)
            ball["yVel"] = ball["speed"] * math.sin(rebound_angle)

            # Ensure the ball moves in the correct direction after bouncing
            if player == "player1":  
                ball["xVel"] = abs(ball["xVel"])  # Bounce right
            else:  
                ball["xVel"] = -abs(ball["xVel"])  # Bounce left

    def _check_game_over(self):
        """Check if a player has won the game and persist scores."""
        if self.game.player1_score >= self.points_to_win:
            self.winner = "player1"
        elif self.game.player2_score >= self.points_to_win:
            self.winner = "player2"

        if self.winner:
            self.game.status = "finished"
            self.game.save()

    def get_game_state(self):
        """Return the current game state as a dictionary (fetching latest DB values)."""
        return {
            "ball": self.ball,
            "players": {
                "player1": {
                    **self.game.player_positions.get("player1", {"x": self.x_margin, "y": self.p_y_mid}), 
                    "score": self.game.player1_score
                },
                "player2": {
                    **self.game.player_positions.get("player2", {"x": self.p2_xpos, "y": self.p_y_mid}), 
                    "score": self.game.player2_score
                }
            },
            "status": "in_progress" if not self.winner else "game_over",
            "winner": self.winner
        }
