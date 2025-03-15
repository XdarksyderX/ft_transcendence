from .ChessGameMode import ChessGameMode
from ..pieces import Rook, Knight, Bishop, Queen, King, Pawn
import copy
from ..utils import is_in_check, is_checkmate, is_stalemate, is_insufficient_material

class ClassicChess(ChessGameMode):
    def __init__(self):
        self.half_move_clock = 0
        self.full_move_number = 1
        self.position_history = []
        self.en_passant_target = None
        self.castling_rights = {
            "white": {"kingside": True, "queenside": True},
            "black": {"kingside": True, "queenside": True}
        }

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
        
        # White pawns
        for file_idx, file in enumerate("abcdefgh"):
            board[f"{file}2"] = Pawn("white", f"{file}2", str(file_idx + 1))
        
        # Black pieces
        board["a8"] = Rook("black", "a8", "1")
        board["b8"] = Knight("black", "b8", "1")
        board["c8"] = Bishop("black", "c8", "1")
        board["d8"] = Queen("black", "d8", "")
        board["e8"] = King("black", "e8", "")
        board["f8"] = Bishop("black", "f8", "2")
        board["g8"] = Knight("black", "g8", "2")
        board["h8"] = Rook("black", "h8", "2")
        
        # Black pawns
        for file_idx, file in enumerate("abcdefgh"):
            board[f"{file}7"] = Pawn("black", f"{file}7", str(file_idx + 1))
        
        return board

    def get_position_key(self, board):
        """Generate a unique key for the current board position for repetition detection"""
        pieces = sorted(
            [(pos, piece.piece_id, piece.color) for pos, piece in board.items()],
            key=lambda x: x[0]
        )
        return str(pieces) + f"_ep:{self.en_passant_target}_castling:{self.castling_rights}"

    def validate_move(self, board, from_pos, to_pos, player_color, promotion_piece=None):
        """Validate if a move is legal and return the new board state if it is"""
        if from_pos not in board:
            return False, "No piece at the starting position", board, {}
        
        piece = board[from_pos]
        
        if piece.color != player_color:
            return False, "Cannot move opponent's piece", board, {}
        
        # Store old en_passant target for history
        old_en_passant = self.en_passant_target
        self.en_passant_target = None
        
        # Check if the move is valid for the piece
        valid_moves = piece.get_valid_moves(board)
        
        if to_pos not in valid_moves:
            return False, "Invalid move for this piece", board, {}
        
        # Check for castling
        if piece.piece_type == "king" and abs(ord(to_pos[0]) - ord(from_pos[0])) > 1:
            side = "kingside" if to_pos[0] > from_pos[0] else "queenside"
            return self.process_castling(board, player_color, side)
        
        # Create new board with the move
        new_board = copy.deepcopy(board)
        captured_piece = new_board.get(to_pos)
        
        # Check for en passant capture
        en_passant_capture = False
        if piece.piece_type == "pawn" and to_pos == self.en_passant_target:
            en_passant_capture = True
            capture_pos = to_pos[0] + from_pos[1]  # Same file as target, same rank as origin
            captured_piece = new_board.get(capture_pos)
            new_board[capture_pos] = None
        
        # Move piece
        new_board[to_pos] = piece
        new_board[from_pos] = None
        
        # Update piece position
        piece.position = to_pos
        
        # Update half-move clock (reset on pawn move or capture)
        if piece.piece_type == "pawn" or captured_piece:
            self.half_move_clock = 0
        else:
            self.half_move_clock += 1
        
        # Check for pawn double move (set en_passant target)
        if piece.piece_type == "pawn" and abs(int(to_pos[1]) - int(from_pos[1])) == 2:
            rank = "3" if piece.color == "white" else "6"
            self.en_passant_target = to_pos[0] + rank
        
        # Update castling rights if king or rook moves
        if piece.piece_type == "king":
            self.castling_rights[player_color]["kingside"] = False
            self.castling_rights[player_color]["queenside"] = False
        
        if piece.piece_type == "rook":
            if from_pos == "a1" and player_color == "white":
                self.castling_rights["white"]["queenside"] = False
            elif from_pos == "h1" and player_color == "white":
                self.castling_rights["white"]["kingside"] = False
            elif from_pos == "a8" and player_color == "black":
                self.castling_rights["black"]["queenside"] = False
            elif from_pos == "h8" and player_color == "black":
                self.castling_rights["black"]["kingside"] = False
        
        # Check if the move would leave the king in check
        king_pos = None
        for pos, p in new_board.items():
            if p and p.piece_type == "king" and p.color == player_color:
                king_pos = pos
                break
        
        if is_in_check(new_board, player_color):
            return False, "This move would leave your king in check", board, {}
        
        # Check for pawn promotion
        promotion_pending = False
        promotion = None
        if piece.piece_type == "pawn":
            promotion_rank = "8" if player_color == "white" else "1"
            if to_pos[1] == promotion_rank:
                if promotion_piece:
                    # If promotion piece is specified, create it
                    new_piece = self.create_piece(promotion_piece, player_color)
                    if new_piece:
                        new_piece.position = to_pos
                        new_board[to_pos] = new_piece
                        promotion = promotion_piece
                    else:
                        return False, "Invalid promotion piece", board, {}
                else:
                    # Mark promotion as pending if no piece specified
                    promotion_pending = True
        
        # Update position history for threefold repetition detection
        position_key = self.get_position_key(new_board)
        self.position_history.append(position_key)
        
        # If black moved, increment the full move counter
        if player_color == "black":
            self.full_move_number += 1
        
        # Create info dictionary with move details
        info = {
            "captured": captured_piece.piece_id if captured_piece else None,
            "en_passant": {
                "capture": en_passant_capture,
                "target": self.en_passant_target,
                "prev_target": old_en_passant
            },
            "promotion": promotion,
            "promotion_pending": promotion_pending,
            "half_move_clock": self.half_move_clock,
            "full_move_number": self.full_move_number
        }
        
        # Check if the move resulted in checkmate or other game-ending condition
        opponent_color = "black" if player_color == "white" else "white"
        game_over_status, winner = self.check_game_over(new_board, opponent_color)
        
        # Add game over information to the info dictionary
        if game_over_status:
            info["game_over"] = {
                "status": game_over_status,
                "winner": winner
            }
        
        return True, "Valid move", new_board, info

    def process_castling(self, board, player_color, side):
        """Handle castling move logic"""
        rank = "1" if player_color == "white" else "8"
        king_pos = f"e{rank}"
        
        # Check if castling rights are valid
        if not self.castling_rights[player_color][side]:
            return False, f"Lost {side} castling rights", board, {}
        
        # Set rook and king target positions based on castling side
        if side == "kingside":
            king_target = f"g{rank}"
            rook_pos = f"h{rank}"
            rook_target = f"f{rank}"
        else:  # queenside
            king_target = f"c{rank}"
            rook_pos = f"a{rank}"
            rook_target = f"d{rank}"
        
        # Check if king and rook are in correct positions
        if king_pos not in board or board[king_pos].piece_type != "king":
            return False, "King not in correct position for castling", board, {}
        
        if rook_pos not in board or board[rook_pos].piece_type != "rook":
            return False, "Rook not in correct position for castling", board, {}
        
        # Check if paths are clear
        if side == "kingside":
            path = ["f", "g"]
        else:  # queenside
            path = ["b", "c", "d"]
        
        for file in path:
            pos = f"{file}{rank}"
            if pos in board and board[pos]:
                return False, "Cannot castle through pieces", board, {}
        
        # Check if king is in check
        if is_in_check(board, player_color):
            return False, "Cannot castle out of check", board, {}
        
        # Check if king would move through or into check
        if side == "kingside":
            test_squares = ["f", "g"]
        else:  # queenside
            test_squares = ["c", "d"]
        
        for file in test_squares:
            test_board = copy.deepcopy(board)
            test_board[f"{file}{rank}"] = test_board[king_pos]
            test_board[king_pos] = None
            
            if is_in_check(test_board, player_color):
                return False, "Cannot castle through check", board, {}
        
        # Perform castling move
        new_board = copy.deepcopy(board)
        
        # Move king
        new_board[king_target] = new_board[king_pos]
        new_board[king_pos] = None
        new_board[king_target].position = king_target
        new_board[king_target].has_moved = True
        
        # Move rook
        new_board[rook_target] = new_board[rook_pos]
        new_board[rook_pos] = None
        new_board[rook_target].position = rook_target
        new_board[rook_target].has_moved = True
        
        # Update castling rights
        self.castling_rights[player_color]["kingside"] = False
        self.castling_rights[player_color]["queenside"] = False
        
        # Update half-move clock
        self.half_move_clock += 1
        
        # Update full move number if black moved
        if player_color == "black":
            self.full_move_number += 1
        
        # Update position history
        position_key = self.get_position_key(new_board)
        self.position_history.append(position_key)
        
        info = {
            "castling": side,
            "half_move_clock": self.half_move_clock,
            "full_move_number": self.full_move_number
        }
        
        # Check if castling resulted in checkmate
        opponent_color = "black" if player_color == "white" else "white"
        game_over_status, winner = self.check_game_over(new_board, opponent_color)
        
        if game_over_status:
            info["game_over"] = {
                "status": game_over_status,
                "winner": winner
            }
        
        return True, "Castling completed", new_board, info

    def complete_promotion(self, board, position, piece_type, player_color):
        """Complete a pending pawn promotion"""
        if position not in board or not board[position] or board[position].piece_type != "pawn":
            return False, "No pawn at position for promotion", board, {}
        
        piece = board[position]
        if piece.color != player_color:
            return False, "Cannot promote opponent's pawn", board, {}
        
        # Check if pawn is on the promotion rank
        promotion_rank = "8" if player_color == "white" else "1"
        if position[1] != promotion_rank:
            return False, "Pawn not on promotion rank", board, {}
        
        # Create new promoted piece
        new_piece = self.create_piece(piece_type, player_color)
        if not new_piece:
            return False, "Invalid promotion piece type", board, {}
        
        # Update board with new piece
        new_board = copy.deepcopy(board)
        new_piece.position = position
        new_board[position] = new_piece
        
        info = {
            "promotion": piece_type
        }
        
        # Check if promotion resulted in checkmate
        opponent_color = "black" if player_color == "white" else "white"
        game_over_status, winner = self.check_game_over(new_board, opponent_color)
        
        if game_over_status:
            info["game_over"] = {
                "status": game_over_status,
                "winner": winner
            }
        
        return True, "Promotion completed", new_board, info

    def create_piece(self, piece_type, color):
        """Create a new piece of the specified type and color"""
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

    def check_game_over(self, board, player_to_move):
        """Check if the game is over and return the status and winner"""
        # Check for checkmate
        if is_checkmate(board, player_to_move):
            winner = "white" if player_to_move == "black" else "black"
            return "checkmate", winner
        
        # Check for stalemate
        if is_stalemate(board, player_to_move):
            return "stalemate", None
        
        # Check for insufficient material
        if is_insufficient_material(board):
            return "insufficient_material", None
        
        # Check for fifty-move rule
        if self.half_move_clock >= 100:  # 50 moves by each player = 100 half-moves
            return "fifty_move_rule", None
        
        # Check for threefold repetition
        position_counts = {}
        for pos in self.position_history:
            position_counts[pos] = position_counts.get(pos, 0) + 1
            if position_counts[pos] >= 3:
                return "threefold_repetition", None
        
        # Game is still ongoing
        return None, None

    def get_game_state(self, board, player_to_move):
        """Get the current state of the game including check and game over status"""
        # Check if player is in check
        in_check = is_in_check(board, player_to_move)
        
        # Check for game over conditions
        game_over_status, winner = self.check_game_over(board, player_to_move)
        
        state = {
            "in_check": in_check,
            "game_over": False,
            "game_over_reason": None,
            "winner": None
        }
        
        if game_over_status:
            state["game_over"] = True
            state["game_over_reason"] = game_over_status
            state["winner"] = winner
            
            # Add message based on game over reason
            if game_over_status == "checkmate":
                state["message"] = f"Checkmate! {winner.capitalize()} wins the game."
            elif game_over_status == "stalemate":
                state["message"] = "Game ended in stalemate."
            elif game_over_status == "insufficient_material":
                state["message"] = "Draw due to insufficient material."
            elif game_over_status == "fifty_move_rule":
                state["message"] = "Draw due to fifty-move rule."
            elif game_over_status == "threefold_repetition":
                state["message"] = "Draw due to threefold repetition."
        elif in_check:
            state["message"] = f"{player_to_move.capitalize()} is in check."
        
        return state
