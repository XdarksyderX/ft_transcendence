import uuid
from django.db import models
from service.core.models import User

class ChessGame(models.Model):
    CHESS_TYPES = [
        ('classic', 'Classic Chess'),
        ('atomic', 'Atomic Chess'),
    ]

    game_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    player_one = models.ForeignKey(User, on_delete=models.CASCADE, related_name="player_one_games")
    player_two = models.ForeignKey(User, on_delete=models.CASCADE, related_name="player_two_games")
    game_type = models.CharField(max_length=10, choices=CHESS_TYPES)
    moves_history = models.JSONField(default=list)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('in_progress', 'In Progress'),
            ('finished', 'Finished')
        ],
        default='pending'
    )
    winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="games_won")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        status = "Finished" if self.status == "finished" else "In Progress"
        return f"Game {self.game_id} - {self.player_one} vs {self.player_two} ({status})"

    class Meta:
        ordering = ['-created_at']