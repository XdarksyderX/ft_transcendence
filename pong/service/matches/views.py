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

class MatchHistoryView(APIView):
    def get(self, request):
        user_id = request.user.id
        if not user_id:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        history = MatchHistory.objects.filter(user__user_id=user_id)
        serializer = MatchHistorySerializer(history, many=True)
        return Response(serializer.data)


class MatchInvitationView(APIView):
    def post(self, request):
        sender_id = request.user.id
        if not sender_id:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        request.data['sender'] = sender_id
        serializer = MatchInvitationSerializer(data=request.data)
        if serializer.is_valid():
            invitation = serializer.save()
            response_data = serializer.data
            response_data['token'] = invitation.token
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        user_id = request.user.id
        if not user_id:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        invitations = MatchInvitation.objects.filter(receiver__user_id=user_id, status='pending')
        serializer = MatchInvitationSerializer(invitations, many=True)
        return Response(serializer.data)


class MatchInvitationDetailView(APIView):
    def patch(self, request, invitation_id):
        try:
            invitation = MatchInvitation.objects.get(id=invitation_id)
        except MatchInvitation.DoesNotExist:
            return Response({'error': 'Invitation not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MatchInvitationDetailSerializer(invitation, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JoinMatchView(APIView):
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            invitation = MatchInvitation.objects.get(token=token, status='pending')
        except MatchInvitation.DoesNotExist:
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_404_NOT_FOUND)
        invitation.status = 'accepted'
        invitation.save()
        return Response({'message': 'Successfully joined the match', 'game_id': invitation.game.id})


class PendingMatchesView(APIView):
    def get(self, request):
        user_id = request.user.id
        if not user_id:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        pending_matches = PongGame.objects.filter(
            status='pending',
            available=True
        ).filter(models.Q(player1__user_id=user_id) | models.Q(player2__user_id=user_id))
        serializer = PendingMatchesSerializer(pending_matches, many=True, context={'request': request})
        return Response(serializer.data)
