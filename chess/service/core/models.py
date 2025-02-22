from django.db import models

import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    friends = models.ManyToManyField('self', symmetrical=True, blank=True)
    chess_statistics = models.OneToOneField(
        'ChessStatistics',
        on_delete=models.CASCADE,
        related_name='user_stats',
        null=True,
        blank=True
    )
    
    @property
    def games(self):
        """
        Retorna un queryset con todos los juegos en los que el usuario participa,
        ya sea jugando de blancas o negras.
        """
        return self.games_as_white.all() | self.games_as_black.all()
    
    def __str__(self):
        return self.username


class ChessGame(models.Model):
    """
    Modelo que representa una partida de ajedrez.
    """
    GAME_MODES = [
        ('classic', 'Classic'),
        ('horde', 'Horde'),
        ('kirby', 'Kirby'),
        ('the_bomb', 'The Bomb'),
        ('960', 'Chess 960'),
    ]
    
    # Jugadores diferenciados por color
    player_white = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='games_as_white'
    )
    player_black = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='games_as_black'
    )
    winner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='won_chess_games'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('in_progress', 'In Progress'),
            ('finished', 'Finished')
        ],
        default='pending'
    )
    available = models.BooleanField(default=False)
    game_key = models.UUIDField(default=uuid.uuid4, unique=True)
    connected_players = models.JSONField(default=list)
    ready_players = models.JSONField(default=list)
    
    # Modo de juego: classic, horde, kirby, the_bomb o 960.
    game_mode = models.CharField(
        max_length=20,
        choices=GAME_MODES,
        default='classic'
    )
    
    # Historial del tablero: array de snapshots.
    # Cada elemento es un diccionario en el que la clave es la casilla (ej. "e4")
    # y el valor es el nombre de la ficha en inglés, con numeración en caso de repetirse.
    # Ejemplo: { "a1": "rook1", "b1": "knight1", ... , "e4": None, ... }
    board_history = models.JSONField(
        default=list,
        help_text="Array de snapshots del tablero. Cada snapshot es un dict con la posición y el nombre de la ficha (con numeración si es necesario)."
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def add_board_state(self, board_state):
        """
        Agrega una instantánea del estado del tablero al historial.
        
        :param board_state: Diccionario que representa el estado del tablero.
            Ejemplo:
            {
                "a1": "rook1", "b1": "knight1", "c1": "bishop1", "d1": "queen",
                "e1": "king", "f1": "bishop2", "g1": "knight2", "h1": "rook2",
                "a2": "pawn1", "b2": "pawn2", ..., "h2": "pawn8",
                ...
                "e4": None  # Casilla vacía
            }
        """
        history = self.board_history
        history.append(board_state)
        self.board_history = history
        self.save()
    
    def initial_board_state(self):
        """
        Retorna el estado inicial del tablero para el modo clásico, usando el nombre en inglés
        de cada ficha y numerando aquellas que se repiten.
        
        Para las blancas:
          - Primera fila: rook1, knight1, bishop1, queen, king, bishop2, knight2, rook2.
          - Segunda fila: pawn1 a pawn8.
        Para las negras:
          - Octava fila: rook1, knight1, bishop1, queen, king, bishop2, knight2, rook2.
          - Séptima fila: pawn1 a pawn8.
        Las casillas centrales se inicializan en None.
        """
        board = {}
        # Filas de blancas
        board.update({
            "a1": "rook1", "b1": "knight1", "c1": "bishop1", "d1": "queen",
            "e1": "king", "f1": "bishop2", "g1": "knight2", "h1": "rook2",
        })
        board.update({f"{file}2": f"pawn{idx}" for idx, file in enumerate("abcdefgh", start=1)})
        
        # Filas de negras
        board.update({
            "a8": "rook1", "b8": "knight1", "c8": "bishop1", "d8": "queen",
            "e8": "king", "f8": "bishop2", "g8": "knight2", "h8": "rook2",
        })
        board.update({f"{file}7": f"pawn{idx}" for idx, file in enumerate("abcdefgh", start=1)})
        
        # Casillas vacías en el centro (filas 3 a 6)
        for rank in range(3, 7):
            for file in "abcdefgh":
                board[f"{file}{rank}"] = None
        return board
    
    def __str__(self):
        return f"ChessGame {self.id}: {self.player_white} vs {self.player_black} (Key: {self.game_key})"


class ChessStatistics(models.Model):
    """
    Modelo para almacenar estadísticas agregadas del usuario en ajedrez.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chess_statistics_entries'
    )
    games_played = models.IntegerField(default=0)
    games_won = models.IntegerField(default=0)
    games_lost = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    highest_rating = models.IntegerField(default=1200)  # Rating inicial
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def update_statistics(self, outcome, new_rating=None):
        """
        Actualiza las estadísticas del usuario luego de una partida.
        
        :param outcome: 'won', 'lost' o 'draw'
        :param new_rating: Nuevo rating tras la partida, si se desea actualizar el rating más alto.
        """
        self.games_played += 1
        if outcome == 'won':
            self.games_won += 1
        elif outcome == 'lost':
            self.games_lost += 1
        elif outcome == 'draw':
            self.draws += 1
        
        if new_rating is not None and new_rating > self.highest_rating:
            self.highest_rating = new_rating
        self.save()
    
    def __str__(self):
        return f"Chess Statistics for {self.user.username}: {self.games_played} games played"

class PendingInvitation(models.Model):
    """
    Represents a pending invitation to a Pong game.
    """
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_pending_invitations'
    )
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_pending_invitations'
    )
    token = models.CharField(max_length=255, unique=True)
    game = models.ForeignKey(
        ChessGame,
        on_delete=models.CASCADE,
        related_name='pending_invitations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"PendingInvitation {self.token} from {self.sender} to {self.receiver} for game {self.game.id}"

class OutgoingEvent(models.Model):
    """
    Model to record outgoing events.
    """
    event_id = models.UUIDField(primary_key=True)
    event_type = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    data = models.JSONField()


class IncomingEvent(models.Model):
    """
    Model to record incoming events.
    """
    event_id = models.UUIDField(primary_key=True)
    event_type = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
