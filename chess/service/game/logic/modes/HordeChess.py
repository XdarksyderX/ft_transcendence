from .ChessGameMode import ChessGameMode
from .ClassicChess import ClassicChess
from ..pieces import Rook, Knight, Bishop, Queen, King, Pawn
from ..utils import is_in_check, is_checkmate, is_stalemate, is_insufficient_material

# I guess in horde mode, the only differences are in initialization: so all black pieces are pawns
# and in game over cause white wins if all black pieces are catched
class HordeChess(ClassicChess):
    def initialize_board(self):
        board = {}
        # White pieces
        board["a1"] = Rook("white", "a1", "1")
        board["b1"] = Knight("white", "b1", "1")
        board["c1"] = Bishop("white", "c1", "1")
        board["d1"] = Queen("white", "d1", "")
        board["e1"] = King("white", "e1", "")
        board["f1"] = Bishop("white", "f1", "2")
        board["g1"] = Knight("white", "g1", "2")
        board["h1"] = Rook("white", "h1", "2")
        for file_idx, file in enumerate("abcdefgh"):
            board[f"{file}2"] = Pawn("white", f"{file}2", str(file_idx + 1))
        
        for rank in range(1, 9):
            for file in "abcdefgh":
                board[f"{file}{rank}"] = Pawn("black", f"{file}{rank}", str(rank))
        
        return board

    def check_game_over(self, board, current_player):
        if current_player == "white" and all(piece.color == "black" for piece in board.values() if piece):
            return "horde_win", "white"
        if is_checkmate(board, current_player):
            return "checkmate", "black" if current_player == "white" else "white"
        if is_stalemate(board, current_player):
            return "stalemate", None
        if is_insufficient_material(board):
            return "insufficient_material", None
        return None, None
    