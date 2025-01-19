# logic.py
class Game:
    def __init__(self, player1, player2):
        self.player1 = player1
        self.player2 = player2
        self.ball_position = {'x': 350, 'y': 250}  # Example coordinates
        self.ball_velocity = {'x': 5, 'y': 5}      # Example velocity
        self.scores = {player1: 0, player2: 0}

    def update_player_position(self, player, new_position):
        if player == self.player1:
            self.player1['position'] = new_position
        elif player == self.player2:
            self.player2['position'] = new_position

    def update_ball_position(self):
        # Example game logic for ball movement
        self.ball_position['x'] += self.ball_velocity['x']
        self.ball_position['y'] += self.ball_velocity['y']
        # Add rest of logic (in stattic/pong.js)

    def get_game_state(self):
        return {
            'player1': self.player1,
            'player2': self.player2,
            'ball': self.ball_position,
            'scores': self.scores,
        }
