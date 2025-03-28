import copy

# Constant for board files
FILES = "abcdefgh"

# import logging

# # logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def is_position_under_attack(board, position, color, depth=0, memo=None):
    """
    Verifica si una posición está bajo ataque por piezas del color opuesto.

    Args:
        board: El tablero actual (diccionario de casillas -> pieza o None)
        position: La posición (e.g., "e4") a verificar
        color: El color de la pieza que se encuentra en la posición (para identificar al oponente)
        depth: Control de profundidad para evitar recursión infinita
        memo: Diccionario para memoización

    Returns:
        True si la posición está bajo ataque, False en caso contrario
    """
    # logging.debug(f"Checking if position {position} is under attack by {color} at depth {depth}")

    if depth > 3:
        # logging.debug("Depth limit exceeded, returning False")
        return False

    if memo is None:
        memo = {}

    key = (position, color, depth, 'under_attack')
    if key in memo:
        # logging.debug(f"Memoization hit for key {key}, returning {memo[key]}")
        return memo[key]

    opponent_color = 'black' if color == 'white' else 'white'
    # Inicialmente se asume que la posición no está bajo ataque
    memo[key] = False

    for pos, piece in board.items():
        if piece is None or piece.color != opponent_color:
            continue

        piece_type = piece.__class__.__name__
        logging.debug(f"Checking attacks from {piece_type} at {pos}")

        # Manejo especial para el Rey: se verifican sus casillas adyacentes
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
                        # logging.debug(f"Position {position} is under attack by King at {pos}")
                        memo[key] = True
                        return True

        # Manejo especial para peones: los movimientos de ataque son solo diagonales
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
                        # logging.debug(f"Position {position} is under attack by Pawn at {pos}")
                        memo[key] = True
                        return True

        else:
            # Si la pieza define un método especial para las casillas que ataca, úsalo.
            if hasattr(piece, 'get_attack_squares'):
                possible_attacks = piece.get_attack_squares(board)
            else:
                # Intentar llamar a get_possible_moves sin parámetros extra
                try:
                    possible_attacks = piece.get_possible_moves(board)
                except TypeError:
                    # Si se requiere depth o memo, se ignoran para evitar problemas
                    possible_attacks = piece.get_possible_moves(board)

            if position in possible_attacks:
                # logging.debug(f"Position {position} is under attack by {piece_type} at {pos}")
                memo[key] = True
                return True

    # logging.debug(f"Position {position} is not under attack")
    memo[key] = False
    return False


def is_in_check(board, color, depth=0, memo=None):
    """
    Verifica si el rey del color especificado está en jaque.

    Args:
        board: El tablero actual
        color: El color del rey a verificar
        depth: Control de profundidad para evitar recursión infinita
        memo: Diccionario para memoización

    Returns:
        True si el rey está en jaque, False en caso contrario
    """
    # logging.debug(f"Checking if {color} king is in check at depth {depth}")

    if depth > 3:
        # logging.debug("Depth limit exceeded, returning False")
        return False

    if memo is None:
        memo = {}

    key = ('in_check', color, depth)
    if key in memo:
        # logging.debug(f"Memoization hit for key {key}, returning {memo[key]}")
        return memo[key]

    king_position = None
    for pos, piece in board.items():
        if piece is not None and piece.color == color and piece.__class__.__name__ == 'King':
            king_position = pos
            break

    # Si no se encuentra el rey, asumimos que no está en jaque (otra lógica debería encargarse del fin de partida)
    if not king_position:
        # logging.debug(f"No king found for {color}, assuming not in check")
        memo[key] = False
        return False

    # logging.debug(f"King of {color} found at {king_position}")
    result = is_position_under_attack(board, king_position, color, depth=depth+1, memo=memo)
    memo[key] = result
    return result


def is_checkmate(board, color, depth=0, memo=None):
    """
    Verifica si el rey del color especificado está en jaque mate.

    Args:
        board: El tablero actual
        color: El color del rey a verificar
        depth: Control de profundidad para evitar recursión infinita
        memo: Diccionario para memoización

    Returns:
        True si es jaque mate, False en caso contrario
    """
    # logging.debug(f"Checking checkmate for {color} at depth {depth}")

    if depth > 3:
        # logging.debug("Depth limit exceeded, returning False")
        return False

    if memo is None:
        memo = {}

    key = ('checkmate', color, depth)
    if key in memo:
        # logging.debug(f"Memoization hit for key {key}, returning {memo[key]}")
        return memo[key]

    # Si el rey no está en jaque, no puede ser jaque mate.
    if not is_in_check(board, color, depth=depth+1, memo=memo):
        # logging.debug(f"King of {color} is not in check, returning False")
        memo[key] = False
        return False

    # Buscar si existe algún movimiento legal que saque del jaque.
    for pos, piece in board.items():
        if piece is not None and piece.color == color:
            # logging.debug(f"Checking moves for piece at {pos} ({piece})")
            try:
                moves = piece.get_legal_moves(board)
                if moves:  # Se encontró al menos una jugada legal.
                    # logging.debug(f"Found legal moves for piece at {pos}, returning False")
                    memo[key] = False
                    return False
            except (RecursionError, Exception) as e:
                # logging.debug(f"Exception occurred while getting moves for piece at {pos}: {e}")
                memo[key] = False
                return False

    # logging.debug(f"No legal moves found, {color} is in checkmate")
    memo[key] = True
    return True


def is_stalemate(board, color, depth=0, memo=None):
    """
    Verifica si el jugador del color especificado está en tablas por ahogado.

    Args:
        board: El tablero actual
        color: El color del jugador a verificar
        depth: Control de profundidad para evitar recursión infinita
        memo: Diccionario para memoización

    Returns:
        True si es tablas por ahogado, False en caso contrario
    """
    if depth > 3:
        return False

    if memo is None:
        memo = {}

    key = ('stalemate', color, depth)
    if key in memo:
        return memo[key]

    # Si el jugador está en jaque, no es ahogado.
    if is_in_check(board, color, depth=depth+1, memo=memo):
        memo[key] = False
        return False

    # Verificar que no existan movimientos legales.
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
    """
    Verifica si queda material insuficiente para dar jaque mate.

    Args:
        board: El tablero actual

    Returns:
        True si hay material insuficiente, False en caso contrario
    """
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

    # Si hay piezas distintas de rey, caballo o alfil, hay material suficiente
    if other_pieces > 0:
        return False

    # Sólo los reyes
    if king_count == 2 and knight_count == 0 and bishop_count == 0:
        return True

    # Rey contra rey con un solo caballo o alfil
    if king_count == 2 and ((knight_count == 1 and bishop_count == 0) or (knight_count == 0 and bishop_count == 1)):
        return True

    # Dos alfiles de casillas del mismo color
    if king_count == 2 and knight_count == 0 and bishop_count > 0:
        if white_bishop_squares == 0 or black_bishop_squares == 0:
            return True

    return False


def is_threefold_repetition(game_history):
    """
    Verifica si hay repetición de posición tres veces.

    Args:
        game_history: Lista de cadenas FEN de la partida

    Returns:
        True si hay repetición triple, False en caso contrario
    """
    position_counts = {}
    for fen in game_history:
        # Considera solo la parte de la posición (antes del primer espacio)
        position = fen.split(' ')[0]
        position_counts[position] = position_counts.get(position, 0) + 1
        if position_counts[position] >= 3:
            return True
    return False


def is_fifty_move_rule(halfmove_clock):
    """
    Verifica si se aplica la regla de 50 movimientos sin capturas ni movimientos de peón.

    Args:
        halfmove_clock: Contador de medios movimientos sin captura ni movimiento de peón

    Returns:
        True si se han alcanzado 50 movimientos completos (100 halfmoves), False en caso contrario
    """
    return halfmove_clock >= 100  # 50 movimientos completos = 100 halfmoves


def get_promotion_options(piece):
    """
    Devuelve las opciones de promoción disponibles para un peón.

    Args:
        piece: La pieza (peón) que se va a promover

    Returns:
        Lista de opciones de promoción (normalmente "Q", "R", "B", "N")
    """
    return ["Q", "R", "B", "N"]


def can_claim_draw(board, color, halfmove_clock, game_history):
    """
    Verifica si un jugador puede reclamar tablas bajo alguna regla.

    Args:
        board: El tablero actual
        color: El color del jugador
        halfmove_clock: Contador de medios movimientos
        game_history: Historial de posiciones FEN

    Returns:
        True si se puede reclamar tablas, False en caso contrario
    """
    # Regla de 50 movimientos
    if is_fifty_move_rule(halfmove_clock):
        return True

    # Repetición triple
    if is_threefold_repetition(game_history):
        return True

    # Material insuficiente
    if is_insufficient_material(board):
        return True

    return False
