from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.models import ChessStatistics
from .serializers import RankedChessStatisticsSerializer, CasualChessStatisticsSerializer
from django.contrib.auth import get_user_model

class RankedChessStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        stats = ChessStatistics.objects.filter(user=user, is_ranked=True).first()
        
        if not stats:
            stats = ChessStatistics.objects.create(user=user, is_ranked=True)
        
        serializer = RankedChessStatisticsSerializer(stats)
        
        return Response({
            "status": "success",
            "message": "Ranked chess statistics retrieved successfully",
            "stats": serializer.data
        }, status=status.HTTP_200_OK)

class CasualChessStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        stats = ChessStatistics.objects.filter(user=user, is_ranked=False).first()
        
        if not stats:
            stats = ChessStatistics.objects.create(user=user, is_ranked=False)
        
        serializer = CasualChessStatisticsSerializer(stats)
        
        return Response({
            "status": "success",
            "message": "Casual chess statistics retrieved successfully",
            "stats": serializer.data
        }, status=status.HTTP_200_OK)

class ChessStats(APIView):
    def get(self, request, username):
        try:
            User = get_user_model()
            user = User.objects.get(username=username)
    
            ranked_stats = ChessStatistics.objects.filter(user=user, is_ranked=True).first()
            if not ranked_stats:
                ranked_stats = ChessStatistics.objects.create(user=user, is_ranked=True)
            casual_stats = ChessStatistics.objects.filter(user=user, is_ranked=False).first()
            if not casual_stats:
                casual_stats = ChessStatistics.objects.create(user=user, is_ranked=False)
            ranked_serializer = RankedChessStatisticsSerializer(ranked_stats)
            casual_serializer = CasualChessStatisticsSerializer(casual_stats)
            
            return Response({
                "status": "success",
                "message": f"Chess statistics for {username} retrieved successfully",
                "stats": {
                    "ranked": ranked_serializer.data,
                    "casual": casual_serializer.data
                }
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                "status": "error",
                "message": f"User with username {username} not found",
                "stats": None
            }, status=status.HTTP_404_NOT_FOUND)
