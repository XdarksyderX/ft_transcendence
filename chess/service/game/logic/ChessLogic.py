from .modes import ClassicChess

class ChessLogic:
    def __init__(self, game_mode='classic'):
        self.mode_handlers = {
            'classic': ClassicChess(),
        }
        self.game_mode = self.mode_handlers.get(game_mode, ClassicChess())
        self.board = None
        self.current_player = 'white'
        self.move_history = []
        self.state = 'PLAYING'
        self.promotion_position = None
        
    def initialize_game(self):
        self.board = self.game_mode.initialize_board()
        self.current_player = 'white'
        self.move_history = []
        self.state = 'PLAYING'
        self.promotion_position = None
        return self.board

    def make_move(self, from_pos, to_pos, player_color, promotion_choice=None):
        if self.state == 'GAME_OVER':
            return False, "Game is already over", self.board, {}
            
        # Si hay una promoción pendiente, rechazar otros movimientos
        if self.state == 'PROMOTION_PENDING' and not promotion_choice:
            return False, "You must choose a piece for promotion first", self.board, {
                'promotion_pending': True,
                'promotion_position': self.promotion_position
            }
            
        # Verificar si es el turno del jugador
        if player_color != self.current_player:
            return False, "Not your turn", self.board, {}

        # Validar el movimiento
        success, message, new_board, info = self.game_mode.validate_move(
            self.board, from_pos, to_pos, player_color, promotion_choice
        )

        if not success:
            return False, message, self.board, {}

        # Actualizar el tablero
        self.board = new_board
        
        # Verificar si hay una promoción pendiente
        if info.get('promotion_pending', False):
            self.state = 'PROMOTION_PENDING'
            self.promotion_position = to_pos
            # No registrar el movimiento ni cambiar el turno aún
            return True, "Choose a piece for promotion (queen, rook, bishop, knight)", self.board, {
                'promotion_pending': True,
                'promotion_position': to_pos
            }
            
        # Si no hay promoción pendiente, completar el movimiento normalmente
        self._complete_move(from_pos, to_pos, player_color, info)
        
        # Verificar fin del juego
        game_state, winner = self._check_game_status()
        
        # Construir el resultado
        result = {
            'success': True,
            'message': message,
            'game_over': game_state is not None,
            'winner': winner,
            'game_state': game_state,
            'info': info
        }

        return True, message, self.board, result
        
    def handle_promotion(self, promotion_choice):
        """
        Maneja la elección de promoción cuando un peón llega a la última fila
        
        Args:
            promotion_choice: El tipo de pieza elegida ('queen', 'rook', 'bishop', 'knight')
            
        Returns:
            (success, message, board, result): Resultado de la operación
        """
        if self.state != 'PROMOTION_PENDING':
            return False, "No promotion pending", self.board, {}
            
        if not self.promotion_position:
            return False, "No promotion position", self.board, {}
            
        # Validar la elección
        if promotion_choice not in ['queen', 'rook', 'bishop', 'knight']:
            return False, "Invalid promotion choice. Choose queen, rook, bishop, or knight", self.board, {
                'promotion_pending': True,
                'promotion_position': self.promotion_position
            }
            
        # Completar la promoción
        new_board, info = self.game_mode.complete_promotion(
            self.board, self.promotion_position, promotion_choice
        )
        
        if 'error' in info:
            return False, info['error'], self.board, {
                'promotion_pending': True,
                'promotion_position': self.promotion_position
            }
            
        # Buscar el último movimiento registrado (si existe)
        from_pos = None
        for move in reversed(self.move_history):
            if move['to'] == self.promotion_position:
                from_pos = move['from']
                break
                
        if not from_pos:
            # Si no encontramos el movimiento original, usamos el mismo lugar
            from_pos = self.promotion_position
            
        # Actualizar el tablero
        self.board = new_board
        
        # Registrar el movimiento completo
        self._complete_move(from_pos, self.promotion_position, self.current_player, {
            **info,
            'promotion': promotion_choice
        })
        
        # Verificar fin del juego
        game_state, winner = self._check_game_status()
        
        # Construir el resultado
        result = {
            'success': True,
            'message': f"Pawn promoted to {promotion_choice}",
            'game_over': game_state is not None,
            'winner': winner,
            'game_state': game_state,
            'info': info
        }
        
        return True, result['message'], self.board, result
        
    def _complete_move(self, from_pos, to_pos, player_color, info):
        """Completa un movimiento registrándolo y cambiando el turno"""
        # Registrar el movimiento
        self.move_history.append({
            'from': from_pos,
            'to': to_pos,
            'player': player_color,
            'info': info
        })
        
        # Cambiar el turno
        self.current_player = 'black' if player_color == 'white' else 'white'
        
        # Resetear el estado de promoción pendiente
        self.state = 'PLAYING'
        self.promotion_position = None
        
    def _check_game_status(self):
        """Verifica si el juego ha terminado y retorna el estado y ganador"""
        # Verificar fin del juego según las reglas del modo
        game_state, winner = self.game_mode.check_game_over(self.board, self.current_player)
        
        # Verificar si faltan reyes
        king_missing, king_winner = self._check_kings_present()
        if king_missing:
            game_state = "checkmate"
            winner = king_winner
            
        # Actualizar el estado del juego
        if game_state is not None:
            self.state = 'GAME_OVER'
            
        return game_state, winner

    def _check_kings_present(self):
        white_king_present = False
        black_king_present = False
        for _, piece in self.board.items():
            if piece is not None and piece.__class__.__name__ == 'King':
                if piece.color == 'white':
                    white_king_present = True
                else:
                    black_king_present = True
                if white_king_present and black_king_present:
                    break

        if not white_king_present:
            return True, 'black'
        elif not black_king_present:
            return True, 'white'
        else:
            return False, None

    def get_possible_moves(self, position):
        if position not in self.board or self.board[position] is None:
            return []
        piece = self.board[position]
        return piece.get_possible_moves(self.board)

    def get_all_possible_moves(self, player_color):
        moves = {}
        for pos, piece in self.board.items():
            if piece is not None and piece.color == player_color:
                possible_moves = self.get_possible_moves(pos)
                if possible_moves:
                    moves[pos] = possible_moves
        return moves

    def load_board_from_serialized(self, serialized_board):
        if not serialized_board:
            self.initialize_game()
            return self.board

        reconstructed_board = {}
        for position, piece_data in serialized_board.items():
            if piece_data is None:
                reconstructed_board[position] = None
                continue
            piece_type = piece_data.get('type')
            color = piece_data.get('color')
            piece = self.game_mode.create_piece(piece_type, color)
            if 'has_moved' in piece_data and hasattr(piece, 'has_moved'):
                piece.has_moved = piece_data['has_moved']
            if piece_type == 'pawn' and 'en_passant_vulnerable' in piece_data:
                piece.en_passant_vulnerable = piece_data['en_passant_vulnerable']
            if piece_type == 'king' and 'castling_rights' in piece_data:
                piece.castling_rights = piece_data['castling_rights']
            reconstructed_board[position] = piece
        self.board = reconstructed_board
        return self.board

    def get_board(self):
        return self.board

    def set_current_player(self, player_color):
        if player_color in ['white', 'black']:
            self.current_player = player_color

    def load_move_history(self, history):
        self.initialize_game()
        self.move_history = []
        for move in history:
            from_pos = move.get('from')
            to_pos = move.get('to')
            player_color = move.get('player')
            if from_pos and to_pos and player_color:
                success, _, _, _ = self.make_move(from_pos, to_pos, player_color)
                if not success:
                    # Si algún movimiento falla, detener la reconstrucción
                    break
        return self.board

    def get_game_state(self):
        """Retorna el estado actual del juego"""
        return {
            'state': self.state,
            'current_player': self.current_player,
            'promotion_pending': self.state == 'PROMOTION_PENDING',
            'promotion_position': self.promotion_position
        }