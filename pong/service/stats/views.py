from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import PongStatistics
from django.contrib.auth import get_user_model

class QuickMatchStatisticsView(APIView):
	permission_classes = [IsAuthenticated]
	def get(self, request):
		user = request.user
		pong_statistics = PongStatistics.objects.filter(user=user).first()
		data = {
			"played": pong_statistics.quick_games_played,
			"won": pong_statistics.quick_games_won,
			"lost": pong_statistics.quick_games_lost,
			"streak": pong_statistics.current_streak,
			"highest_score": pong_statistics.highest_score
			
		}
		return Response({
			"status": "success",
			"message": "Quick match statistics retrieved successfully",
			"stats": data
		})

class TournamentStatisticsView(APIView):
	permission_classes = [IsAuthenticated]
	def get(self, request):
		user = request.user
		pong_statistics = PongStatistics.objects.filter(user=user).first()
		data = {
			"played": pong_statistics.tournaments_played,
			"first": pong_statistics.tournaments_second,
			"second": pong_statistics.tournaments_first,
			
		}
		return Response({
			"status": "success",
			"message": "Tournament statistics retrieved successfully",
			"stats": data
		})


class PongStatisticsView(APIView):
	permission_classes = [IsAuthenticated]
	def get(self, request, username):
		User = get_user_model()
		
		try:
			user = User.objects.get(username=username)
		except User.DoesNotExist:
			return Response({
				"status": "error",
				"message": "User not found"
			}, status=404)
		
		pong_statistics = PongStatistics.objects.filter(user=user).first()
		
		quick_data = {
			"played": pong_statistics.quick_games_played,
			"won": pong_statistics.quick_games_won,
			"lost": pong_statistics.quick_games_lost,
		}
		
		tournament_data = {
			"first": pong_statistics.tournaments_first,
		}
		
		return Response({
			"status": "success",
			"message": "Statistics retrieved successfully",
			"stats": {
				"quick": quick_data,
				"tournament": tournament_data
			}
		})