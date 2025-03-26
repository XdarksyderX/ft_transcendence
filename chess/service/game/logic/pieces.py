import copy
from abc import ABC, abstractmethod
from .utils import is_position_under_attack, is_in_check

import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
# Constant for board files
FILES = "abcdefgh"


class ChessPiece(ABC):
    def __init__(self, color, position, piece_id):
        self.color = color
        self.position = position
        self.piece_id = piece_id
        self.has_moved = False

    def __str__(self):
        return f"{self.color}_{self.__class__.__name__.lower()}_{self.piece_id}"

    def __repr__(self):
        return self.__str__()

    def to_dict(self):
        return {
            'type': self.__class__.__name__,
            'color': self.color,
            'position': self.position,
            'piece_id': self.piece_id,
            'has_moved': self.has_moved
        }

    @abstractmethod
    def get_possible_moves(self, board):
        pass
    # new method to return only the movements that doesnt leave you on check
    def get_legal_moves(self, board):
        """Retorna solo los movimientos que no dejan al rey en jaque."""
        legal_moves = []
        for move in self.get_possible_moves(board):
            test_board = copy.deepcopy(board)

            # Mueve la pieza en el tablero simulado
            test_board[move] = self
            test_board[self.position] = None
            old_position = self.position  # Guardar la posición original
            self.position = move  # Actualizar temporalmente la posición de la pieza
            
            # Encontrar la posición del rey después del movimiento
            king_position = None
            for pos, piece in test_board.items():
                if piece and piece.color == self.color and isinstance(piece, King):
                    king_position = pos
                    break
            
            # Verificar si el rey sigue en jaque después del movimiento
            logging.debug(f"Checking legal moves for {self} at {self.position}")

            if king_position and is_in_check(test_board, self.color):
                logging.debug(f"Move {self.position} -> {move} rejected: king still in check")
            else:
                logging.debug(f"Move {self.position} -> {move} accepted")


            # Restaurar la posición original
            self.position = old_position  

        return legal_moves


    

    # Utility method for sliding pieces (Rook, Bishop, Queen)
    def sliding_moves(self, board, directions):
        moves = []
        file_idx = FILES.index(self.position[0])
        rank = int(self.position[1])
        for dx, dy in directions:
            new_file_idx = file_idx + dx
            new_rank = rank + dy
            while 0 <= new_file_idx < 8 and 1 <= new_rank <= 8:
                target_pos = f"{FILES[new_file_idx]}{new_rank}"
                if target_pos not in board:
                    # Not a valid square
                    break
                if board[target_pos] is None:
                    moves.append(target_pos)
                else:
                    if board[target_pos].color != self.color:
                        moves.append(target_pos)
                    break
                new_file_idx += dx
                new_rank += dy
        return moves


class Pawn(ChessPiece):
    def get_possible_moves(self, board, en_passant_target=None):
        logging.debug(f"pawnpawnpawn")
        moves = []
        file, rank = self.position[0], int(self.position[1])
        direction = 1 if self.color == 'white' else -1
        
        front_pos = f"{file}{rank + direction}"
        if front_pos in board and board[front_pos] is None:
            moves.append(front_pos)

            
            if not self.has_moved:
                double_pos = f"{file}{rank + 2*direction}"
                if double_pos in board and board[double_pos] is None:
                    moves.append(double_pos)

        file_idx = FILES.index(file)
        for offset in [-1, 1]:
            if 0 <= file_idx + offset < 8:
                capture_file = FILES[file_idx + offset]
                capture_pos = f"{capture_file}{rank + direction}"
                
                if capture_pos in board and board[capture_pos] is not None:
                    piece = board[capture_pos]
                    if piece.color != self.color:
                        moves.append(capture_pos)
                if en_passant_target == capture_pos:
                        moves.append(capture_pos)
        return moves
      

class Rook(ChessPiece):
    def get_possible_moves(self, board):
        directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
        return self.sliding_moves(board, directions)


class Knight(ChessPiece):
    def get_possible_moves(self, board):
        moves = []
        file = self.position[0]
        rank = int(self.position[1])
        file_idx = FILES.index(file)
        knight_moves = [
            (2, 1), (2, -1), (-2, 1), (-2, -1),
            (1, 2), (1, -2), (-1, 2), (-1, -2)
        ]
        for dx, dy in knight_moves:
            new_idx = file_idx + dx
            new_rank = rank + dy
            if 0 <= new_idx < 8 and 1 <= new_rank <= 8:
                target_pos = f"{FILES[new_idx]}{new_rank}"
                if target_pos in board:
                    target = board[target_pos]
                    if target is None or target.color != self.color:
                        moves.append(target_pos)
        return moves


class Bishop(ChessPiece):
    def get_possible_moves(self, board):
        directions = [(1, 1), (1, -1), (-1, 1), (-1, -1)]
        return self.sliding_moves(board, directions)


class Queen(ChessPiece):
    def get_possible_moves(self, board):
        # Combining sliding moves from rook (orthogonal) and bishop (diagonal)
        directions = [(1, 0), (-1, 0), (0, 1), (0, -1),
                      (1, 1), (1, -1), (-1, 1), (-1, -1)]
        return self.sliding_moves(board, directions)


class King(ChessPiece):
    def get_possible_moves(self, board):
        moves = []
        file = self.position[0]
        rank = int(self.position[1])
        file_idx = FILES.index(file)
        directions = [
            (0, 1), (1, 1), (1, 0), (1, -1),
            (0, -1), (-1, -1), (-1, 0), (-1, 1)
        ]
        # Regular moves: one square in any direction, provided the target isn't under attack.
        for dx, dy in directions:
            new_idx = file_idx + dx
            new_rank = rank + dy
            if 0 <= new_idx < 8 and 1 <= new_rank <= 8:
                target_pos = f"{FILES[new_idx]}{new_rank}"
                if target_pos in board:
                    target = board[target_pos]
                    if (target is None or target.color != self.color):
                        # Simulate move for safety check
                        test_board = copy.deepcopy(board)
                        test_board[target_pos] = self
                        test_board[self.position] = None
                        if not is_position_under_attack(test_board, target_pos, self.color, memo={}):
                            moves.append(target_pos)

        # Castling moves: only if king not in check and hasn't moved.
        if not self.has_moved and not is_in_check(board, self.color, memo={}):
            rank_suffix = "1" if self.color == 'white' else "8"

            def check_castling(files_to_check, rook_pos):
                # Check all squares between king and rook for occupancy and attacks.
                for f in files_to_check:
                    square = f"{f}{rank_suffix}"
                    if board.get(square) is not None or is_position_under_attack(board, square, self.color, memo={}):
                        return False
                # Verify rook existence and its unmoved status.
                rook = board.get(rook_pos)
                if not rook or not isinstance(rook, Rook) or rook.has_moved:
                    return False
                return True

            # King-side castling
            if check_castling(['f', 'g'], f"h{rank_suffix}"):
                moves.append("O-O")
            # Queen-side castling
            if check_castling(['b', 'c', 'd'], f"a{rank_suffix}"):
                moves.append("O-O-O")

        return moves
