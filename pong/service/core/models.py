from django.db import models
import uuid
from django.contrib.postgres.fields import JSONField  # if PostgreSQL otherwise, use models.JSONField

class User(models.Model):
    user_id = models.IntegerField(unique=True)
    username = models.CharField(max_length=150)

    def __str__(self):
        return self.username

class PongGame(models.Model):
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
    available = models.BooleanField(default=False)
    is_tournament = models.BooleanField(default=False)
    tournament = models.ForeignKey(
        'Tournament',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='games'
    )
    
    game_key = models.UUIDField(default=uuid.uuid4, unique=True)  # Generates a unique key for WebSocket validation
    player_positions = models.JSONField(default=dict)  # Stores {'player1': {'x': 0, 'y': 0}, 'player2': {'x': 0, 'y': 0}}
    ball_position = models.JSONField(default=dict)  # Stores {'x': 350, 'y': 250} 

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_opponent(self, user):
        return self.player2 if self.player1 == user else self.player1

    def update_position(self, player, position):
        """Updates player position from received WebSocket data"""
        if player == self.player1.username:
            self.player_positions["player1"] = position
        elif player == self.player2.username:
            self.player_positions["player2"] = position
        self.save()

    def update_ball_position(self, position):
        """Updates the ball position from the game logic"""
        self.ball_position = position
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
