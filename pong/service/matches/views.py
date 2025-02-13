from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import models
from rest_framework.permissions import IsAuthenticated
from core.models import PongGame, PendingInvitation

from .serializers import (
    PongGameHistorySerializer,
    PendingInvitationSerializer,
    PendingInvitationDetailSerializer,
    PendingMatchesSerializer
)

class MatchHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        history = user.games.filter(status='finished')
        serializer = PongGameHistorySerializer(history, many=True)
        return Response({
            "status": "success",
            "message": "Match history retrieved successfully",
            "matches": serializer.data
        })


class PendingInvitationCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.data['sender'] = request.user.id
        serializer = PendingInvitationSerializer(data=request.data)
        if serializer.is_valid():
            invitation = serializer.save()
            return Response({
                "status": "success",
                "message": "Invitation created successfully",
                "data": {**serializer.data, "token": invitation.token}
            }, status=status.HTTP_201_CREATED)
        return Response({
            "status": "error",
            "message": "Invalid data provided",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class PendingInvitationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        invitations = PendingInvitation.objects.filter(receiver=request.user)
        serializer = PendingInvitationSerializer(invitations, many=True)
        return Response({
            "status": "success",
            "message": "Pending invitations retrieved successfully",
            "pending_invitations": serializer.data
        })


class PendingInvitationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, invitation_id):
        try:
            invitation = PendingInvitation.objects.get(id=invitation_id)
        except PendingInvitation.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Invitation not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = PendingInvitationDetailSerializer(invitation, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"status": "success", "data": serializer.data})
        return Response({
            "status": "error",
            "message": "Invalid data provided",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class JoinMatchView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, token):
        try:
            invitation = PendingInvitation.objects.get(token=token)
        except PendingInvitation.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Invalid or expired token"
            }, status=status.HTTP_404_NOT_FOUND)

        game = invitation.game
        game.status = 'in_progress'
        game.save()
        invitation.delete()

        return Response({
            "status": "success",
            "message": "Successfully joined the match",
            "data": {"game_id": game.id}
        })


class PendingMatchesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        pending_matches = PongGame.objects.filter(
            status='pending',
            available=True
        ).filter(models.Q(player1=user) | models.Q(player2=user))
        serializer = PendingMatchesSerializer(pending_matches, many=True, context={'request': request})
        return Response({
            "status": "success",
            "data": serializer.data
        })
