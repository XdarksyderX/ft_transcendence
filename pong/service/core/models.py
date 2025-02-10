from django.db import models
import uuid
import random
from django.contrib.postgres.fields import JSONField  # for PostgreSQL, otherwise would be models.JSONField

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

    # Game status
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

    # In future configurable game parameters (now stored in the database)
    board_width = models.IntegerField(default=700)  
    board_height = models.IntegerField(default=500)  
    player_height = models.IntegerField(default=50)  # Paddle height
    player_speed = models.IntegerField(default=5)
    ball_side = models.IntegerField(default=10)  # Ball dimensions (square)
    start_speed = models.FloatField(default=7.5)
    speed_up_multiple = models.FloatField(default=1.02)
    max_speed = models.IntegerField(default=20)
    points_to_win = models.IntegerField(default=3)

    # Computed game constants (dynamic)
    @property
    def x_margin(self):
        return self.ball_side * 1.2  # Margin from board to player1 paddle

    @property
    def player_width(self):
        return self.ball_side * 1.2  # Paddle width (scaled)

    @property
    def p2_xpos(self):
        return self.board_width - self.x_margin - self.player_width  # Player 2 x-position

    @property
    def p_y_mid(self):
        return (self.board_height / 2) - (self.player_height / 2)  # Center y-position for paddles

    @property
    def b_x_mid(self):
        return (self.board_width / 2) - (self.ball_side / 2)  # Center x-position for ball

    @property
    def b_y_mid(self):
        return (self.board_height / 2) - (self.ball_side / 2)  # Center y-position for ball

    # Default player positions (dynamically assigned)
    player_positions = models.JSONField(default=dict)
    ball_position = models.JSONField(default=dict)  # Ball position, dynamically initialized

    # Explicit fields for scores
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def initialize_ball(self, direction=None):
        """Initialize ball position with a randomized velocity for fairness."""
        angle = random.uniform(-45, 45)  # Random angle
        direction = direction if direction is not None else random.choice([-1, 1])  
        return {
            "x": self.b_x_mid,
            "y": self.b_y_mid,
            "xVel": self.start_speed * direction * math.cos(math.radians(angle)),
            "yVel": self.start_speed * math.sin(math.radians(angle))
        }

    def save(self, *args, **kwargs):
        """Ensure all game parameters are correctly computed before saving."""
        # Ensure player positions are initialized
        self.player_positions = {
            "player1": {"x": self.x_margin, "y": self.p_y_mid},
            "player2": {"x": self.p2_xpos, "y": self.p_y_mid}
        }

        # Ensure ball position is initialized
        self.ball_position = self.initialize_ball()

        super().save(*args, **kwargs)

    def get_opponent(self, user):
        """Returns the opponent of the given user."""
        return self.player2 if self.player1 == user else self.player1

    def update_position(self, player, position):
        """Updates a player's position and saves it to the database."""
        if player not in ["player1", "player2"]:
            return  

        # Modify player position
        updated_positions = self.player_positions.copy()
        updated_positions[player]["y"] = position["y"]
        updated_positions[player]["x"] = position.get("x", updated_positions[player]["x"])

        # Force Django to recognize update
        self.player_positions = updated_positions  
        self.save()

    def update_ball_position(self, position):
        """Updates the ball position while preserving velocity changes."""
        updated_ball = self.ball_position.copy()
        updated_ball["x"] = position.get("x", updated_ball["x"])
        updated_ball["y"] = position.get("y", updated_ball["y"])
        updated_ball["xVel"] = position.get("xVel", updated_ball["xVel"])
        updated_ball["yVel"] = position.get("yVel", updated_ball["yVel"])

        # Force Django to recognize update
        self.ball_position = updated_ball  
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


class TournamentGame(models.Model):
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name='games'
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


class PongStatistics(models.Model):
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
        """Update player statistics after a game."""
        self.games_played += 1
        if outcome == 'won':
            self.games_won += 1
            self.highest_score = max(self.highest_score, score)
        elif outcome == 'lost':
            self.games_lost += 1
        self.save()

    def __str__(self):
        return f"Stats for {self.user}: {self.games_played} games played"


class MatchInvitation(models.Model):
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_invitations'
    )
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_invitations'
    )
    token = models.CharField(max_length=255, unique=True)
    games = models.ManyToManyField(
        PongGame,
        related_name='invitations'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('accepted', 'Accepted'),
            ('declined', 'Declined'),
            ('expired', 'Expired')
        ],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invitation {self.token} from {self.sender} to {self.receiver}"
