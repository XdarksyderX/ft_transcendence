from .ChessGameMode import ChessGameMode
from ..pieces import Rook, Knight, Bishop, Queen, King, Pawn
from ..utils import is_in_check, is_checkmate, is_stalemate, is_insufficient_material

class HordeChess(ChessGameMode):
    def __init__(self):
        self.half_move_clock = 0
        self.position_history = []
        self.en_passant_target = None

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

    def get_position_key(self, board):
        key = []
        for rank in range(8, 0, -1):
            for file in "abcdefgh":
                piece = board.get(f"{file}{rank}")
                if piece is None:
                    key.append(".")
                else:
                    key.append(str(piece))
        return "".join(key)

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
        if from_pos not in board or board[from_pos] is None:
            return False, "No piece at the starting position", board, {}
        piece = board[from_pos]
        if piece.color != player_color:
            return False, "You cannot move your opponent's pieces", board, {}

        possible_moves = piece.get_possible_moves(board)
        
        # Special rule for black pawns in Horde Chess
        if isinstance(piece, Pawn) and piece.color == "black":
            from_rank = int(from_pos[1])
            to_rank = int(to_pos[1])
            if from_rank == 7 and to_rank == 5 and from_pos[0] == to_pos[0] and board[to_pos] is None:
                possible_moves.append(to_pos)
            if from_rank == 6 and to_rank == 4 and from_pos[0] == to_pos[0] and board[to_pos] is None:
                possible_moves.append(to_pos)

        if to_pos not in possible_moves:
            return False, "Invalid move for this piece", board, {}

        new_board = board.copy()
        captured_piece = new_board[to_pos]
        new_board[to_pos] = piece
        new_board[from_pos] = None
        piece.position = to_pos

        if is_in_check(new_board, player_color):
            return False, "You cannot make a move that leaves your king in check", board, {}

        info = {
            "captured": captured_piece.piece_id if captured_piece else None,
        }

        opponent_color = "black" if player_color == "white" else "white"
        game_over_status, winner = self.check_game_over(new_board, opponent_color)
        if game_over_status:
            info["game_over"] = {
                "status": game_over_status,
                "winner": winner
            }

        return True, "Valid move", new_board, info

    def create_piece(self, piece_type, color):
        piece_classes = {
            'pawn': Pawn,
            'rook': Rook,
            'knight': Knight,
            'bishop': Bishop,
            'queen': Queen,
            'king': King
        }
        if piece_type.lower() in piece_classes:
            return piece_classes[piece_type.lower()](color, "", "")
        return None

    def complete_promotion(self, board, position, promotion_choice):
        if position not in board or board[position] is None or not isinstance(board[position], Pawn):
            return False, "No pawn at position for promotion", board, {}
        piece = board[position]
        new_piece = self.create_piece(promotion_choice, piece.color)
        if not new_piece:
            return False, "Invalid promotion piece type", board, {}
        new_piece.position = position

        new_board = board.copy()
        new_board[position] = new_piece

        info = {
            "promotion": promotion_choice
        }
        opponent_color = "black" if piece.color == "white" else "white"
        game_over_status, winner = self.check_game_over(new_board, opponent_color)
        if game_over_status:
            info["game_over"] = {
                "status": game_over_status,
                "winner": winner
            }
        return True, "Promotion completed", new_board, info