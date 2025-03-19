from .ClassicChess import ClassicChess
from ..pieces import Rook, Knight, Bishop, Queen, King, Pawn
from ..utils import is_in_check, is_checkmate, is_stalemate, is_insufficient_material

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
        
        # Black pieces (all pawns on rows 1 and 2)
        for file in "abcdefgh":
            board[f"{file}7"] = Pawn("black", f"{file}7", "7")
            board[f"{file}8"] = Pawn("black", f"{file}8", "8")
        
        # Empty squares
        for rank in range(3, 7):
            for file in "abcdefgh":
                board[f"{file}{rank}"] = None

        self.position_history.append(self.get_position_key(board))
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

    def validate_move(self, board, from_pos, to_pos, player_color, promotion_choice=None):
        # Call the validate_move method from ClassicChess
        success, message, new_board, info = super().validate_move(board, from_pos, to_pos, player_color, promotion_choice)
        
        if not success:
            return success, message, new_board, info

        piece = new_board[to_pos]

        # Special rule for black pawns in Horde Chess
        if isinstance(piece, Pawn) and piece.color == "black":
            from_rank = int(from_pos[1])
            to_rank = int(to_pos[1])
            if from_rank == 7 and to_rank == 5 and from_pos[0] == to_pos[0] and new_board[to_pos] is None:
                new_board[to_pos] = piece
                new_board[from_pos] = None
                piece.position = to_pos
                piece.has_moved = True
                return True, "Valid move", new_board, info
            if from_rank == 6 and to_rank == 4 and from_pos[0] == to_pos[0] and new_board[to_pos] is None:
                new_board[to_pos] = piece
                new_board[from_pos] = None
                piece.position = to_pos
                piece.has_moved = True
                return True, "Valid move", new_board, info

        return success, message, new_board, info