from .modes import ClassicChess, HordeChess, Chess960

import logging
logger = logging.getLogger('chess_game')
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class ChessLogic:
    def __init__(self, game_mode: str = 'classic'):
        self.mode_handlers = {
            'classic': ClassicChess(),
            'horde': HordeChess(),
            '960': Chess960(),
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
        self.move_history.clear()
        self.state = 'PLAYING'
        self.promotion_position = None
        return self.board

    def make_move(self, from_pos: str, to_pos: str, player_color: str, promotion_choice: str = None):
        if self.state == 'GAME_OVER':
            return False, "Game is already over", self.board, {}
            
        # Si hay una promoción pendiente, no se permiten otros movimientos
        if self.state == 'PROMOTION_PENDING' and not promotion_choice:
            return False, "You must choose a piece for promotion first", self.board, {
                'promotion_pending': True,
                'promotion_position': self.promotion_position
            }

        # Validar turno del jugador
        if player_color != self.current_player:
            return False, "Not your turn", self.board, {}

        # Validar el movimiento mediante el game_mode
        success, message, new_board, info = self.game_mode.validate_move(
            self.board, from_pos, to_pos, player_color, promotion_choice
        )
        logger.debug(f"on make_move, info {info}")
        if not success:
            return False, message, self.board, {}

        self.board = new_board

        # Manejo de promoción pendiente
        if info.get('promotion_pending', True):
            logger.debug(f"HOLI QUÉ TAL")
            self.state = 'PROMOTION_PENDING'
            self.promotion_position = to_pos
            return True, "Choose a piece for promotion (queen, rook, bishop, knight)", self.board, {
                'promotion_pending': True,
                'promotion_position': to_pos
            }

        self._complete_move(from_pos, to_pos, player_color, info)
        game_state, winner = self._check_game_status()

        result = {
            'success': True,
            'message': message,
            'game_over': game_state is not None,
            'winner': winner,
            'game_state': game_state,
            'info': info
        }
        return True, message, self.board, result

    def handle_promotion(self, promotion_choice: str):
        """
        Maneja la elección de promoción cuando un peón alcanza la última fila.
        """
        if self.state != 'PROMOTION_PENDING' or not self.promotion_position:
            return False, "No promotion pending", self.board, {}

        if promotion_choice not in ['queen', 'rook', 'bishop', 'knight']:
            return False, (
                "Invalid promotion choice. Choose queen, rook, bishop, or knight"
            ), self.board, {
                'promotion_pending': True,
                'promotion_position': self.promotion_position
            }

        new_board, info = self.game_mode.complete_promotion(
            self.board, self.promotion_position, promotion_choice
        )
        if 'error' in info:
            return False, info['error'], self.board, {
                'promotion_pending': True,
                'promotion_position': self.promotion_position
            }

        # Buscar el último movimiento que culmina en la posición de promoción
        from_pos = next(
            (move['from'] for move in reversed(self.move_history) if move['to'] == self.promotion_position),
            self.promotion_position
        )

        self.board = new_board
        # Se registra el movimiento con la promoción completada
        self._complete_move(from_pos, self.promotion_position, self.current_player, {
            **info,
            'promotion': promotion_choice
        })
        game_state, winner = self._check_game_status()
        result = {
            'success': True,
            'message': f"Pawn promoted to {promotion_choice}",
            'game_over': game_state is not None,
            'winner': winner,
            'game_state': game_state,
            'info': info
        }
        return True, result['message'], self.board, result

    def _complete_move(self, from_pos: str, to_pos: str, player_color: str, info: dict):
        self.move_history.append({
            'from': from_pos,
            'to': to_pos,
            'player': player_color,
            'info': info
        })
        self.current_player = 'black' if player_color == 'white' else 'white'
        self.state = 'PLAYING'
        self.promotion_position = None

    def _check_game_status(self):
        game_state, winner = self.game_mode.check_game_over(self.board, self.current_player)
        if game_state is not None:
            self.state = 'GAME_OVER'
        return game_state, winner

    def get_possible_moves(self, position: str):
        if position not in self.board or self.board[position] is None:
            return []
        return self.board[position].get_possible_moves(self.board)

    def get_all_possible_moves(self, player_color: str):
        moves = {
            pos: self.get_possible_moves(pos)
            for pos, piece in self.board.items()
            if piece is not None and piece.color == player_color and self.get_possible_moves(pos)
        }
        return moves

    def load_board_from_serialized(self, serialized_board: dict):
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

            if piece and hasattr(piece, 'has_moved'):
                piece.has_moved = piece_data.get('has_moved', False)
            if piece_type == 'pawn':
                piece.en_passant_vulnerable = piece_data.get('en_passant_vulnerable', False)
            if piece_type == 'king':
                piece.castling_rights = piece_data.get('castling_rights', None)

            reconstructed_board[position] = piece

        self.board = reconstructed_board
        return self.board

    def get_board(self):
        return self.board

    def set_current_player(self, player_color: str):
        if player_color in ['white', 'black']:
            self.current_player = player_color

    def load_move_history(self, history: list):
        self.initialize_game()
        self.move_history.clear()
        for move in history:
            from_pos = move.get('from')
            to_pos = move.get('to')
            player_color = move.get('player')
            if from_pos and to_pos and player_color:
                success, _, _, _ = self.make_move(from_pos, to_pos, player_color)
                if not success:
                    break
        return self.board

    def get_game_state(self):
        return {
            'state': self.state,
            'current_player': self.current_player,
            'promotion_pending': (self.state == 'PROMOTION_PENDING'),
            'promotion_position': self.promotion_position
        }
