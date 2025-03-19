import random
import logging
from .ClassicChess import ClassicChess
from ..pieces import Rook, Knight, Bishop, Queen, King, Pawn
from ..utils import is_checkmate, is_stalemate, is_insufficient_material

logger = logging.getLogger('chess_game')
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class Chess960(ClassicChess):
    def initialize_board(self):
        logger.debug("Initializing Chess960 board")
        board = {}
        white_back_rank = self._generate_back_rank()
        black_back_rank = white_back_rank[::-1]

        # Place white pieces
        for idx, piece in enumerate(white_back_rank):
            position = chr(ord('a') + idx) + '1'
            board[position] = piece('white', position, str(idx + 1))
        
        # Place black pieces
        for idx, piece in enumerate(black_back_rank):
            position = chr(ord('a') + idx) + '8'
            board[position] = piece('black', position, str(idx + 1))
        
        # Place pawns
        for file in "abcdefgh":
            board[f"{file}2"] = Pawn("white", f"{file}2", str(ord(file) - ord('a') + 1))
            board[f"{file}7"] = Pawn("black", f"{file}7", str(ord(file) - ord('a') + 1))
        
        # Initialize empty squares
        for rank in range(3, 7):
            for file in "abcdefgh":
                board[f"{file}{rank}"] = None

        self.position_history.append(self.get_position_key(board))
        return board

    def _generate_back_rank(self):
        back_rank = [None] * 8

        # Place bishops on different color squares
        bishop_pos1 = random.choice([0, 2, 4, 6])
        bishop_pos2 = random.choice([1, 3, 5, 7])
        back_rank[bishop_pos1] = Bishop
        back_rank[bishop_pos2] = Bishop

        # Place the king between the rooks
        remaining_positions = [i for i in range(8) if back_rank[i] is None]
        rook_pos1, rook_pos2 = sorted(random.sample(remaining_positions, 2))
        king_pos = random.choice([i for i in range(rook_pos1 + 1, rook_pos2)])

        back_rank[rook_pos1] = Rook
        back_rank[rook_pos2] = Rook
        back_rank[king_pos] = King

        # Place the remaining pieces (queen and knights)
        remaining_positions = [i for i in range(8) if back_rank[i] is None]
        remaining_pieces = [Queen, Knight, Knight]
        for pos, piece in zip(remaining_positions, remaining_pieces):
            back_rank[pos] = piece

        logger.debug(f"Generated valid back rank: {back_rank}")
        return back_rank