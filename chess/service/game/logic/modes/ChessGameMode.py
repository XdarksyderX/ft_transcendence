from abc import ABC, abstractmethod

class ChessGameMode(ABC):
    """Base class for chess game modes"""
    
    @abstractmethod
    def initialize_board(self):
        """Initializes the board according to the game mode rules"""
        pass
    
    @abstractmethod
    def check_game_over(self, board, current_player):
        """Checks if the game is over"""
        pass
    
    @abstractmethod
    def validate_move(self, board, from_pos, to_pos, player_color):
        """Validates if a move is legal"""
        pass

    @abstractmethod
    def create_piece(self, piece_type, color):
        """Creates a piece of the specific type and color"""
        pass