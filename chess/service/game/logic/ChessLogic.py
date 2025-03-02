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
