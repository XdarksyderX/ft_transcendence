from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from core.models import Tournament, TournamentInvitation
from core.utils.event_domain import publish_event
from .tournament import get_tournament_bracket
import uuid

User = get_user_model()

class TournamentListView(APIView):
    def get(self, request):
        tournaments = Tournament.objects.filter(players=request.user)
        
        tournaments_data = []
        for tournament in tournaments:
            tournaments_data.append({
                "name": tournament.name,
                "token": tournament.token,
                "is_organizer": tournament.organizer == request.user
            })
        
        return Response({
            "status": "success",
            "tournaments": tournaments_data
        })

class TournamentCreateView(APIView):
    def post(self, request):
        name = request.data.get('name')
        max_players = request.data.get('max_players')
        if not name:
            return Response({
                "status": "error",
                "message": "The 'name' field is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        if not max_players:
            return Response({
                "status": "error",
                "message": "The 'max_players' field is required."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if max_players != 4 and max_players != 8:
            return Response({
                "status": "error",
                "message": "The 'max_players' field must be 4 or 8."
            }, status=status.HTTP_400_BAD_REQUEST)

        tournament = Tournament.objects.create(name=name, organizer=request.user, max_players=max_players, token=str(uuid.uuid4()))
        tournament.players.add(request.user)
        return Response({
            "status": "success",
            "message": "Tournament created successfully",
            "tournament": {
                "token": tournament.token,
                "name": tournament.name,
                "created_at": tournament.created_at,
                "updated_at": tournament.updated_at
            }
        })

class TournamentInvitationCreateView(APIView):
    def post(self, request, tournament_token, receiver_username):
        if not tournament_token:
            return Response({
                "status": "error",
                "message": "The 'tournament' field is required."
            }, status=status.HTTP_400_BAD_REQUEST)
        if not receiver_username:
            return Response({
                "status": "error",
                "message": "The 'receiver' field is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            tournament = Tournament.objects.get(token=tournament_token, organizer=request.user)
        except Tournament.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Tournament not found or you are not the organizer."
            }, status=404)
        
        if tournament.closed:
            return Response({
                "status": "error",
                "message": "The tournament no longer accepts invitations."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            receiver = User.objects.get(username=receiver_username)
            if receiver not in request.user.friends.all():
                return Response({
                    "status": "error",
                    "message": "You can only invite friends to a tournament."
                }, status=status.HTTP_400_BAD_REQUEST)
            token = str(uuid.uuid4())
            invitation = TournamentInvitation.objects.create(
                tournament=tournament,
                sender=request.user,
                receiver=receiver,
                token=token
            )
            publish_event('pong', 'pong.tournament_invitation', {
                'sender_id': invitation.sender.id,
                'receiver_id': invitation.receiver.id,
                'tournament_token': str(tournament.token),
                'invitation_token': token
            })
            publish_event("pong", "pong.tournament_players_update", {
                "sender_id": invitation.sender.id,
                "receiver_id": invitation.receiver.id,
                "tournament_token": str(invitation.tournament.token),
                "players": [player.id for player in tournament.players.all()],
            })
            return Response({
                "status": "success",
                "message": "Invitation created successfully",
                "invitation": {
                    "id": invitation.id,
                    "sender": invitation.sender.username,
                    "receiver": invitation.receiver.username,
                    "token": invitation.token,
                    "created_at": invitation.created_at
                }
            })
        except User.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Receiver not found."
            }, status=status.HTTP_400_BAD_REQUEST)

class TournamentInvitationAcceptView(APIView):
    def post(self, request, invitation_token):
        if not invitation_token:
            return Response({
                "status": "error",
                "message": "The 'invitation' field is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            invitation = TournamentInvitation.objects.get(token=invitation_token, receiver=request.user)
        except TournamentInvitation.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Invitation not found or you are not the receiver."
            }, status=404)

        tournament = invitation.tournament
        tournament.players.add(invitation.receiver)
        invitation.delete()
        publish_event("pong", "pong.tournament_players_update", {
            "sender_id": invitation.sender.id,
            "receiver_id": invitation.receiver.id,
            "tournament_token": str(invitation.tournament.token),
            "players": [player.id for player in tournament.players.all()],
        })

        if tournament.players.count() == tournament.max_players:
            tournament.closed = True
            tournament.close()
            tournament.save()
            publish_event("pong", "pong.tournament_closed", {
                "tournament_token": str(tournament.token),
                "players_id": [player.id for player in tournament.players.all()]
            })
            remaining_invitations = TournamentInvitation.objects.filter(tournament=tournament)
            for invitation in remaining_invitations:
                invitation.delete()

        return Response({
            "status": "success",
            "message": "Invitation accepted successfully",
            "tournament_token": str(tournament.token)
        })

class TournamentInvitationDenyView(APIView):
    def post(self, request, invitation_token):
        if not invitation_token:
            return Response({
                "status": "error",
                "message": "The 'invitation' field is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            invitation = TournamentInvitation.objects.get(token=invitation_token, receiver=request.user)
        except TournamentInvitation.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Invitation not found or you are not the receiver."
            }, status=404)

        tournament = invitation.tournament
        publish_event("pong", "pong.tournament_players_update", {
            "sender_id": invitation.sender.id,
            "receiver_id": invitation.receiver.id,
            "tournament_token": str(invitation.tournament.token),
            "players": [player.id for player in tournament.players.all()],
        })
        invitation.delete()
        return Response({
            "status": "success",
            "message": "Invitation denied successfully"
        })

class TournamentInvitationCancelView(APIView):
    def post(self, request, invitation_token):
        if not invitation_token:
            return Response({
                "status": "error",
                "message": "The 'invitation' field is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            invitation = TournamentInvitation.objects.get(token=invitation_token, sender=request.user)
        except TournamentInvitation.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Invitation not found or you are not the sender."
            }, status=404)

        invitation.delete()
        return Response({
            "status": "success",
            "message": "Invitation canceled successfully"
        })

class TournamentDeletePlayerView(APIView):
    def post(self, request, token, username):
        if not token:
            return Response({
                "status": "error",
                "message": "The 'tournament' field is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        if not username:
            return Response({
                "status": "error",
                "message": "The 'player' field is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            tournament = Tournament.objects.get(token=token, organizer=request.user)
        except Tournament.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Tournament not found or you are not the organizer."
            }, status=404)

        try:
            player = User.objects.get(username=username)
            if player not in tournament.players.all():
                return Response({
                    "status": "error",
                    "message": "Player not found in the tournament."
                }, status=status.HTTP_400_BAD_REQUEST)

            tournament.players.remove(player)
            publish_event("pong", "pong.tournament_update", {
                "tournament_token": str(tournament.token),
                "players_id": [player.id for player in tournament.players.all()],
                "invited_users_id": [invitation.receiver.id for invitation in tournament.invitations.all()]
            })
            tournament.save()
            return Response({
                "status": "success",
                "message": "Player removed successfully"
            })
        except User.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Player not found."
            }, status=status.HTTP_400_BAD_REQUEST)

class TournamentDetail(APIView):
    def get(self, request, token):
        if not token:
            return Response({
                "status": "error",
                "message": "The 'tournament' field is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            tournament = Tournament.objects.get(token=token)
        except Tournament.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Tournament not found."
            }, status=404)

        if request.user not in tournament.players.all():
            return Response({
                "status": "error",
                "message": "You are not part of this tournament."
            }, status=status.HTTP_400_BAD)

        tournament_serialization = {
            "id": tournament.id,
            "name": tournament.name,
            "organizer": tournament.organizer.username,
            "max_players": tournament.max_players,
            "players": [player.username for player in tournament.players.all()],
            "closed": tournament.closed,
            "created_at": tournament.created_at,
            "updated_at": tournament.updated_at
        }

        if tournament.closed:
            tournament_serialization['bracket'] = get_tournament_bracket(tournament)
        else:
            is_organizer = request.user == tournament.organizer
            invited_users = []
            for invitation in tournament.invitations.all():
                user_data = {
                    "username": invitation.receiver.username,
                }
                if is_organizer:
                    user_data["token"] = invitation.token
                invited_users.append(user_data)
            tournament_serialization['invited_users'] = invited_users
            
        return Response({
            "status": "success",
            "tournament": tournament_serialization
        })

class TournamentDeleteView(APIView):
    def post(self, request, token):
        if not token:
            return Response({
                "status": "error",
                "message": "The 'tournament' field is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            tournament = Tournament.objects.get(token=token, organizer=request.user)
        except Tournament.DoesNotExist:
            return Response({
                "status": "error",
                "message": "Tournament not found or you are not the organizer."
            }, status=404)

        if tournament.closed:
            return Response({
                "status": "error",
                "message": "The tournament is closed, you cannot delete it."
            }, status=status.HTTP_400_BAD_REQUEST)
        publish_event("pong", "pong.tournament_deleted", {
            "tournament_token": str(tournament.token),
            "players_id": [player.id for player in tournament.players.all()],
            "invited_users_id": [invitation.receiver.id for invitation in tournament.invitations.all()]
        })
        tournament.delete()
        return Response({
            "status": "success",
            "message": "Tournament deleted successfully"
        })
