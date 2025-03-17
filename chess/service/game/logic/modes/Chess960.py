import random
from .ClassicChess import ClassicChess
from .ChessGameMode import ChessGameMode
from ..pieces import Rook, Knight, Bishop, Queen, King, Pawn
from ..utils import is_checkmate, is_stalemate, is_insufficient_material

class Chess960(ClassicChess):
    def initialize_board(self):
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