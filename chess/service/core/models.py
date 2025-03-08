from django.db import models
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    friends = models.ManyToManyField('self', symmetrical=True, blank=True)
    elo_rating = models.IntegerField(default=1200)
    elo_games_played = models.IntegerField(default=0)
    chess_statistics = models.OneToOneField(
        'ChessStatistics',
        on_delete=models.CASCADE,
        related_name='user_stats',
        null=True,
        blank=True
    )
    @property
    def games(self):
        return self.games_as_white.all() | self.games_as_black.all()
    
    def __str__(self):
        return self.username


class ChessGame(models.Model):
    GAME_MODES = [
        ('classic', 'Classic'),
        ('horde', 'Horde'),
        ('kirby', 'Kirby'),
        ('the_bomb', 'The Bomb'),
        ('960', 'Chess 960'),
    ]
    player_white = models.ForeignKey(User, on_delete=models.CASCADE, related_name='games_as_white')
    player_black = models.ForeignKey(User, on_delete=models.CASCADE, related_name='games_as_black')
    winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_chess_games')
    status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('in_progress', 'In Progress'), ('finished', 'Finished')], default='pending')
    available = models.BooleanField(default=False)
    game_key = models.UUIDField(default=uuid.uuid4, unique=True)
    game_mode = models.CharField(max_length=20, choices=GAME_MODES, default='classic')
    is_ranked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    board_states = models.JSONField(default=list)  # Campo para almacenar los estados del tablero

    def __str__(self):
        return f"ChessGame {self.id}: {self.player_white} vs {self.player_black} (Key: {self.game_key})"
        
    def _calculate_new_elo(self, player):
        opponent = self.player_black if player == self.player_white else self.player_white
        rating = player.elo_rating
        opponent_rating = opponent.elo_rating
        k_factor = 32 if player.elo_games_played < 30 else 24 if rating < 2400 else 16
        expected_score = 1 / (1 + 10 ** ((opponent_rating - rating) / 400))
        actual_score = 0.5 if self.winner is None else 1.0 if self.winner == player else 0.0
        new_rating = round(rating + k_factor * (actual_score - expected_score))
        player.elo_rating = new_rating
        player.save()
        return new_rating
    
    def save(self, *args, **kwargs):
        is_finishing = False
        if self.pk:
            try:
                old_instance = ChessGame.objects.get(pk=self.pk)
                is_finishing = old_instance.status != 'finished' and self.status == 'finished'
            except ChessGame.DoesNotExist:
                pass
        super().save(*args, **kwargs)
        if is_finishing:
            for player in [self.player_white, self.player_black]:
                if player.chess_statistics:
                    outcome = None
                    if self.winner:
                        outcome = 'won' if self.winner == player else 'lost'
                    else:
                        outcome = 'draw'
                    new_rating = self._calculate_new_elo(player) if self.is_ranked else None
                    player.chess_statistics.update_statistics(outcome, new_rating)
                    if self.is_ranked:
                        player.elo_games_played += 1
                        player.save()

    def add_board_state(self, board_state):
        self.board_states.append(board_state)
        self.save()

class ChessStatistics(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chess_statistics_entries'
    )
    games_played = models.IntegerField(default=0)
    games_won = models.IntegerField(default=0)
    games_lost = models.IntegerField(default=0)
    draws = models.IntegerField(default=0)
    highest_rating = models.IntegerField(default=1200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def update_statistics(self, outcome, new_rating=None):
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

class MatchmakingQueue(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game_mode = models.CharField(max_length=20, choices=ChessGame.GAME_MODES, default='classic')
    is_ranked = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'game_mode']

class OutgoingEvent(models.Model):
    event_id = models.UUIDField(primary_key=True)
    event_type = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    data = models.JSONField()


class IncomingEvent(models.Model):
    event_id = models.UUIDField(primary_key=True)
    event_type = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
