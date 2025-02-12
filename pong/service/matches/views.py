from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import models
from core.models import MatchHistory, MatchInvitation, PongGame
from .serializers import (
    MatchHistorySerializer,
    MatchInvitationSerializer,
    MatchInvitationDetailSerializer,
    PendingMatchesSerializer
)
from rest_framework.permissions import IsAuthenticated

class MatchHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user_id = request.user.id
        history = MatchHistory.objects.filter(user__user_id=user_id)
        serializer = MatchHistorySerializer(history, many=True)
        return Response({"status": "success", "data": serializer.data})


class MatchInvitationView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        sender_id = request.user.id
        request.data['sender'] = sender_id
        serializer = MatchInvitationSerializer(data=request.data)
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

    def get(self, request):
        user_id = request.user.id
        invitations = MatchInvitation.objects.filter(receiver__user_id=user_id, status='pending')
        serializer = MatchInvitationSerializer(invitations, many=True)
        return Response({
            "status": "success",
            "data": serializer.data
        })


class MatchInvitationDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request, invitation_id):
        try:
            invitation = MatchInvitation.objects.get(id=invitation_id)
        except MatchInvitation.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Invitation not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = MatchInvitationDetailSerializer(invitation, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "status": "success",
                "data": serializer.data
            })
        return Response({
            "status": "error",
            "message": "Invalid data provided",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


class JoinMatchView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, token):
        try:
            invitation = MatchInvitation.objects.get(token=token, status='pending')
        except MatchInvitation.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Invalid or expired token"
            }, status=status.HTTP_404_NOT_FOUND)

        games = invitation.games.all()
        for game in games:
            game.status = 'in_progress'
            game.save()

        invitation.status = 'accepted'
        invitation.save()

        return Response({
            "status": "success",
            "message": "Successfully joined the matches",
            "data": {
                "game_ids": [game.id for game in games]
            }
        })


class PendingMatchesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user_id = request.user.id
        pending_matches = PongGame.objects.filter(
            status='pending',
            available=True
        ).filter(models.Q(player1__user_id=user_id) | models.Q(player2__user_id=user_id))
        serializer = PendingMatchesSerializer(pending_matches, many=True, context={'request': request})
        return Response({
            "status": "success",
            "data": serializer.data
        })
