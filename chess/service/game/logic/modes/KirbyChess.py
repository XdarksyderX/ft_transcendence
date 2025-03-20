from .ClassicChess import ClassicChess
# from ..pieces import Rook, Knight, Bishop, Queen, King, Pawn
import logging

logger = logging.getLogger('chess_game')
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class KirbyChess(ClassicChess):

    def validate_move(self, board, from_pos, to_pos, player_color, promotion_choice=None):
        logger.debug(f"Validating kirby move from {from_pos} to {to_pos} for {player_color}")
        
        # Call the validate_move method from ClassicChess
        success, message, new_board, info = super().validate_move(board, from_pos, to_pos, player_color, promotion_choice)
        
        if not success:
            logger.debug(f"Move validation failed: {message}")
            return success, message, new_board, info

        piece = new_board[to_pos]
        captured_piece = board[to_pos] #what was before the capture?

        # Special rule for Kirby Chess: convert capturing piece into captured piece
        if captured_piece:
            logger.debug(f"Kirby captured piece: {captured_piece.__class__.__name__} at {to_pos}")
            new_piece = self.create_piece(captured_piece.__class__.__name__.lower(), player_color)
            if new_piece:
                new_piece.position = to_pos
                new_board[to_pos] = new_piece
                info["converted"] = {
                    "from": piece.__class__.__name__,
                    "to": new_piece.__class__.__name__
                }
                logger.debug(f"Converted {piece.__class__.__name__} to {new_piece.__class__.__name__} at {to_pos}")

        return success, message, new_board, info

    # def create_piece(self, piece_type, color):
    #     piece_classes = {
    #         'pawn': Pawn,
    #         'rook': Rook,
    #         'knight': Knight,
    #         'bishop': Bishop,
    #         'queen': Queen,
    #         'king': King
    #     }
    #     if piece_type.lower() in piece_classes:
    #         return piece_classes[piece_type.lower()](color, "", "")
    #     return None