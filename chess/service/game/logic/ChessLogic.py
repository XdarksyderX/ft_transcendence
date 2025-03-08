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

    def initialize_game(self):
        self.board = self.game_mode.initialize_board()
        self.current_player = 'white'
        self.move_history = []
        return self.board

    def make_move(self, from_pos, to_pos, player_color):
        if player_color != self.current_player:
            return False, "Not your turn", self.board, {}

        success, message, new_board, info = self.game_mode.validate_move(self.board, from_pos, to_pos, player_color)
        if not success:
            return False, message, self.board, {}

        self.board = new_board
        self.move_history.append({
            'from': from_pos,
            'to': to_pos,
            'player': player_color,
            'info': info
        })

        self.current_player = 'black' if player_color == 'white' else 'white'
        game_over, winner = self.game_mode.check_game_over(self.board, self.current_player)
        result = {
            'success': True,
            'message': message,
            'game_over': game_over,
            'winner': winner,
            'info': info
        }

        return True, message, self.board, result

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
        """
        Carga un tablero desde un estado serializado (diccionario JSON)
        
        Args:
            serialized_board (dict): Representación serializada del tablero
            
        Returns:
            dict: El tablero reconstruido con objetos Piece
        """
        if not serialized_board:
            self.initialize_game()
            return self.board
            
        reconstructed_board = {}
        
        for position, piece_data in serialized_board.items():
            if piece_data is None:
                reconstructed_board[position] = None
                continue
                
            # Reconstruir la pieza desde los datos serializados
            piece_type = piece_data.get('type')
            color = piece_data.get('color')
            
            # Recrear la instancia de pieza correcta según su tipo
            piece = self.game_mode.create_piece(piece_type, color)
            
            # Si hay atributos adicionales específicos de la pieza, restaurarlos
            if 'has_moved' in piece_data and hasattr(piece, 'has_moved'):
                piece.has_moved = piece_data['has_moved']
                
            # Para peones en modo clásico
            if piece_type == 'pawn' and 'en_passant_vulnerable' in piece_data:
                piece.en_passant_vulnerable = piece_data['en_passant_vulnerable']
                
            # Para el rey
            if piece_type == 'king' and 'castling_rights' in piece_data:
                piece.castling_rights = piece_data['castling_rights']
                
            reconstructed_board[position] = piece
            
        self.board = reconstructed_board
        return self.board
    
    def get_board(self):
        """
        Retorna el tablero actual
        
        Returns:
            dict: El tablero actual
        """
        return self.board
    
    def set_current_player(self, player_color):
        """
        Establece el jugador actual
        
        Args:
            player_color (str): Color del jugador ('white' o 'black')
        """
        if player_color in ['white', 'black']:
            self.current_player = player_color
    
    def load_move_history(self, history):
        """
        Carga un historial de movimientos y reconstruye el tablero aplicándolos
        
        Args:
            history (list): Lista de diccionarios de movimientos
        """
        self.initialize_game()  # Reinicia el tablero a su estado inicial
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