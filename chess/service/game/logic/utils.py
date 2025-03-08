def is_position_under_attack(board, position, color, depth=0, memo=None):
    """
    Verifica si una posición está bajo ataque por piezas del color opuesto.
    
    Args:
        board: El tablero actual
        position: La posición a verificar
        color: El color de la pieza en la posición
        depth: Control de profundidad para evitar recursión infinita
        memo: Diccionario para memoización
    
    Returns:
        True si la posición está bajo ataque, False en caso contrario
    """
    # Límite de profundidad para detener recursión
    if depth > 3:
        return False
    
    # Inicializar memoización
    if memo is None:
        memo = {}
    
    # Clave para memoización
    key = (position, color, depth, 'under_attack')
    if key in memo:
        return memo[key]
    
    opponent_color = 'black' if color == 'white' else 'white'
    
    # Para evitar recursión infinita, almacenar resultado temporal
    memo[key] = False
    
    for pos, piece in board.items():
        if piece is not None and piece.color == opponent_color:
            # Verificar el tipo sin usar isinstance para evitar problemas de importación circular
            piece_type = piece.__class__.__name__
            
            # Manejo especial para el Rey para evitar recursión
            if piece_type == 'King':
                # Movimientos simplificados del rey (sin verificar jaque)
                file, rank = piece.position[0], int(piece.position[1])
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
                            if board[target_pos] is None or board[target_pos].color != piece.color:
                                if target_pos == position:
                                    memo[key] = True
                                    return True
            else:
                # Para otras piezas, podemos usar movimientos simplificados o pseudolegales
                if hasattr(piece, 'get_attack_squares'):
                    # Método que devuelve casillas atacadas sin verificar jaque
                    possible_moves = piece.get_attack_squares(board)
                else:
                    # Fallback - usar movimientos normales pero incrementar la profundidad
                    try:
                        # Almacenar el memo actual temporalmente
                        temp_memo = dict(memo)
                        possible_moves = piece.get_possible_moves(board, depth=depth+1, memo=memo)
                        # Restaurar memo si ocurre un error
                        memo.update(temp_memo)
                    except RecursionError:
                        # Si ocurre recursión, ignorar esta pieza
                        continue
                    except Exception:
                        # Si ocurre cualquier otro error, ignorar esta pieza
                        continue
                
                if position in possible_moves:
                    memo[key] = True
                    return True
    
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
    if depth > 3:  # Límite de profundidad
        return False
        
    if memo is None:
        memo = {}
    
    key = ('in_check', color, depth)
    if key in memo:
        return memo[key]
    
    # Encontrar la posición del rey
    king_position = None
    for pos, piece in board.items():
        if piece is not None and piece.color == color and piece.__class__.__name__ == 'King':
            king_position = pos
            break
    
    if not king_position:
        memo[key] = False
        return False
    
    # Verificar si el rey está bajo ataque
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
    if depth > 3:  # Límite de profundidad
        return False
        
    if memo is None:
        memo = {}
    
    key = ('checkmate', color, depth)
    if key in memo:
        return memo[key]
    
    # Si no está en jaque, no puede ser jaque mate
    if not is_in_check(board, color, depth=depth+1, memo=memo):
        memo[key] = False
        return False
    
    # Verificar si hay algún movimiento legal que saque del jaque
    for pos, piece in board.items():
        if piece is not None and piece.color == color:
            try:
                possible_moves = piece.get_possible_moves(board, depth=depth+1, memo=memo)
                
                if possible_moves:  # Si hay al menos un movimiento legal
                    memo[key] = False
                    return False
            except (RecursionError, Exception):
                # Si hay un error al obtener los movimientos, asumimos que no es jaque mate
                # para ser conservadores
                memo[key] = False
                return False
    
    # Si no hay movimientos legales y está en jaque, es jaque mate
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
    if depth > 3:  # Límite de profundidad
        return False
        
    if memo is None:
        memo = {}
    
    key = ('stalemate', color, depth)
    if key in memo:
        return memo[key]
    
    # Si está en jaque, no puede ser tablas por ahogado
    if is_in_check(board, color, depth=depth+1, memo=memo):
        memo[key] = False
        return False
    
    # Verificar si hay algún movimiento legal
    for pos, piece in board.items():
        if piece is not None and piece.color == color:
            try:
                possible_moves = piece.get_possible_moves(board, depth=depth+1, memo=memo)
                
                if possible_moves:  # Si hay al menos un movimiento legal
                    memo[key] = False
                    return False
            except (RecursionError, Exception):
                # Si hay un error al obtener los movimientos, asumimos que no es ahogado
                memo[key] = False
                return False
    
    # Si no hay movimientos legales y no está en jaque, es tablas por ahogado
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
    
    # Contar piezas por tipo
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
            
            # Determinar color de casilla del alfil
            file, rank = piece.position[0], int(piece.position[1])
            file_idx = "abcdefgh".index(file)
            
            if (file_idx + rank) % 2 == 0:
                white_bishop_squares += 1
            else:
                black_bishop_squares += 1
        else:
            other_pieces += 1
    
    # Si hay piezas que no son rey, caballo o alfil, hay suficiente material
    if other_pieces > 0:
        return False
    
    # Solo reyes
    if king_count == 2 and knight_count == 0 and bishop_count == 0:
        return True
    
    # Rey contra rey y caballo o rey y alfil
    if king_count == 2 and (
        (knight_count == 1 and bishop_count == 0) or
        (knight_count == 0 and bishop_count == 1)
    ):
        return True
    
    # Solo alfiles del mismo color
    if king_count == 2 and knight_count == 0 and bishop_count > 0:
        if white_bishop_squares == 0 or black_bishop_squares == 0:
            return True
    
    return False

def is_threefold_repetition(game_history):
    """
    Verifica si hay repetición de posición tres veces.
    
    Args:
        game_history: Lista de posiciones FEN en la partida
    
    Returns:
        True si hay repetición triple, False en caso contrario
    """
    # Simplificamos el FEN para considerar solo la posición de las piezas
    position_counts = {}
    
    for fen in game_history:
        # Tomar solo la parte de la posición del FEN (antes del primer espacio)
        position = fen.split(' ')[0]
        
        if position in position_counts:
            position_counts[position] += 1
            if position_counts[position] >= 3:
                return True
        else:
            position_counts[position] = 1
    
    return False

def is_fifty_move_rule(halfmove_clock):
    """
    Verifica si se aplica la regla de 50 movimientos sin capturas ni movimientos de peón.
    
    Args:
        halfmove_clock: Contador de medios movimientos sin capturas ni movimientos de peón
    
    Returns:
        True si se han alcanzado 50 movimientos (100 halfmoves), False en caso contrario
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
    return ["Q", "R", "B", "N"]  # Reina, Torre, Alfil, Caballo

def can_claim_draw(board, color, halfmove_clock, game_history):
    """
    Verifica si un jugador puede reclamar tablas por alguna regla.
    
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
