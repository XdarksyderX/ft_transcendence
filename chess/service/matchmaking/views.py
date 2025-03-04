from django.db.models import Q, F
from django.db.models.functions import Abs
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.utils.event_domain import publish_event
import random

from core.models import ChessGame, MatchmakingQueue

class JoinMatchmakingView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		game_modes = request.data.get('game_modes', ['classic'])
		is_ranked = request.data.get('is_ranked', False)
		
		if not isinstance(game_modes, list):
			game_modes = [game_modes]
			
		valid_modes = [mode[0] for mode in ChessGame.GAME_MODES]
		invalid_modes = [mode for mode in game_modes if mode not in valid_modes]
		if invalid_modes:
			return Response({
				'status': 'error',
				'message': f'Invalid game modes: {", ".join(invalid_modes)}',
				'valid_modes': valid_modes
			}, status=status.HTTP_400_BAD_REQUEST)
		
		if is_ranked:
			if any(mode != 'classic' for mode in game_modes):
				return Response({
					'status': 'error',
					'message': 'Ranked games are only available in classic mode',
					'valid_modes': ['classic']
				}, status=status.HTTP_400_BAD_REQUEST)
			game_modes = ['classic']
		
		if MatchmakingQueue.objects.filter(user=user).exists():
			return Response({
				'status': 'error',
				'message': 'You are already in a matchmaking queue'
			}, status=status.HTTP_400_BAD_REQUEST)
		
		match_found = False
		created_game = None
		
		search_priority = []
		if is_ranked:
			search_priority.append((True, 'classic'))
		else:
			for mode in game_modes:
				search_priority.append((False, mode))
		
		for current_ranked, current_mode in search_priority:
			if match_found:
				break
			
			potential_matches = MatchmakingQueue.objects.filter(
				game_mode=current_mode,
				is_ranked=current_ranked
			).exclude(user=user)
			
			if current_ranked:
				user_elo = user.elo_rating
				potential_matches = potential_matches.annotate(
					elo_diff=Abs(F('user__elo_rating') - user_elo)
				).order_by('elo_diff')
				
				potential_matches = potential_matches.filter(elo_diff__lte=200)
				
				if not potential_matches.exists():
					potential_matches = MatchmakingQueue.objects.filter(
						game_mode=current_mode,
						is_ranked=current_ranked
					).exclude(user=user).annotate(
						elo_diff=Abs(F('user__elo_rating') - user_elo)
					).order_by('elo_diff')
			
			match = potential_matches.first()
			
			if match:
				opponent = match.user
				
				if random.choice([True, False]):
					player_white, player_black = user, opponent
				else:
					player_white, player_black = opponent, user
				
				created_game = ChessGame.objects.create(
					player_white=player_white,
					player_black=player_black,
					status='in_progress',
					available=True,
					game_mode=current_mode,
					is_ranked=current_ranked
				)
				
				publish_event("chess", "chess.match_accepted", {
					"game_key": str(created_game.game_key),
					"accepted_by": user.id,
					"invited_by": opponent.id
				})
				
				match.delete()
				match_found = True
		
		if match_found:
			return Response({
				'status': 'success',
				'message': 'Match found',
				'game': {
					'id': created_game.id,
					'game_key': str(created_game.game_key),
					'player_white': created_game.player_white.username,
					'player_black': created_game.player_black.username,
					'game_mode': created_game.game_mode,
					'is_ranked': created_game.is_ranked,
					'white_elo': created_game.player_white.elo_rating,
					'black_elo': created_game.player_black.elo_rating
				}
			})
		else:
			created_queues = []
			for mode in game_modes:
				current_ranked = is_ranked and mode == 'classic'
				queue_entry = MatchmakingQueue.objects.create(
					user=user,
					game_mode=mode,
					is_ranked=current_ranked
				)
				created_queues.append({
					'game_mode': mode,
					'is_ranked': current_ranked
				})
			
			queue_sizes = []
			for mode in game_modes:
				is_mode_ranked = is_ranked and mode == 'classic'
				queue_sizes.append({
					'game_mode': mode,
					'is_ranked': is_mode_ranked,
					'size': MatchmakingQueue.objects.filter(
						game_mode=mode,
						is_ranked=is_mode_ranked
					).count()
				})
			
			return Response({
				'status': 'success',
				'message': 'Added to matchmaking queues',
				'queue_info': {
					'modes': created_queues,
					'is_ranked': is_ranked,
					'queue_sizes': queue_sizes,
					'user_elo': user.elo_rating,
					'available_modes': [mode[0] for mode in ChessGame.GAME_MODES]
				}
			})

class LeaveMatchmakingView(APIView):
	permission_classes = [IsAuthenticated]
	
	def post(self, request):
		user = request.user
		queue_entries = MatchmakingQueue.objects.filter(user=user)
		
		if not queue_entries.exists():
			return Response({
				'status': 'error',
				'message': 'You are not in any matchmaking queue'
			}, status=status.HTTP_400_BAD_REQUEST)
		
		queue_info = []
		for entry in queue_entries:
			queue_info.append({
				'game_mode': entry.game_mode,
				'is_ranked': entry.is_ranked,
				'queue_size': MatchmakingQueue.objects.filter(
					game_mode=entry.game_mode,
					is_ranked=entry.is_ranked
				).count() - 1
			})
		
		queue_entries.delete()
		
		return Response({
			'status': 'success',
			'message': 'Removed from all matchmaking queues',
			'queue_info': queue_info
		})

class CheckMatchmakingStatusView(APIView):
	permission_classes = [IsAuthenticated]
	
	def get(self, request):
		user = request.user
		queue_entries = MatchmakingQueue.objects.filter(user=user)
		
		if queue_entries.exists():
			queue_info = []
			for entry in queue_entries:
				queue_info.append({
					'game_mode': entry.game_mode,
					'is_ranked': entry.is_ranked,
					'joined_at': entry.joined_at,
					'queue_size': MatchmakingQueue.objects.filter(
						game_mode=entry.game_mode,
						is_ranked=entry.is_ranked
					).count(),
					'waiting_time': (entry.joined_at.timestamp() - entry.joined_at.timestamp()) // 60
				})
			
			return Response({
				'status': 'success',
				'in_queue': True,
				'queue_info': {
					'modes': queue_info,
					'user_elo': user.elo_rating,
					'available_modes': [mode[0] for mode in ChessGame.GAME_MODES]
				}
			})
		else:
			return Response({
				'status': 'success',
				'in_queue': False,
				'available_modes': [mode[0] for mode in ChessGame.GAME_MODES]
			})
