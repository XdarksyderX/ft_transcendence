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

class TournamentQueueDetailView(APIView):
	permission_classes = [IsAuthenticated]
	def get(self, request):
		queue = TournamentQueue.objects.filter(player=request.user).first()
		tournament_token = None
		if queue:
			tournament_token = queue.tournament.token
		return Response({
			"status": "success",
			"message": "User's current tournament queue status.",
			"tournament_token": tournament_token
		}, status=status.HTTP_200_OK)


class TournamentJoinQueue(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, tournament_token):
		tournament = get_object_or_404(Tournament, token=tournament_token)

		if TournamentQueue.objects.filter(tournament=tournament, player=request.user).exists():
			return Response({
				"status": "error",
				"message": "You are already in queue for this tournament."
			}, status=status.HTTP_400_BAD_REQUEST)

		if TournamentQueue.objects.filter(player=request.user).exists():
			return Response({
				"status": "error",
				"message": "You are already in queue for another tournament."
			}, status=status.HTTP_400_BAD_REQUEST)

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
			return Response({
				"status": "error",
				"message": "No pending matches found for this user."
			}, status=status.HTTP_400_BAD_REQUEST)

		pong_game = pending_match.pong_game
		game_key = pong_game.game_key

		opponent = pong_game.player2 if pong_game.player1 == request.user else pong_game.player1

		existing_queue = TournamentQueue.objects.filter(
			tournament=tournament,
			player=request.user,
			match=pending_match
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
		).first()

		user_queue, created = TournamentQueue.objects.get_or_create(
			tournament=tournament,
			player=request.user,
			match=pending_match,
			defaults={'joined_at': timezone.now()}
		)
		if not created:
			return Response({
				"status": "error",
				"message": "You are already in queue for this match.",
				"joined_at": user_queue.joined_at,
				"waiting_time": int((timezone.now() - user_queue.joined_at).total_seconds())
			}, status=status.HTTP_400_BAD_REQUEST)

		if opponent_queue:
			pong_game.status = 'ready'
			pong_game.save()
			publish_event('pong', 'pong.tournament_match_ready', {
				'game_key': str(game_key),
				'player1_id': pong_game.player1.id,
				'player2_id': pong_game.player2.id,
			})
			TournamentQueue.objects.filter(
				tournament=tournament,
				match=pending_match
			).delete()
			return Response({
				"status": "success",
				"match_status": "matched",
				"message": "Both players are ready. Game is starting.",
				"game_key": str(game_key),
				"opponent": opponent.username
			}, status=status.HTTP_200_OK)


		publish_event('pong', 'pong.tournament_match_waiting', {
			'sender_id': request.user.id,
			'receiver_id': opponent.id,
			'tournament_name': tournament.name,
		})
		return Response({
			"status": "success",
			"match_status": "waiting",
			"message": "You've joined the queue. Waiting for your opponent.",
			"game_key": str(game_key),
			"opponent": opponent.username
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
