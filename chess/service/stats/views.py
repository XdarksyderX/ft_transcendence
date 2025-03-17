from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.models import ChessStatistics
from .serializers import RankedChessStatisticsSerializer, CasualChessStatisticsSerializer

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
            "data": serializer.data
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
            "data": serializer.data
        }, status=status.HTTP_200_OK)
