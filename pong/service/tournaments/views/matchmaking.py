from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from core.models import Tournament, TournamentQueue, PongGame
from django.contrib.auth import get_user_model

User = get_user_model()

class TournamentJoinQueue(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, tournament_token):
		# Buscar el torneo por token
		tournament = get_object_or_404(Tournament, token=tournament_token)

		# Verificar si el torneo está cerrado (ha comenzado)
		if not tournament.closed:
			return Response({
				"status": "error",
				"message": "Tournament has not started yet."
			}, status=status.HTTP_400_BAD_REQUEST)

		# Verificar si el usuario es parte del torneo
		if request.user not in tournament.players.all():
			return Response({
				"status": "error",
				"message": "You are not part of this tournament."
			}, status=status.HTTP_403_FORBIDDEN)

		# Buscar partido pendiente donde el usuario es player1
		pending_match = tournament.get_player_pending_match(request.user)

		# Si no hay partido como player1, buscar como player2
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

		# Determinar quién es el oponente
		opponent = pong_game.player2 if pong_game.player1 == request.user else pong_game.player1

		# Verificar si el usuario ya está en cola
		existing_queue = TournamentQueue.objects.filter(
			tournament=tournament,
			player=request.user,
			game_key=game_key
		).first()

		if existing_queue:
			return Response({
				"status": "error",
				"message": "You are already in queue for this match.",
				"joined_at": existing_queue.joined_at,
				"waiting_time": int((timezone.now() - existing_queue.joined_at).total_seconds())
			}, status=status.HTTP_400_BAD_REQUEST)

		# Verificar si el oponente ya está en cola
		opponent_queue = TournamentQueue.objects.filter(
			tournament=tournament,
			player=opponent,
			game_key=game_key
		).first()

		# Crear una entrada en la cola para el usuario actual
		user_queue = TournamentQueue.objects.create(
			tournament=tournament,
			player=request.user,
			game_key=game_key,
			joined_at=timezone.now()
		)

		# Si el oponente ya está en cola, actualizar el estado del juego
		if opponent_queue:
			# Actualizar el estado del juego a 'ready'
			pong_game.status = 'ready'
			pong_game.save()
			
			return Response({
				"status": "success",
				"message": "Both players are ready. Game is starting.",
				"game_key": game_key,
				"opponent": opponent.username,
				"status": "matched"
			}, status=status.HTTP_200_OK)

		# Si el oponente no está en cola, notificar al usuario
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

			# Eliminar todas las entradas de cola para este usuario y torneo
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
