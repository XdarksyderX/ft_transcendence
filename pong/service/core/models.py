from django.db import models
from django.db import transaction
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.fields import ArrayField
import uuid
import random
from django.db.models.signals import post_save
from django.dispatch import receiver
from core.utils.event_domain import publish_event

class User(AbstractUser):
    username = models.CharField(max_length=20, unique=True)
    alias = models.CharField(max_length=20, unique=False, default='')
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

@receiver(post_save, sender=User)
def create_user_statistics(sender, instance, created, **kwargs):
    if created:
        stats = PongStatistics.objects.create(user=instance)
        instance.pong_statistics = stats
        instance.save(update_fields=['pong_statistics'])

class PongGame(models.Model):
    """
    Model that represents a PongGame.
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
    is_tournament = models.BooleanField(default=False)
    tournament = models.ForeignKey(
        'Tournament',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='games'
    )
    game_key = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Parameters
    board_width = models.IntegerField(default=700)
    board_height = models.IntegerField(default=500)
    player_height = models.IntegerField(default=50)
    player_speed = models.IntegerField(default=7) # trying values, increasing player speed 5->7
    ball_side = models.IntegerField(default=10)
    start_speed = models.FloatField(default=10) #start_speed 7.5 -> 10
    speed_up_multiple = models.FloatField(default=1.02)
    max_speed = models.IntegerField(default=20)
    points_to_win = models.IntegerField(default=3)

    score_player1 = models.IntegerField(default=0)
    score_player2 = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        # Check if status is changing to 'finished'
        is_finishing = False
        if self.pk:
            try:
                old_instance = PongGame.objects.get(pk=self.pk)
                is_finishing = old_instance.status != 'finished' and self.status == 'finished'
            except PongGame.DoesNotExist:
                pass
        
        # Call the original save method
        super().save(*args, **kwargs)

        # If the game just finished and has a winner, update statistics
        if is_finishing and self.winner:
            # Determine if it's a tournament game and if it's the final
            is_final = False
            if self.is_tournament and hasattr(self, 'tournament_match'):
                tournament = self.tournament
                max_rounds = 1 if tournament.max_players <= 2 else (tournament.max_players - 1).bit_length()
                # Use the match's round number to determine if it's the final
                is_final = self.tournament_match.round_number == max_rounds

            if self.is_tournament:
                if is_final:
                    # Final game: Update both players with positions
                    winner_position = 1
                    loser_position = 2
                    loser = self.player1 if self.winner == self.player2 else self.player2
                    winner_stats = self.winner.statistics.first()
                    loser_stats = loser.statistics.first()
                    if winner_stats:
                        winner_stats.update_statistics(self, tournament_position=winner_position)
                    if loser_stats:
                        loser_stats.update_statistics(self, tournament_position=loser_position)
                else:
                    # Intermediate game: Update only the loser
                    loser = self.player1 if self.winner == self.player2 else self.player2
                    loser_stats = loser.statistics.first()
                    if loser_stats:
                        loser_stats.update_statistics(self, tournament_position=None)
            else:
                # Non-tournament game: Update both players
                for player in [self.player1, self.player2]:
                    stats = player.statistics.first()
                    if stats:
                        stats.update_statistics(self)

            # Existing tournament event handling
            if self.is_tournament:
                players_id = self.tournament.players.values_list('id', flat=True)
                event = {
                    'tournament_token': self.tournament.token,
                    'player1': self.player1.username,
                    'player2': self.player2.username,
                    'winner': self.winner.username,
                    'players_id': list(players_id),
                }
                publish_event('pong', 'pong.tournament_match_finished', event)
                if self.tournament.is_current_round_finished():
                    with transaction.atomic():
                        tournament_locked = Tournament.objects.select_for_update().get(id=self.tournament.id)
                        if self.tournament.is_current_round_finished():
                            self.tournament.create_next_round_matches()
                            alive_players = []
                            for match in self.tournament.matches.filter(round_number=self.tournament.current_round - 1):
                                if match.pong_game.winner:
                                    alive_players.append(match.pong_game.winner.id)
                            event_round = {
                                "tournament_name": self.tournament.name,
                                "round_number": self.tournament.current_round,
                                "alive_players": alive_players
                            }
                            if not is_final:
                                print("Publishing event for round finished")
                                publish_event('pong', 'pong.tournament_round_finished', event_round)
                            else:
                                print("Publishing event for tournament finished")
                                publish_event('pong', 'pong.tournament_finished', event_round)

    def __str__(self):
        return f"Game {self.id}: {self.player1} vs {self.player2} (Key: {self.game_key})"

class PongStatistics(models.Model):
    """
    Stores aggregate statistics for a user.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='statistics'
    )
    # Quick game statistics
    quick_games_played = models.IntegerField(default=0)
    quick_games_won = models.IntegerField(default=0)
    quick_games_lost = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    highest_score = models.IntegerField(default=0)
    
    # Tournament statistics
    tournaments_played = models.IntegerField(default=0)
    tournaments_first = models.IntegerField(default=0)
    tournaments_second = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def update_statistics(self, game, tournament_position=None):
        """
        Updates the player's statistics based on the PongGame.
        
        Args:
            game: The PongGame object containing the game data
            tournament_position: Optional position in tournament (1 for winner, 2 for runner-up)
        """
        is_tournament = game.is_tournament
        is_player1 = self.user == game.player1
        
        # Determine if user won and their score
        if game.winner == self.user:
            outcome = 'won'
        else:
            outcome = 'lost'
        
        # Get user's score
        score = game.score_player1 if is_player1 else game.score_player2
        
        if not is_tournament:
            self.quick_games_played += 1
            if outcome == 'won':
                self.quick_games_won += 1
                self.current_streak += 1
                self.highest_score = max(self.highest_score, score)
            elif outcome == 'lost':
                self.quick_games_lost += 1
                self.current_streak = 0
        else:
            self.tournaments_played += 1
            if tournament_position == 1:
                self.tournaments_first += 1
            elif tournament_position == 2:
                self.tournaments_second += 1
        self.save()
    
    def __str__(self):
        return f"Stats for {self.user}: {self.quick_games_played} quick games, {self.tournaments_played} tournaments"

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

class TournamentInvitation(models.Model):
    """
    Represents a pending invitation to a tournament.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('cancelled', 'Cancelled'),
        ('denied', 'Denied'),
    ]
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_tournament_invitations'
    )
    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='received_tournament_invitations'
    )
    token = models.CharField(max_length=255, unique=True)
    tournament = models.ForeignKey(
        'Tournament',
        on_delete=models.CASCADE,
        related_name='tournament_invitations_set'
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"TournamentInvitation {self.token} from {self.sender} to {self.receiver} for tournament {self.tournament.id}"

class Tournament(models.Model):
    name = models.CharField(max_length=100)
    organizer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='organized_tournaments'
    )
    max_players = models.IntegerField(
        choices=[(4, '4 Players'), (8, '8 Players')],
        default=4
    )

    invited_users = models.ManyToManyField(
        User,
        through=TournamentInvitation,
        through_fields=('tournament', 'receiver'),
        related_name='tournament_invitations'
    )
    players = models.ManyToManyField(
        User,
        related_name='tournaments'
    )
    token = models.CharField(max_length=255, unique=True, default=uuid.uuid4)
    closed = models.BooleanField(default=False)
    current_round = models.IntegerField(default=1)
    seeding = ArrayField(models.BigIntegerField(), null=True, blank=True) # avoids integer overflow
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_finished(self):
        return self.closed and self.matches.filter(pong_game__status='finished').count() == self.max_players - 1


    @property
    def invitations(self):
        return TournamentInvitation.objects.filter(tournament=self)

    def close_tournament(self):
        """
        Closes the tournament:
         - Checks that the tournament has the required number of confirmed players.
         - Deletes pending invitations.
         - Generates the seeding (random order for simplicity).
         - Creates the first round matches.
        """
        if self.players.count() != self.max_players:
            raise Exception(f"Tournament cannot be closed without {self.max_players} confirmed players.")

        # Generate seeding: a list of player IDs in random order.
        player_ids = list(self.players.values_list('id', flat=True))
        random.shuffle(player_ids)
        self.seeding = player_ids
        self.closed = True
        self.save()

        with transaction.atomic():
            # Lock the tournament record to avoid race conditions
            tournament_locked = Tournament.objects.select_for_update().get(id=self.id) #variable not used, just triggers database lock
            if not TournamentMatch.objects.filter(tournament=self, round_number=1).exists():
                self.create_next_round_matches()

    def is_current_round_finished(self):
        """
        Returns True if all matches in the current round have finished.
        """
        tournament_matches = self.matches.filter(round_number=self.current_round)
        if tournament_matches.count() == 0:
            return False
        return all(tournament_match.pong_game.status == 'finished' for tournament_match in tournament_matches)

    def create_next_round_matches(self):
        """
        Creates the matches for the next round based on the current information.
        
        - For the first round (if no matches exist), create matches based on the seeding.
          For 4 players: seed[0] vs seed[3] and seed[1] vs seed[2].
          For 8 players: seed[0] vs seed[7], seed[3] vs seed[4], seed[1] vs seed[6] and seed[2] vs seed[5].
        - For later rounds, use the winners from the previous round.
        
        Matches are created with status 'pending'.
        """
        if self.current_round == 1 and self.matches.count() == 0:
            if not self.seeding:
                raise Exception("Seeding is not set. Close the tournament first.")
            if self.max_players == 4:
                # For 4 players: seeding order [1,2,3,4]
                game1 = PongGame.objects.create(
                player1=User.objects.get(id=self.seeding[0]),
                player2=User.objects.get(id=self.seeding[3]),
                status='pending',
                is_tournament=True,
                tournament=self
                )
                TournamentMatch.objects.create(
                    tournament=self,
                    round_number=1,
                    pong_game=game1
                )
                
                game2 = PongGame.objects.create(
                    player1=User.objects.get(id=self.seeding[1]),
                    player2=User.objects.get(id=self.seeding[2]),
                    status='pending',
                    is_tournament=True,
                    tournament=self
                )
                TournamentMatch.objects.create(
                    tournament=self,
                    round_number=1,
                    pong_game=game2
                )
            elif self.max_players == 8:
                game1 = PongGame.objects.create(
                player1=User.objects.get(id=self.seeding[0]),
                player2=User.objects.get(id=self.seeding[7]),
                status='pending',
                is_tournament=True,
                tournament=self
                )
                TournamentMatch.objects.create(
                    tournament=self,
                    round_number=1,
                    pong_game=game1
                )

                game2 = PongGame.objects.create(
                    player1=User.objects.get(id=self.seeding[3]),
                    player2=User.objects.get(id=self.seeding[4]),
                    status='pending',
                    is_tournament=True,
                    tournament=self
                )
                TournamentMatch.objects.create(
                    tournament=self,
                    round_number=1,
                    pong_game=game2
                )

                game3 = PongGame.objects.create(
                    player1=User.objects.get(id=self.seeding[1]),
                    player2=User.objects.get(id=self.seeding[6]),
                    status='pending',
                    is_tournament=True,
                    tournament=self
                )
                TournamentMatch.objects.create(
                    tournament=self,
                    round_number=1,
                    pong_game=game3
                )

                game4 = PongGame.objects.create(
                    player1=User.objects.get(id=self.seeding[2]),
                    player2=User.objects.get(id=self.seeding[5]),
                    status='pending',
                    is_tournament=True,
                    tournament=self
                )
                TournamentMatch.objects.create(
                    tournament=self,
                    round_number=1,
                    pong_game=game4
                )
        else:
            # For later rounds: use winners from the previous round to create new matches.
            previous_matches = self.matches.filter(round_number=self.current_round)
            winners = []
            for match in previous_matches:
                if match.pong_game.status != 'finished' or not match.pong_game.winner:
                    raise Exception("Not all matches in the current round have finished.")
                winners.append(match.pong_game.winner.id)
            
            if len(winners) < 2:
                return

            next_round = self.current_round + 1
            for i in range(0, len(winners), 2):
                p1_id = winners[i]
                p2_id = winners[i + 1]

                # Retrieve the actual user objects
                p1 = User.objects.get(id=p1_id)
                p2 = User.objects.get(id=p2_id)
                
                new_game = PongGame.objects.create(
                    player1=p1,
                    player2=p2,
                    status='pending',
                    is_tournament=True,
                    tournament=self
                )
                
                TournamentMatch.objects.create(
                    tournament=self,
                    round_number=next_round,
                    pong_game=new_game
                )
            self.current_round = next_round
            self.save()

    def get_player_pending_match(self, player):
        match = self.matches.filter(
            pong_game__status='pending',
            pong_game__player1=player
        ).first()
        if not match:
            match = self.matches.filter(
                pong_game__status='pending',
                pong_game__player2=player
            ).first()
        return match

    def __str__(self):
        return f"Tournament {self.name} (Players: {self.max_players})"

class TournamentMatch(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')
    round_number = models.IntegerField(default=1)
    pong_game = models.OneToOneField(PongGame, on_delete=models.CASCADE, related_name='tournament_match')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

class TournamentQueue(models.Model):
    """
    Represents a queue for tournament matches where players wait for their opponents.
    """
    tournament = models.ForeignKey(
        Tournament, 
        on_delete=models.CASCADE,
        related_name='queues'
    )
    match = models.ForeignKey(
        TournamentMatch,
        on_delete=models.CASCADE,
        related_name='queues'
    )
    player = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tournament_queues'
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['tournament', 'match', 'player']
    
    def __str__(self):
        return f"Queue entry for {self.player} in {self.tournament.name}, match {self.match.id}"

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
