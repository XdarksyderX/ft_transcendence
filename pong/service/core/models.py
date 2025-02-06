from django.db import models
import uuid
import random
from django.contrib.postgres.fields import JSONField  # If using PostgreSQL, otherwise use models.JSONField

class User(models.Model):
    """Model representing a user in the game."""
    user_id = models.AutoField(primary_key=True)  # Auto-incremented unique ID
    username = models.CharField(max_length=150, unique=True)

    def __str__(self):
        return self.username


class PongGame(models.Model):
    """Model representing a single Pong game instance."""
    player1 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='player1_games'
    )
    player2 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='player2_games'
    )
    winner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='won_games'
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
    
    available = models.BooleanField(default=False)  # If game can be joined
    is_tournament = models.BooleanField(default=False)
    
    tournament = models.ForeignKey(
        'Tournament',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='games'
    )

    game_key = models.UUIDField(default=uuid.uuid4, unique=True)  # Unique game session key

    player_positions = models.JSONField(
        default=lambda: {
            "player1": {"x": 20, "y": 225},  # In future, make configurable
            "player2": {"x": 670, "y": 225}
        }
    )

    # Randomized initial ball velocity for fairness
    def _random_ball_start(self):
        angle = random.uniform(-30, 30)  # Random angle
        direction = random.choice([-1, 1])  # Random left or right
        speed = 5  # Initial speed
        return {
            "x": 350, "y": 250,
            "xVel": speed * direction,
            "yVel": speed * random.choice([-1, 1])
        }

    ball_position = models.JSONField(default=dict)  # Will be set dynamically

    # Explicit fields for scores (easier querying)
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """Ensure ball position is set dynamically on creation."""
        if not self.ball_position:
            self.ball_position = self._random_ball_start()
        super().save(*args, **kwargs)

    def get_opponent(self, user):
        """Returns the opponent of the given user."""
        return self.player2 if self.player1 == user else self.player1

    def update_position(self, player, position):
        """Updates a player's position and saves it to the database."""
        if player not in ["player1", "player2"]:
            return  # Ignore invalid players
        
        self.player_positions[player]["y"] = position["y"]
        self.player_positions[player]["x"] = position.get("x", self.player_positions[player]["x"])  # Preserve x value
        self.save()

    def update_ball_position(self, position):
        """Updates the ball position in the database while preserving velocity."""
        self.ball_position.update({
            "x": position.get("x", self.ball_position["x"]),
            "y": position.get("y", self.ball_position["y"]),
            "xVel": position.get("xVel", self.ball_position["xVel"]),
            "yVel": position.get("yVel", self.ball_position["yVel"])
        })
        self.save()

    def __str__(self):
        return f"Game {self.id}: {self.player1} vs {self.player2} (Key: {self.game_key})"


class Tournament(models.Model):
    name = models.CharField(max_length=100)
    organizer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='organized_tournaments'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('upcoming', 'Upcoming'),
            ('blocked', 'Blocked'),
            ('ongoing', 'Ongoing'),
            ('completed', 'Completed')
        ],
        default='upcoming'
    )
    max_participants = models.IntegerField(default=16)
    description = models.TextField(null=True, blank=True)
    start_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    participant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tournament_participations'
    )
    games_won = models.IntegerField(default=0)
    games_lost = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.participant} in {self.tournament}"


class MatchesHistory(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='matches_history'
    )
    game = models.ForeignKey(
        PongGame,
        on_delete=models.CASCADE,
        related_name='history'
    )
    outcome = models.CharField(
        max_length=20,
        choices=[
            ('won', 'Won'),
            ('lost', 'Lost')
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"History: {self.user} - {self.game} ({self.outcome})"
