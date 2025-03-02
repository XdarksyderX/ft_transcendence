from .ChessGameMode import ChessGameMode
from ..pieces import Rook, Knight, Bishop, Queen, King, Pawn
from ..utils import is_in_check, is_checkmate, is_stalemate, is_insufficient_material
import copy

class ClassicChess(ChessGameMode):
    def __init__(self):
        self.half_move_clock = 0
        self.position_history = []
        self.en_passant_target = None
    
    def initialize_board(self):
        board = {}
        
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
        if is_checkmate(board, current_player):
            return "checkmate", "black" if current_player == "white" else "white"
        
        if is_stalemate(board, current_player):
            return "stalemate", None
        
        if self.half_move_clock >= 100:
            return "fifty_moves", None
        
        position_key = self.get_position_key(board)
        if self.position_history.count(position_key) >= 3:
            return "repetition", None
        
        if is_insufficient_material(board):
            return "insufficient_material", None
        
        return None, None
    
    def validate_move(self, board, from_pos, to_pos, player_color):
        if to_pos == "O-O":
            return self.process_castling(board, player_color, "king_side")
        elif to_pos == "O-O-O":
            return self.process_castling(board, player_color, "queen_side")
        
        if from_pos not in board or board[from_pos] is None:
            return False, "No piece at the starting position", board, {}
            
        piece = board[from_pos]
            
        if piece.color != player_color:
            return False, "You cannot move your opponent's pieces", board, {}
            
        possible_moves = piece.get_possible_moves(board)
        if to_pos not in possible_moves:
            return False, "Invalid move for this piece", board, {}
            
        new_board = copy.deepcopy(board)
        captured_piece = new_board[to_pos]
        
        en_passant_capture = False
        if isinstance(piece, Pawn) and to_pos == self.en_passant_target:
            file_to, _ = to_pos
            file_from, rank_from = from_pos
            en_passant_capture = True
            
            captured_position = f"{file_to}{rank_from}"
            captured_piece = new_board[captured_position]
            new_board[captured_position] = None
        
        new_board[to_pos] = piece
        new_board[from_pos] = None
        piece.position = to_pos
        piece.has_moved = True
        
        if is_in_check(new_board, player_color):
            return False, "You cannot make a move that leaves your king in check", board, {}
        
        if isinstance(piece, Pawn) or captured_piece is not None:
            self.half_move_clock = 0
        else:
            self.half_move_clock += 1
        
        position_key = self.get_position_key(new_board)
        self.position_history.append(position_key)
        
        old_en_passant = self.en_passant_target
        self.en_passant_target = None
        
        if isinstance(piece, Pawn):
            file_from, rank_from = from_pos[0], int(from_pos[1])
            file_to, rank_to = to_pos[0], int(to_pos[1])
            
            if abs(rank_to - rank_from) == 2:
                intermediate_rank = (rank_from + rank_to) // 2
                self.en_passant_target = f"{file_to}{intermediate_rank}"
        
        promotion = None
        if isinstance(piece, Pawn):
            if (piece.color == "white" and to_pos[1] == "8") or (piece.color == "black" and to_pos[1] == "1"):
                promotion = "queen"
                new_board[to_pos] = Queen(piece.color, to_pos, "")
        
        info = {
            "captured": captured_piece.piece_id if captured_piece else None,
            "en_passant": {
                "capture": en_passant_capture,
                "target": self.en_passant_target,
                "prev_target": old_en_passant
            },
            "promotion": promotion,
            "half_move_clock": self.half_move_clock
        }
        
        return True, "Valid move", new_board, info
    
    def process_castling(self, board, player_color, side):
        rank = "1" if player_color == "white" else "8"
        
        king_pos = f"e{rank}"
        if king_pos not in board or not isinstance(board[king_pos], King) or board[king_pos].has_moved:
            return False, "Invalid castling: the king has already moved", board, {}
        
        if side == "king_side":
            rook_pos = f"h{rank}"
            king_target = f"g{rank}"
            rook_target = f"f{rank}"
        else:
            rook_pos = f"a{rank}"
            king_target = f"c{rank}"
            rook_target = f"d{rank}"
        
        if rook_pos not in board or not isinstance(board[rook_pos], Rook) or board[rook_pos].has_moved:
            return False, "Invalid castling: the rook has already moved", board, {}
        
        if side == "king_side":
            for file in ["f", "g"]:
                if board[f"{file}{rank}"] is not None:
                    return False, "Invalid castling: there are pieces between the king and rook", board, {}
        else:
            for file in ["b", "c", "d"]:
                if board[f"{file}{rank}"] is not None:
                    return False, "Invalid castling: there are pieces between the king and rook", board, {}
        
        if is_in_check(board, player_color):
            return False, "Invalid castling: the king is in check", board, {}
        
        if side == "king_side":
            for file in ["f", "g"]:
                test_board = copy.deepcopy(board)
                test_board[f"{file}{rank}"] = test_board[king_pos]
                test_board[king_pos] = None
                
                if is_in_check(test_board, player_color):
                    return False, "Invalid castling: the king would pass through an attacked square", board, {}
        else:
            for file in ["c", "d"]:
                test_board = copy.deepcopy(board)
                test_board[f"{file}{rank}"] = test_board[king_pos]
                test_board[king_pos] = None
                
                if is_in_check(test_board, player_color):
                    return False, "Invalid castling: the king would pass through an attacked square", board, {}
        
        new_board = copy.deepcopy(board)
        
        new_board[king_target] = new_board[king_pos]
        new_board[king_pos] = None
        new_board[king_target].position = king_target
        new_board[king_target].has_moved = True
        
        new_board[rook_target] = new_board[rook_pos]
        new_board[rook_pos] = None
        new_board[rook_target].position = rook_target
        new_board[rook_target].has_moved = True
        
        self.half_move_clock += 1
        position_key = self.get_position_key(new_board)
        self.position_history.append(position_key)
        
        info = {
            "castling": side,
            "half_move_clock": self.half_move_clock
        }
        
        return True, "Castling completed", new_board, info
