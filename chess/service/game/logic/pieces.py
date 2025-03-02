# Chess Pieces Legend:
# King = Rey
# Queen = Dama/Reina
# Bishop = Alfil
# Knight = Caballo
# Rook = Torre
# Pawn = Peón

import copy
from abc import ABC, abstractmethod

class ChessPiece(ABC):
	def __init__(self, color, position, piece_id):
		self.color = color
		self.position = position
		self.piece_id = piece_id
		self.has_moved = False

	def __str__(self):
		return f"{self.color}_{self.__class__.__name__.lower()}_{self.piece_id}"

	@abstractmethod
	def get_possible_moves(self, board):
		pass

class Pawn(ChessPiece):
	def get_possible_moves(self, board):
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
		
		files = "abcdefgh"
		file_idx = files.index(file)
		
		for offset in [-1, 1]:
			if 0 <= file_idx + offset < 8:
				capture_file = files[file_idx + offset]
				capture_pos = f"{capture_file}{rank + direction}"
				
				if capture_pos in board and board[capture_pos] is not None:
					piece = board[capture_pos]
					if piece.color != self.color:
						moves.append(capture_pos)
				
				if capture_pos + "_enpassant" in board:
					moves.append(capture_pos)
		
		return moves

class Rook(ChessPiece):
	def get_possible_moves(self, board):
		moves = []
		file, rank = self.position[0], int(self.position[1])
		files = "abcdefgh"
		file_idx = files.index(file)
		
		for f_idx in range(8):
			if f_idx == file_idx:
				continue
			
			target_pos = f"{files[f_idx]}{rank}"
			if target_pos in board:
				min_idx, max_idx = min(file_idx, f_idx), max(file_idx, f_idx)
				blocked = False
				
				for i in range(min_idx + 1, max_idx):
					if board[f"{files[i]}{rank}"] is not None:
						blocked = True
						break
				
				if not blocked:
					if board[target_pos] is None or board[target_pos].color != self.color:
						moves.append(target_pos)
		
		for r in range(1, 9):
			if r == rank:
				continue
			
			target_pos = f"{file}{r}"
			if target_pos in board:
				min_r, max_r = min(rank, r), max(rank, r)
				blocked = False
				
				for i in range(min_r + 1, max_r):
					if board[f"{file}{i}"] is not None:
						blocked = True
						break
				
				if not blocked:
					if board[target_pos] is None or board[target_pos].color != self.color:
						moves.append(target_pos)
		
		return moves

class Knight(ChessPiece):
	def get_possible_moves(self, board):
		moves = []
		file, rank = self.position[0], int(self.position[1])
		files = "abcdefgh"
		file_idx = files.index(file)
		
		knight_moves = [
			(2, 1), (2, -1), (-2, 1), (-2, -1),
			(1, 2), (1, -2), (-1, 2), (-1, -2)
		]
		
		for file_offset, rank_offset in knight_moves:
			new_file_idx = file_idx + file_offset
			new_rank = rank + rank_offset
			
			if 0 <= new_file_idx < 8 and 1 <= new_rank <= 8:
				new_file = files[new_file_idx]
				target_pos = f"{new_file}{new_rank}"
				
				if target_pos in board:
					if board[target_pos] is None or board[target_pos].color != self.color:
						moves.append(target_pos)
		
		return moves

class Bishop(ChessPiece):
	def get_possible_moves(self, board):
		moves = []
		file, rank = self.position[0], int(self.position[1])
		files = "abcdefgh"
		file_idx = files.index(file)
		
		directions = [(1, 1), (1, -1), (-1, 1), (-1, -1)]
		
		for file_dir, rank_dir in directions:
			for step in range(1, 8):
				new_file_idx = file_idx + (file_dir * step)
				new_rank = rank + (rank_dir * step)
				
				if 0 <= new_file_idx < 8 and 1 <= new_rank <= 8:
					new_file = files[new_file_idx]
					target_pos = f"{new_file}{new_rank}"
					
					if target_pos in board:
						if board[target_pos] is None:
							moves.append(target_pos)
						else:
							if board[target_pos].color != self.color:
								moves.append(target_pos)
							break
					else:
						break
				else:
					break
		
		return moves

class Queen(ChessPiece):
	def get_possible_moves(self, board):
		rook = Rook(self.color, self.position, self.piece_id)
		bishop = Bishop(self.color, self.position, self.piece_id)
		
		return rook.get_possible_moves(board) + bishop.get_possible_moves(board)

class King(ChessPiece):
	def get_possible_moves(self, board):
		from .utils import is_position_under_attack, is_in_check
		moves = []
		file, rank = self.position[0], int(self.position[1])
		files = "abcdefgh"
		file_idx = files.index(file)
		
		directions = [
			(0, 1), (1, 1), (1, 0), (1, -1),
			(0, -1), (-1, -1), (-1, 0), (-1, 1)
		]
		
		for file_dir, rank_dir in directions:
			new_file_idx = file_idx + file_dir
			new_rank = rank + rank_dir
			
			if 0 <= new_file_idx < 8 and 1 <= new_rank <= 8:
				new_file = files[new_file_idx]
				target_pos = f"{new_file}{new_rank}"
				
				if target_pos in board:
					if board[target_pos] is None or board[target_pos].color != self.color:
						test_board = copy.deepcopy(board)
						test_board[target_pos] = self
						test_board[self.position] = None
						
						if not is_position_under_attack(test_board, target_pos, self.color):
							moves.append(target_pos)
		
		if not self.has_moved and not is_in_check(board, self.color):
			king_side_castling = True
			
			if self.color == 'white':
				for f in ['f', 'g']:
					if board[f"${f}1"] is not None or is_position_under_attack(board, f"${f}1", 'white'):
						king_side_castling = False
						break
				
				rook_pos = "h1"
				if (board[rook_pos] is None or 
					not isinstance(board[rook_pos], Rook) or 
					board[rook_pos].has_moved):
					king_side_castling = False
			else:
				for f in ['f', 'g']:
					if board[f"${f}8"] is not None or is_position_under_attack(board, f"${f}8", 'black'):
						king_side_castling = False
						break
				
				rook_pos = "h8"
				if (board[rook_pos] is None or 
					not isinstance(board[rook_pos], Rook) or 
					board[rook_pos].has_moved):
					king_side_castling = False
			
			if king_side_castling:
				moves.append("O-O")
			
			queen_side_castling = True
			
			if self.color == 'white':
				for f in ['b', 'c', 'd']:
					if board[f"${f}1"] is not None or is_position_under_attack(board, f"${f}1", 'white'):
						queen_side_castling = False
						break
				
				rook_pos = "a1"
				if (board[rook_pos] is None or 
					not isinstance(board[rook_pos], Rook) or 
					board[rook_pos].has_moved):
					queen_side_castling = False
			else:
				for f in ['b', 'c', 'd']:
					if board[f"${f}8"] is not None or is_position_under_attack(board, f"${f}8", 'black'):
						queen_side_castling = False
						break
				
				rook_pos = "a8"
				if (board[rook_pos] is None or 
					not isinstance(board[rook_pos], Rook) or 
					board[rook_pos].has_moved):
					queen_side_castling = False
			
			if queen_side_castling:
				moves.append("O-O-O")
		
		return moves
