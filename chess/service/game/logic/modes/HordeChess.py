from .ClassicChess import ClassicChess
from ..pieces import Rook, Knight, Bishop, Queen, King, Pawn
from ..utils import is_in_check, is_checkmate, is_stalemate, is_insufficient_material
import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
class HordeChess(ClassicChess):
    def initialize_board(self):
        board = {}
        # Black pieces
        board["a8"] = Rook("black", "a8", "1")
        board["b8"] = Knight("black", "b8", "1")
        board["c8"] = Bishop("black", "c8", "1")
        board["d8"] = Queen("black", "d8", "")
        board["e8"] = King("black", "e8", "")
        board["f8"] = Bishop("black", "f8", "2")
        board["g8"] = Knight("black", "g8", "2")
        board["h8"] = Rook("black", "h8", "2")
        for file_idx, file in enumerate("abcdefgh"):
            board[f"{file}7"] = Pawn("black", f"{file}7", str(file_idx + 1))
        
        # Empty squares
        for rank in range(5, 7):
            for file in "abcdefgh":
                if f"{file}{rank}" not in board:
                    board[f"{file}{rank}"] = None
        # White pieces (horde of pawns)
        for rank in range(1, 5):
            for file in "abcdefgh":
                board[f"{file}{rank}"] = Pawn("white", f"{file}{rank}", str(rank))
        board["b5"] = Pawn("white", "b5", "5")
        board["c5"] = Pawn("white", "c5", "5")
        board["f5"] = Pawn("white", "f5", "5")
        board["g5"] = Pawn("white", "g5", "5")
        
    
        self.position_history.append(self.get_position_key(board))
        return board

    def check_game_over(self, board, current_player):
        if current_player == "white" and all(piece.color == "black" for piece in board.values() if piece):
            return "horde_win", "black"
        if is_checkmate(board, current_player):
            return "checkmate", "black" if current_player == "white" else "white"
        if is_stalemate(board, current_player):
            return "stalemate", None
        if is_insufficient_material(board):
            return "insufficient_material", None
        return None, None

    # def validate_move(self, board, from_pos, to_pos, player_color, promotion_choice=None):
    #     # Call the validate_move method from ClassicChess
    #     success, message, new_board, info = super().validate_move(board, from_pos, to_pos, player_color, promotion_choice)
        
    #     if not success:
    #         return success, message, new_board, info

    #     piece = new_board[to_pos]
    #     logging.debug(f"hola desde super")
    #     # Special rule for black pawns in Horde Chess
    #     if isinstance(piece, Pawn) and piece.color == "white":
    #         from_rank = int(from_pos[1])
    #         to_rank = int(to_pos[1])
    #         # if from_rank == 7 and to_rank == 5 and from_pos[0] == to_pos[0] and new_board[to_pos] is None:
    #         #     new_board[to_pos] = piece
    #         #     new_board[from_pos] = None
    #         #     piece.position = to_pos
    #         #     piece.has_moved = True
    #         #     return True, "Valid move", new_board, info
    #         if from_rank == 1 and to_rank == 3 and from_pos[0] == to_pos[0] and new_board[to_pos] is None:
    #             new_board[to_pos] = piece
    #             new_board[from_pos] = None
    #             piece.position = to_pos
    #             piece.has_moved = True
    #             return True, "Valid move", new_board, info
    #         # if from_rank == 2 and to_rank == 4 and from_pos[0] == to_pos[0] and new_board[to_pos] is None:
    #         #     new_board[to_pos] = piece
    #         #     new_board[from_pos] = None
    #         #     piece.position = to_pos
    #         #     piece.has_moved = True
    #         #     return True, "Valid move", new_board, info

    #     return success, message, new_board, info