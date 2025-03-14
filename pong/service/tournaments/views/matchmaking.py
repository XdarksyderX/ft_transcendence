from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.models import Tournament, TournamentQueue, PongGame
from django.contrib.auth import get_user_model
from core.utils.event_domain import publish_event

User = get_user_model()

class TournamentJoinQueue(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, tournament_token):
		tournament = get_object_or_404(Tournament, token=tournament_token)

		if not tournament.closed:
			return Response({
				"status": "error",
				"message": "Tournament has not started yet."
			}, status=status.HTTP_400_BAD_REQUEST)

		if request.user not in tournament.players.all():
			return Response({
				"status": "error",
				"message": "You are not part of this tournament."
			}, status=status.HTTP_403_FORBIDDEN)

		pending_match = tournament.get_player_pending_match(request.user)

		if not pending_match:
			pending_match = tournament.matches.filter(
				pong_game__status='pending',
				pong_game__player2=request.user
			).first()

		if not pending_match:
			return Response({
				"message": "No pending matches found for this user."
			}, status=status.HTTP_400_BAD_REQUEST)

		pong_game = pending_match.pong_game
		game_key = pong_game.game_key

		opponent = pong_game.player2 if pong_game.player1 == request.user else pong_game.player1

		existing_queue = TournamentQueue.objects.filter(
			tournament=tournament,
			player=request.user,
			match__pong_game__game_key=game_key
		).first()

		if existing_queue:
			return Response({
				"status": "error",
				"message": "You are already in queue for this match.",
				"joined_at": existing_queue.joined_at,
				"waiting_time": int((timezone.now() - existing_queue.joined_at).total_seconds())
			}, status=status.HTTP_400_BAD_REQUEST)

		opponent_queue = TournamentQueue.objects.filter(
			tournament=tournament,
			player=opponent,
			match__pong_game__game_key=game_key
		).first()

		user_queue = TournamentQueue.objects.create(
			tournament=tournament,
			player=request.user,
			match=pending_match,  # the TournamentMatch that has the pong_game with this game_key
			joined_at=timezone.now()
		)

		if opponent_queue:
			pong_game.status = 'ready'
			pong_game.save()
			publish_event('pong', 'pong.tournament_match_ready', {
				'game_key': game_key,
				'player1': pong_game.player1.username,
				'player2': pong_game.player2.username
			})
			return Response({
				"status": "success",
				"message": "Both players are ready. Game is starting.",
				"game_key": game_key,
				"opponent": opponent.username,
				"status": "matched"
			}, status=status.HTTP_200_OK)


		publish_event('pong', 'pong.tournament_match_waiting', {
			'sender_id': request.user.id,
			'receiver_id': opponent.id,
		})
		return Response({
			"status": "success",
			"message": "You've joined the queue. Waiting for your opponent.",
			"game_key": game_key,
			"opponent": opponent.username,
			"status": "waiting"
		}, status=status.HTTP_201_CREATED)


class TournamentLeaveQueue(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, tournament_token):
		tournament = get_object_or_404(Tournament, token=tournament_token)
		
		if not tournament.closed:
			return Response({
				"status": "error",
				"message": "Tournament has not started yet."
			}, status=status.HTTP_400_BAD_REQUEST)

		deleted_count, _ = TournamentQueue.objects.filter(
			tournament=tournament,
			player=request.user
		).delete()
		
		if deleted_count > 0:
			return Response({
				"status": "success",
				"message": "Successfully left the queue."
			}, status=status.HTTP_200_OK)
		
		return Response({
			"status": "success",
			"message": "You were not in any queue for this tournament."
		}, status=status.HTTP_200_OK)
