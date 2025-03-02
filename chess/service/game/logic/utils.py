from .pieces import King, Bishop, Knight
import copy

def is_position_under_attack(board, position, color):
	opponent_color = 'black' if color == 'white' else 'white'
	
	for pos, piece in board.items():
		if piece is not None and piece.color == opponent_color:
			if position in piece.get_possible_moves(board):
				return True
	
	return False

def is_in_check(board, color):
	king_position = None
	for pos, piece in board.items():
		if piece is not None and piece.color == color and isinstance(piece, King):
			king_position = pos
			break
	
	if king_position is None:
		return False
	
	return is_position_under_attack(board, king_position, color)

def is_checkmate(board, color):
	if not is_in_check(board, color):
		return False
	
	for pos, piece in board.items():
		if piece is not None and piece.color == color:
			possible_moves = piece.get_possible_moves(board)
			
			for move in possible_moves:
				test_board = copy.deepcopy(board)
				test_board[move] = test_board[pos]
				test_board[pos] = None
				
				if not is_in_check(test_board, color):
					return False
	
	return True

def is_stalemate(board, color):
	if is_in_check(board, color):
		return False
	
	for pos, piece in board.items():
		if piece is not None and piece.color == color:
			possible_moves = piece.get_possible_moves(board)
			
			for move in possible_moves:
				test_board = copy.deepcopy(board)
				test_board[move] = test_board[pos]
				test_board[pos] = None
				
				if not is_in_check(test_board, color):
					return False
	
	return True

def is_insufficient_material(board):
	pieces = [piece for piece in board.values() if piece is not None]
	
	if len(pieces) == 2:
		return True
	
	if len(pieces) == 3:
		non_king_pieces = [p for p in pieces if not isinstance(p, King)]
		if len(non_king_pieces) == 1:
			return isinstance(non_king_pieces[0], (Bishop, Knight))
	
	bishops_only = True
	bishop_color = None
	
	for piece in pieces:
		if isinstance(piece, King):
			continue
		if not isinstance(piece, Bishop):
			bishops_only = False
			break
		
		file, rank = piece.position[0], int(piece.position[1])
		file_idx = "abcdefgh".index(file)
		square_color = (file_idx + rank) % 2
		
		if bishop_color is None:
			bishop_color = square_color
		elif bishop_color != square_color:
			return False
	
	return bishops_only
