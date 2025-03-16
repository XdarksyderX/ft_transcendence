from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.models import ChessStatistics
from django.db.models import Q
from .serializers import ChessStatisticsSerializer
import uuid

class ChessStatsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		# Recuperar las estadísticas del usuario autenticado
		user = request.user
		stats = ChessStatistics.objects.filter(user=user).first()
		
		# Create stats if not exists
		if not stats:
			stats = ChessStatistics.objects.create(user=user)
		
		# Serialize the stats
		serializer = ChessStatisticsSerializer(stats)
		
		return Response({
			"status": "success",
			"message": "Chess statistics retrieved successfully",
			"data": serializer.data
		}, status=status.HTTP_200_OK)
