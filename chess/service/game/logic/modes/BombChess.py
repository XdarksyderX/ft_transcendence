from .ClassicChess import ClassicChess
from ..pieces import Rook, Knight, Bishop, Queen, King, Pawn
import logging

logger = logging.getLogger('chess_game')
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class BombChess(ClassicChess):

    def validate_move(self, board, from_pos, to_pos, player_color, promotion_choice=None):
        logger.debug(f"Validating bomb move from {from_pos} to {to_pos} for {player_color}")
        
        # Call the validate_move method from ClassicChess
        success, message, new_board, info = super().validate_move(board, from_pos, to_pos, player_color, promotion_choice)
        
        if not success:
            logger.debug(f"Move validation failed: {message}")
            return success, message, new_board, info

        captured_piece = board[to_pos]

        # Special rule for Bomb Chess: affect all adjacent pieces except pawns
        if captured_piece:
            logger.debug(f"Bomb captured piece: {captured_piece.__class__.__name__} at {to_pos}")
            affected_positions = self.get_surrounding_squares(to_pos)
            for pos in affected_positions:
                if pos in new_board and new_board[pos] and not isinstance(new_board[pos], Pawn):
                    logger.debug(f"Removing piece: {new_board[pos].__class__.__name__} at {pos}")
                    new_board[pos] = None

        # Check if the explosion captured the king
        white_king_alive = any(isinstance(piece, King) and piece.color == "white" for piece in new_board.values())
        black_king_alive = any(isinstance(piece, King) and piece.color == "black" for piece in new_board.values())
        logger.debug(f"Bomb -> white_king_alive: {white_king_alive} & black_king_alive: {black_king_alive}")

        if not white_king_alive or not black_king_alive:
            winner = "black" if not white_king_alive else "white"
            info["game_over"] = True
            info["winner"] = winner
            return True, "Game over", new_board, info

        return success, message, new_board, info

    def get_surrounding_squares(self, pos):
        file, rank = pos[0], int(pos[1])
        surrounding_squares = []
        for df in [-1, 0, 1]:
            for dr in [-1, 0, 1]:
                if df == 0 and dr == 0:
                    continue
                new_file = chr(ord(file) + df)
                new_rank = rank + dr
                if 'a' <= new_file <= 'h' and 1 <= new_rank <= 8:
                    surrounding_squares.append(f"{new_file}{new_rank}")
        return surrounding_squares