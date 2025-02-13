from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
import random
import math

class User(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    friends = models.ManyToManyField('self', symmetrical=True, blank=True)
    pong_statistics = models.OneToOneField(
        'PongStatistics',
        on_delete=models.CASCADE,
        related_name='user_stats',
        null=True,
        blank=True
    )
    
    @property
    def games(self):
        """
        Returns a queryset with all the games in which the user participates,
        either as player1 or player2.
        """
        return self.player1_games.all() | self.player2_games.all()
    
    def __str__(self):
        return self.username


class PongGame(models.Model):
    """
    Model representing a single Pong game instance.
    """
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
    available = models.BooleanField(default=False)  # Indicates if the game is joinable
    is_tournament = models.BooleanField(default=False)
    tournament = models.ForeignKey(
        'Tournament',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='games'
    )
    game_key = models.UUIDField(default=uuid.uuid4, unique=True)  # Unique game session key
    
    # Game configuration parameters
    board_width = models.IntegerField(default=700)
    board_height = models.IntegerField(default=500)
    player_height = models.IntegerField(default=50)
    player_speed = models.IntegerField(default=5)
    ball_side = models.IntegerField(default=10)
    start_speed = models.FloatField(default=7.5)
    speed_up_multiple = models.FloatField(default=1.02)
    max_speed = models.IntegerField(default=20)
    points_to_win = models.IntegerField(default=3)
    
    # Computed game constants (dynamic)
    @property
    def x_margin(self):
        return self.ball_side * 1.2  # Margin from the board to player1's paddle

    @property
    def player_width(self):
        return self.ball_side * 1.2  # Scaled paddle width

    @property
    def p2_xpos(self):
        return self.board_width - self.x_margin - self.player_width  # X-position for player2

    @property
    def p_y_mid(self):
        return (self.board_height / 2) - (self.player_height / 2)  # Center Y for paddles

    @property
    def b_x_mid(self):
        return (self.board_width / 2) - (self.ball_side / 2)  # Center X for the ball

    @property
    def b_y_mid(self):
        return (self.board_height / 2) - (self.ball_side / 2)  # Center Y for the ball
    
    # Default positions stored as JSON
    player_positions = models.JSONField(default=dict)
    ball_position = models.JSONField(default=dict)
    
    # Score fields
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def initialize_ball(self, direction=None):
        """
        Initializes the ball position and velocity with a random angle for fairness.
        """
        angle = random.uniform(-45, 45)
        direction = direction if direction is not None else random.choice([-1, 1])
        return {
            "x": self.b_x_mid,
            "y": self.b_y_mid,
            "xVel": self.start_speed * direction * math.cos(math.radians(angle)),
            "yVel": self.start_speed * math.sin(math.radians(angle))
        }
    
    def save(self, *args, **kwargs):
        """
        Computes initial positions for players and the ball before saving.
        """
        self.player_positions = {
            "player1": {"x": self.x_margin, "y": self.p_y_mid},
            "player2": {"x": self.p2_xpos, "y": self.p_y_mid}
        }
        self.ball_position = self.initialize_ball()
        super().save(*args, **kwargs)
    
    def get_opponent(self, user):
        """
        Returns the opponent for the given user in the game.
        """
        return self.player2 if self.player1 == user else self.player1
    
    def update_position(self, player, position):
        """
        Updates the specified player's position and saves the game.
        """
        if player not in ["player1", "player2"]:
            return
        updated_positions = self.player_positions.copy()
        updated_positions[player]["y"] = position["y"]
        updated_positions[player]["x"] = position.get("x", updated_positions[player]["x"])
        self.player_positions = updated_positions
        self.save()
    
    def update_ball_position(self, position):
        """
        Updates the ball's position and velocity.
        """
        updated_ball = self.ball_position.copy()
        updated_ball["x"] = position.get("x", updated_ball["x"])
        updated_ball["y"] = position.get("y", updated_ball["y"])
        updated_ball["xVel"] = position.get("xVel", updated_ball["xVel"])
        updated_ball["yVel"] = position.get("yVel", updated_ball["yVel"])
        self.ball_position = updated_ball
        self.save()
    
    def __str__(self):
        return f"Game {self.id}: {self.player1} vs {self.player2} (Key: {self.game_key})"


class Tournament(models.Model):
    """
    Represents a tournament with its organizer, status, and schedule.
    """
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
    """
    Relates a user to a tournament and tracks their invitation status and match record.
    """
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
    # Invitation status: pending, accepted, or declined.
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('accepted', 'Accepted'),
            ('declined', 'Declined')
        ],
        default='pending'
    )
    games_won = models.IntegerField(default=0)
    games_lost = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.participant} in {self.tournament}"


class TournamentGame(models.Model):
    """
    Associates a PongGame with a Tournament and tracks the round number.
    """
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name='tournament_games'
    )
    match = models.OneToOneField(
        PongGame,
        on_delete=models.CASCADE,
        related_name='tournament_game'
    )
    round_number = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Tournament: {self.tournament.name}, Match: {self.match.id}"


class PongStatistics(models.Model):
    """
    Stores aggregate statistics for a user.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='statistics'
    )
    games_played = models.IntegerField(default=0)
    games_won = models.IntegerField(default=0)
    games_lost = models.IntegerField(default=0)
    highest_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def update_statistics(self, outcome, score):
        """
        Updates the player's statistics after a game.
        """
        self.games_played += 1
        if outcome == 'won':
            self.games_won += 1
            self.highest_score = max(self.highest_score, score)
        elif outcome == 'lost':
            self.games_lost += 1
        self.save()
    
    def __str__(self):
        return f"Stats for {self.user}: {self.games_played} games played"


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
        PongGame,
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
