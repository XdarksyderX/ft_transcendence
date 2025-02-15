from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import models
from django.utils.timezone import now
from core.models import Tournament, TournamentParticipant, TournamentGame
from .serializers import TournamentSerializer, TournamentParticipantSerializer, TournamentGameSerializer
from core.models import PongGame
import uuid


class TournamentView(APIView):
    def get(self, request):
        tournaments = Tournament.objects.all()
        serializer = TournamentSerializer(tournaments, many=True)
        return Response(serializer.data)

    def post(self, request):
        request.data['organizer'] = request.user.id
        serializer = TournamentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EditTournamentView(APIView):
    def patch(self, request, tournament_id):
        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except Tournament.DoesNotExist:
            return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)

        if tournament.status != 'upcoming':
            return Response({'error': 'Tournament cannot be edited after it has started.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = TournamentSerializer(tournament, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StartTournamentView(APIView):
    def post(self, request, tournament_id):
        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except Tournament.DoesNotExist:
            return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)

        if tournament.status != 'upcoming' or tournament.start_date > now():
            return Response({'error': 'Tournament cannot start yet.'}, status=status.HTTP_403_FORBIDDEN)

        participants = list(TournamentParticipant.objects.filter(tournament=tournament).values_list('participant', flat=True))
        if len(participants) < 2:
            return Response({'error': 'Not enough participants to start the tournament.'}, status=status.HTTP_400_BAD_REQUEST)
    
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

        return Response({'message': f'Tournament {tournament.name} has started successfully.'}, status=status.HTTP_200_OK)


class TournamentGamesView(APIView):
    def get(self, request, tournament_id):
        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except Tournament.DoesNotExist:
            return Response({'error': 'Tournament not found'}, status=status.HTTP_404_NOT_FOUND)

        games = TournamentGame.objects.filter(tournament=tournament)
        serializer = TournamentGameSerializer(games, many=True)
        return Response(serializer.data)
