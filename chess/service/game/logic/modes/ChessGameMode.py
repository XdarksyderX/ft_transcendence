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
    def validate_move(self, board, from_pos, to_pos, player_color, promotion_choice=None):
        """
        Validates if a move is legal
        
        Args:
            board: The current board state
            from_pos: Starting position
            to_pos: Target position
            player_color: Color of the player making the move
            promotion_choice: Optional piece type for pawn promotion
        """
        pass

    @abstractmethod
    def create_piece(self, piece_type, color):
        """Creates a piece of the specific type and color"""
        pass
        
    @abstractmethod
    def complete_promotion(self, board, position, promotion_choice):
        """
        Completes a pending pawn promotion
        
        Args:
            board: The current board state
            position: Position of the pawn to be promoted
            promotion_choice: The chosen piece type for promotion
            
        Returns:
            (new_board, info): Updated board and promotion info
        """
        pass