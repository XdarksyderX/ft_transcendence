from celery import shared_task
from django.utils.timezone import now
from .models import Tournament, TournamentParticipant, TournamentGame
from core.models import PongGame

@shared_task
def start_pending_tournaments():
    tournaments = Tournament.objects.filter(status='upcoming', start_date__lte=now())

    for tournament in tournaments:
        participants = list(TournamentParticipant.objects.filter(tournament=tournament).values_list('participant', flat=True))
        if len(participants) < 2:
            tournament.status = 'blocked'
            tournament.save()
            continue

        tournament_games = []
        for i in range(len(participants)):
            for j in range(i + 1, len(participants)):
                pong_game = PongGame.objects.create(
                    player1_id=participants[i],
                    player2_id=participants[j],
                    status='pending',
                    is_tournament=True,
                    available=True
                )

                tournament_game = TournamentGame(
                    tournament=tournament,
                    match=pong_game,
                    round_number=1
                )
                tournament_games.append(tournament_game)

        TournamentGame.objects.bulk_create(tournament_games)
        tournament.status = 'ongoing'
        tournament.save()

    return f"Started {tournaments.count()} tournaments"
