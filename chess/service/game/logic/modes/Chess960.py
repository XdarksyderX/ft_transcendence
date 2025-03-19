import random
import logging
from .ChessGameMode import ChessGameMode
from ..pieces import Rook, Knight, Bishop, Queen, King, Pawn
from ..utils import is_checkmate, is_stalemate, is_insufficient_material

logger = logging.getLogger('chess_game')
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class Chess960(ChessGameMode):
    def initialize_board(self):
        logger.debug("Initializing Chess960 board")
        board = {}
        white_back_rank = self._generate_back_rank()
        black_back_rank = white_back_rank[::-1]

        # logger.debug(f"White back rank: {white_back_rank}")
        # logger.debug(f"Black back rank: {black_back_rank}")

        # Place white pieces
        for idx, piece in enumerate(white_back_rank):
            position = chr(ord('a') + idx) + '1'
            board[position] = piece('white', position, str(idx + 1))
            # logger.debug(f"Placed {piece.__name__} at {position} for white")
        
        # Place black pieces
        for idx, piece in enumerate(black_back_rank):
            position = chr(ord('a') + idx) + '8'
            board[position] = piece('black', position, str(idx + 1))
            # logger.debug(f"Placed {piece.__name__} at {position} for black")
        
        # Place pawns
        for file in "abcdefgh":
            board[f"{file}2"] = Pawn("white", f"{file}2", str(ord(file) - ord('a') + 1))
            board[f"{file}7"] = Pawn("black", f"{file}7", str(ord(file) - ord('a') + 1))
            logger.debug(f"Placed Pawn at {file}2 for white")
            logger.debug(f"Placed Pawn at {file}7 for black")
        
        return board

    def _generate_back_rank(self):
        pieces = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook]
        while True:
            random.shuffle(pieces)
            if self._is_valid_back_rank(pieces):
                return pieces

    def _is_valid_back_rank(self, pieces):
        # Ensure bishops are on different color squares
        bishop_positions = [i for i, piece in enumerate(pieces) if piece == Bishop]
        if bishop_positions[0] % 2 == bishop_positions[1] % 2:
            return False
        # Ensure king is between rooks
        king_position = pieces.index(King)
        rook_positions = [i for i, piece in enumerate(pieces) if piece == Rook]
        if not (rook_positions[0] < king_position < rook_positions[1]):
            return False
        return True