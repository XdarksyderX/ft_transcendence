from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.models import PongGame, PendingInvitation, User
from core.utils.event_domain import publish_event
from django.db.models import Q
import uuid

from .serializers import (
    PongGameSerializer,
    PongGameHistorySerializer,
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

class MatchDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, match_id):
        try:
            match = PongGame.objects.get(id=match_id)
        except PongGame.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Match not found"
            }, status=404)

        serializer = PongGameSerializer(match)
        return Response({
            "status": "success",
            "message": "Match details retrieved successfully",
            "match": serializer.data
        })

class PendingInvitationCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        receiver_username = request.data.get('receiver')
        if not receiver_username:
            return Response({
                "status": "error",
                "message": "The 'receiver' field is required."
            }, status=status.HTTP_400_BAD_REQUEST)
        try:
            receiver_user = User.objects.get(username=receiver_username)
        except User.DoesNotExist:
            return Response({
                "status": "error",
                "message": "The receiver does not exist."
            }, status=status.HTTP_400_BAD_REQUEST)
        if receiver_user not in request.user.friends.all():
            return Response({
                "status": "error",
                "message": "The user is not your friend."
            }, status=status.HTTP_400_BAD_REQUEST)
        sender = request.user
        game = PongGame.objects.create(
            player1=sender,
            player2=receiver_user,
            status='pending',
            available=True,
            
        )
        invitation = PendingInvitation.objects.create(
            sender=sender,
            receiver=receiver_user,
            game=game,
            token=str(uuid.uuid4())
        )
        event = {
            'sender_id': invitation.sender.id,
            'receiver_id': invitation.receiver.id,
            'invitation_token': invitation.token
        }
        publish_event('pong', 'pong.match_invitation', event)
        invitation = {
            "sender": invitation.sender.username,
            "receiver": invitation.receiver.username,
            "token": invitation.token,
            "created_at": invitation.created_at
        }
        return Response({
            "status": "success",
            "message": "Invitation created successfully",
            "invitation": invitation
        }, status=status.HTTP_201_CREATED)


class PendingInvitationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, token):
        try:
            invitation = PendingInvitation.objects.get(token=token)
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
        existing_game = PongGame.objects.filter(
            (Q(player1=request.user) | Q(player2=request.user)) & 
            Q(status='in_progress')
        ).first()
        
        if existing_game:
            return Response({
                "status": "error",
                "message": "You already have a game in progress"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            invitation = PendingInvitation.objects.get(token=token)
            if invitation.receiver != request.user:
                return Response({
                    "status": "error",
                    "message": "You are not authorized to join this match"
                }, status=status.HTTP_403_FORBIDDEN)
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


class InProgressMatchesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        in_progress_match = PongGame.objects.filter(
            status='in_progress',
            available=True
        ).filter(Q(player1=user) | Q(player2=user)).first()
        
        if in_progress_match:
            serializer = PendingMatchesSerializer(in_progress_match, context={'request': request})
            match_data = serializer.data
        else:
            match_data = None

        return Response({
            "status": "success",
            "message": "In progress match retrieved successfully",
            "match": match_data
        })

class PendingInvitationDenyView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, token):
        try:
            invitation = PendingInvitation.objects.get(token=token)
            if invitation.receiver != request.user:
                return Response({
                    "status": "error",
                    "message": "You are not authorized to deny this invitation"
                }, status=status.HTTP_403_FORBIDDEN)
            invitation.delete()
            return Response({
                "status": "success",
                "message": "Invitation cancelled successfully"
            })
        except PendingInvitation.DoesNotExist:
            return Response({
                "status": "error", 
                "message": "Invitation not found"
            }, status=status.HTTP_404_NOT_FOUND)

class PendingInvitationCancelView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, token):
        try:
            invitation = PendingInvitation.objects.get(token=token)
            if invitation.sender != request.user:
                return Response({
                    "status": "error",
                    "message": "You are not authorized to cancel this invitation"
                }, status=status.HTTP_403_FORBIDDEN)
            invitation.delete()
            return Response({
                "status": "success",
                "message": "Invitation cancelled successfully"
            })
        except PendingInvitation.DoesNotExist:
            return Response({
                "status": "error", 
                "message": "Invitation not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
class PendingInvitationOutgoingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        outgoing_invitations = PendingInvitation.objects.filter(sender=request.user)
        serializer = PendingInvitationDetailSerializer(outgoing_invitations, many=True)
        return Response({
            "status": "success",
            "message": "Outgoing invitations retrieved successfully",
            "invitations": serializer.data
        })

class PendingInvitationIncomingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        incoming_invitations = PendingInvitation.objects.filter(receiver=request.user)
        serializer = PendingInvitationDetailSerializer(incoming_invitations, many=True)
        return Response({
            "status": "success",
            "message": "Incoming invitations retrieved successfully",
            "invitations": serializer.data
        })