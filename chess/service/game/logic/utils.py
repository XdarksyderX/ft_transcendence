import copy

# Constant for board files
FILES = "abcdefgh"

def is_position_under_attack(board, position, color, depth=0, memo=None):

    if depth > 3:
        return False

    if memo is None:
        memo = {}

    key = (position, color, depth, 'under_attack')
    if key in memo:
        return memo[key]

    opponent_color = 'black' if color == 'white' else 'white'
    memo[key] = False

    for pos, piece in board.items():
        if piece is None or piece.color != opponent_color:
            continue

        piece_type = piece.__class__.__name__

        if piece_type == 'King':
            file = piece.position[0]
            rank = int(piece.position[1])
            file_idx = FILES.index(file)
            directions = [
                (0, 1), (1, 1), (1, 0), (1, -1),
                (0, -1), (-1, -1), (-1, 0), (-1, 1)
            ]
            for dx, dy in directions:
                new_idx = file_idx + dx
                new_rank = rank + dy
                if 0 <= new_idx < 8 and 1 <= new_rank <= 8:
                    target_pos = f"{FILES[new_idx]}{new_rank}"
                    if target_pos == position:
                        memo[key] = True
                        return True

        elif piece_type == 'Pawn':
            file = piece.position[0]
            rank = int(piece.position[1])
            direction = 1 if piece.color == 'white' else -1
            file_idx = FILES.index(file)
            for offset in (-1, 1):
                new_idx = file_idx + offset
                if 0 <= new_idx < 8:
                    attack_pos = f"{FILES[new_idx]}{rank + direction}"
                    if attack_pos == position:
                        memo[key] = True
                        return True

        else:
            if hasattr(piece, 'get_attack_squares'):
                possible_attacks = piece.get_attack_squares(board)
            else:
                try:
                    possible_attacks = piece.get_possible_moves(board)
                except TypeError:
                    possible_attacks = piece.get_possible_moves(board)

            if position in possible_attacks:
                memo[key] = True
                return True

    memo[key] = False
    return False


def is_in_check(board, color, depth=0, memo=None):

    if depth > 3:
        return False

    if memo is None:
        memo = {}

    key = ('in_check', color, depth)
    if key in memo:
        return memo[key]

    king_position = None
    for pos, piece in board.items():
        if piece is not None and piece.color == color and piece.__class__.__name__ == 'King':
            king_position = pos
            break

    if not king_position:
        memo[key] = False
        return False

    result = is_position_under_attack(board, king_position, color, depth=depth+1, memo=memo)
    memo[key] = result
    return result


def is_checkmate(board, color, depth=0, memo=None):

    if depth > 10:
        return False

    if memo is None:
        memo = {}

    key = ('checkmate', color, depth)
    if key in memo:
        return memo[key]

    if not is_in_check(board, color, depth=depth+1, memo=memo):
        memo[key] = False
        return False

    for pos, piece in board.items():
        if piece is not None and piece.color == color:
            try:
                moves = piece.get_legal_moves(board)
                if moves: 
                    memo[key] = False
                    return False
            except (RecursionError, Exception):
                memo[key] = False
                return False

    memo[key] = True
    return True


def is_stalemate(board, color, depth=0, memo=None):

    if depth > 3:
        return False

    if memo is None:
        memo = {}

    key = ('stalemate', color, depth)
    if key in memo:
        return memo[key]

    if is_in_check(board, color, depth=depth+1, memo=memo):
        memo[key] = False
        return False

    for pos, piece in board.items():
        if piece is not None and piece.color == color:
            try:
                moves = piece.get_possible_moves(board)
                if moves:
                    memo[key] = False
                    return False
            except (RecursionError, Exception):
                memo[key] = False
                return False

    memo[key] = True
    return True


def is_insufficient_material(board):

    pieces = [piece for piece in board.values() if piece is not None]
    king_count = 0
    knight_count = 0
    bishop_count = 0
    white_bishop_squares = 0
    black_bishop_squares = 0
    other_pieces = 0

    for piece in pieces:
        piece_type = piece.__class__.__name__
        if piece_type == 'King':
            king_count += 1
        elif piece_type == 'Knight':
            knight_count += 1
        elif piece_type == 'Bishop':
            bishop_count += 1
            file = piece.position[0]
            rank = int(piece.position[1])
            file_idx = FILES.index(file)
            if (file_idx + rank) % 2 == 0:
                white_bishop_squares += 1
            else:
                black_bishop_squares += 1
        else:
            other_pieces += 1

    if other_pieces > 0:
        return False

    if king_count == 2 and knight_count == 0 and bishop_count == 0:
        return True

    if king_count == 2 and ((knight_count == 1 and bishop_count == 0) or (knight_count == 0 and bishop_count == 1)):
        return True

    if king_count == 2 and knight_count == 0 and bishop_count > 0:
        if white_bishop_squares == 0 or black_bishop_squares == 0:
            return True

    return False


def is_threefold_repetition(game_history):

    position_counts = {}
    for fen in game_history:
        position = fen.split(' ')[0]
        position_counts[position] = position_counts.get(position, 0) + 1
        if position_counts[position] >= 3:
            return True
    return False


def is_fifty_move_rule(halfmove_clock):

    return halfmove_clock >= 100 


def get_promotion_options(piece):

    return ["Q", "R", "B", "N"]


def can_claim_draw(board, color, halfmove_clock, game_history):

    if is_fifty_move_rule(halfmove_clock):
        return True

    if is_threefold_repetition(game_history):
        return True

    if is_insufficient_material(board):
        return True

    return False