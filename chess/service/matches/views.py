from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.models import ChessGame, PendingInvitation, User, MatchmakingQueue
from core.utils.event_domain import publish_event
from django.db.models import Q
import uuid

from .serializers import (
    ChessGameSerializer,
    ChessGameHistorySerializer,
    PendingInvitationDetailSerializer,
    PendingMatchesSerializer
)

class MatchHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        history = user.games.filter(status='finished')
        serializer = ChessGameHistorySerializer(history, many=True)
        return Response({
            "status": "success",
            "message": "Match history retrieved successfully",
            "matches": serializer.data
        })

class MatchDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, match_id):
        try:
            match = ChessGame.objects.get(id=match_id)
        except ChessGame.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Match not found"
            }, status=404)

        serializer = ChessGameSerializer(match)
        return Response({
            "status": "success",
            "message": "Match details retrieved successfully",
            "match": serializer.data
        })

class PendingInvitationCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if MatchmakingQueue.objects.filter(user=request.user).exists():
            return Response({
                "status": "error",
                "message": "You cannot send invitations while in matchmaking queue"
            }, status=status.HTTP_400_BAD_REQUEST)
            
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
        game = ChessGame.objects.create(
            player_white=sender,
            player_black=receiver_user,
            status='pending',
            available=True,
            game_mode='classic'
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
        
        publish_event('chess', 'chess.match_invitation', event)
        
        invitation_data = {
            "sender": invitation.sender.username,
            "receiver": invitation.receiver.username,
            "token": invitation.token,
            "created_at": invitation.created_at
        }
        
        return Response({
            "status": "success",
            "message": "Invitation created successfully",
            "invitation": invitation_data
        }, status=status.HTTP_201_CREATED)

class PendingInvitationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, token):  # Changed from patch to get
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
        existing_game = ChessGame.objects.filter(
            (Q(player_white=request.user) | Q(player_black=request.user)) &
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
        
        user_in_queue = MatchmakingQueue.objects.filter(user=request.user).first()
        if user_in_queue:
            was_in_queue = True
            queue_info = {
                'game_mode': user_in_queue.game_mode,
                'is_ranked': user_in_queue.is_ranked
            }
            user_in_queue.delete()
        else:
            was_in_queue = False
            queue_info = None
        
        game = invitation.game
        game.status = 'in_progress'
        game.save()
        token = invitation.token
        invitation.delete()
        
        event = {
            'game_key': str(game.game_key),
            'invitation_token': str(token),
            'accepted_by': request.user.id,
            'invited_by': game.player_white.id
        }
        
        publish_event('chess', 'chess.match_accepted', event)
        
        response_data = {
            "status": "success",
            "message": "Successfully joined the match",
            "game_key": str(game.game_key)
        }
        
        if was_in_queue:
            response_data["removed_from_queue"] = True
            response_data["queue_info"] = queue_info
        
        return Response(response_data)

class InProgressMatchesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        in_progress_match = ChessGame.objects.filter(
            status='in_progress',
            available=True
        ).filter(Q(player_white=user) | Q(player_black=user)).first()
        
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
                
            event = {
                'invitation_token': str(invitation.token),
                'denied_by': invitation.receiver.id,
                'invited_by': invitation.sender.id
            }
            invitation.delete()
            publish_event('chess', 'chess.invitation_decline', event)
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
                
            event = {
                'invitation_token': str(invitation.token),
                'cancelled_by': invitation.sender.id,
                'invited_user': invitation.receiver.id
            }
            invitation.delete()
            publish_event('chess', 'chess.invitation_cancelled', event)
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